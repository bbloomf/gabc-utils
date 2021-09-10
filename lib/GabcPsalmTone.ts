import { VerseSegmentType } from "./VerseText";
import { shiftGabc } from "./shiftGabc";

export type GabcPsalmTones = GabcPsalmToneChunk & {
  lines?: (GabcPsalmToneChunk | GabcPsalmTone[])[];
  isMeinrad: boolean;
  isGregorianSolemn?: boolean;
  originalGabc?: string;
  clef: string;
};
export type GabcPsalmToneChunk = {
  [VerseSegmentType.Flex]?: GabcPsalmTone;
  [VerseSegmentType.Mediant]?: GabcPsalmTone;
  [VerseSegmentType.Termination]: GabcPsalmTone;
};
export type GabcPsalmToneOptions = {
  treatAsOneAccentWithXPreparatory?: boolean;
  useFlex?: boolean;
  isMeinrad?: boolean;
  isGregorianSolemn?: boolean;
};

export type GabcSingleTone = {
  gabc: string;
  accent?: boolean;
  open?: boolean;
  toneAccentFork?: GabcSingleTone[][];
};
type GabcInfo = {
  tenor?: string;
  flex?: string;
  intonation: GabcSingleTone[];
  preparatory: GabcSingleTone[];
  afterLastAccent: GabcSingleTone[];
  accents: GabcSingleTone[][];
};
type SyllableCounts = {
  intonation: number;
  accents: number;
  preparatory: number;
  afterLastAccent: number;
};

export class GabcPsalmTone {
  getFlexTone(language: string): GabcInfo {
    const { tenor, flex } = this.gabc;
    const tenorFlexDrop = parseInt(tenor, 23) - parseInt(flex, 23);
    const preparatory = [];
    let afterLastAccent, accents;
    if (language === "la") {
      afterLastAccent = [{ gabc: flex ? `${flex}.` : "" }];
      accents = [
        [
          { accent: true, gabc: tenor || "" },
          { open: true, gabc: flex || "" }
        ]
      ];
    } else {
      afterLastAccent = [];
      accents = [
        [
          {
            gabc: "",
            accent: true,
            toneAccentFork: [
              [{ gabc: tenorFlexDrop === 1 ? flex : tenor }],
              [{ gabc: tenor }, { gabc: flex }],
              [{ gabc: tenor }, { gabc: flex, open: true }]
            ]
          }
        ]
      ];
    }
    return { ...this.gabc, preparatory, accents, afterLastAccent };
  }
  /**
   * Takes gabc like `(jr//////////k//j)(:)(jr////////h///i//g)(::)` or
   *                 `jr k j : jr h i g ::
   * and
   * @param  {string} gabc GABC code for psalm tone
   * @param  {string} clef GABC clef code
   * @param  {object} options special options as a hash of booleans:
   * treatAsOneAccentWithXPreparatory:
   * @return {{mediant: GabcPsalmTone, termination: GabcPsalmTone}}      object hash with mediant and termination
   */
  static getFromGabc(
    gabc: string,
    options: GabcPsalmToneOptions = {},
    clef?: string
  ): GabcPsalmTones {
    if (!/\|/.test(gabc)) {
      gabc = gabc.replace(/[()]+/g, " ");
    }
    let { useFlex, isGregorianSolemn } = options;
    if (/(^|\n)%\s*flex\s*\n/.test(gabc)) {
      useFlex = true;
    }
    if (/(^|\n)%\s*gregorianSolemn\s*\n/.test(gabc)) {
      isGregorianSolemn = true;
    }
    gabc = gabc.replace(/(^|\n)(%[^\n]*\n)+/g, "$1");
    let originalGabc = gabc;
    let clefMatch = /^[^a-m]*((?:cb?|f)[1-4])/.exec(gabc);
    if (clefMatch) {
      const detectedClef = clefMatch[1],
        desiredClef = clef;
      if (clef && clef[0] === detectedClef[0]) {
        const detectedClefPosition = parseInt(detectedClef.slice(-1)),
          desiredClefPosition = parseInt(clef.slice(-1)),
          shift = 2 * (desiredClefPosition - detectedClefPosition);
        // shift the psalm tone
        try {
          gabc = shiftGabc(gabc, shift);
        } catch (exception) {
          clef = detectedClef;
        }
        if (clef.length !== detectedClef.length) {
          const newClefHasAccidental = clef.length === 3;
          // find pitch of accidental based on clef position:
          const accid = String.fromCharCode(
            desiredClefPosition * 2 + "a".charCodeAt(0)
          );
          // can't make a reciting tone to have an accidental, so if that's the case,
          // just shift the detected clef, without adding or removing the accidental
          if (new RegExp(`${accid}r`).test(gabc)) {
            clef = detectedClef.slice(0, -1) + clef.slice(-1);
          } else if (newClefHasAccidental) {
            // remove accidentals from the psalm tone, and add naturals to any pitches that weren't marked with a flat
            gabc = gabc.replace(
              new RegExp(`([^xy])${accid}([^xy]|$)`, "g"),
              `$1${accid}y${accid}$2`
            );
            gabc = gabc.replace(new RegExp(`${accid}x${accid}`, "g"), accid);
          } else {
            // add accidentals to the psalm tone, since they are no longer in the clef:
            gabc = gabc.replace(
              new RegExp(`([^xy])${accid}([^xy]|$)`, "g"),
              `$1${accid}x${accid}`
            );
            gabc = gabc.replace(new RegExp(`${accid}y${accid}`, "g"), accid);
          }
        }
      } else {
        clef = detectedClef;
      }
      gabc = gabc.slice(clefMatch.index + clefMatch[0].length);
    } else if (!clef) {
      clef = "c4";
    }
    originalGabc = (clef + " " + gabc.trim())
      .replace(/\(([^|)]+)[^)]*\)/g, "$1") // remove all but the first option from parenthetic option groups, e.g. (option 1|option 2|option 3)
      .replace(/\s+([a-m][xy][a-mA-M])/, "/$1"); // use a single / instead of whitespace before accidentals
    if (/'/.test(gabc)) {
      options.treatAsOneAccentWithXPreparatory = false;
    };
    if (!options.treatAsOneAccentWithXPreparatory) {
      // convert psalm tone GABC notation to something with visible accent marks and reciting tone marked
      originalGabc = originalGabc
        .replace(/((?:^|\n|:)[^\n:r]*?[a-m]r)([\s/])/g, "$10$2") // convert initial punctum cavum to reciting tone
        .replace(/(\s[^'\s]+)[\s/]+((?:[a-m][xy])?[a-m]r)([\s/]+)'([^ /]+)/g, "$1//////$2[ocba:1{]$3$4[ocba:0}]") // add bracketed accents
        .replace(/'((?:[a-m][xy])?[a-m])/g, "$1r1") // replace accented puncta with proper code to display accents
        .replace(/r0\s+/g,'r0////////') // add extra space after reciting tone
        .replace(/r\s+((?:[^r\s,;:]*\s+)*)((?:[a-m][xy])?[a-m]r1)/g,'r//////$1$2'); // add extra space between puncta cava and accented tones
    }
    gabc = gabc.replace(/\/{2,}/g, " ").replace(/::\s*$/, "");
    let gabcSegments = gabc.split(/\s+:+\s+/);

    let gabcPsalmTones = gabcSegments.map((gabc) => {
      gabc = gabc.trim();
      if (options.treatAsOneAccentWithXPreparatory && !/'/.test(gabc)) {
        let match = gabc.match(/\s(([^\sr',;:()])+)$/);
        if (match) {
          // jr h i g => jr h i 'g gr g
          gabc =
            gabc.slice(0, match.index) +
            " '" +
            match[1] +
            " " +
            match[2].toLowerCase() +
            "r " +
            match[2].toLowerCase();
        }
      }
      gabc = gabc.replace(
        /\s'?\(([^r|)]+\|[^r]*)\s([^\sr',;:()])\)$/,
        " '($1 $2r $2)"
      );
      return new GabcPsalmTone(gabc, "", !useFlex, clef);
    });
    const isMeinrad =
      !!options.isMeinrad || gabcPsalmTones.length === 2 + 3 + 4 + 5 + 6;
    const result: GabcPsalmTones = {
      [VerseSegmentType.Mediant]: gabcPsalmTones[0],
      [VerseSegmentType.Termination]: gabcPsalmTones[1],
      isMeinrad,
      isGregorianSolemn,
      originalGabc,
      clef
    };
    if (isMeinrad) {
      if (gabcPsalmTones.length != 2 + 3 + 4 + 5 + 6) {
        console.warn(
          `Incorrect number of psalm tone lines given for Meinrad type psalm tone.  Expected 20, but received ${gabcPsalmTones.length}`
        );
      }
      const lines = [];
      for (let i = 0, count = 2; i < gabcPsalmTones.length; i += count++) {
        lines[count] = gabcPsalmTones.slice(i, i + count);
      }
      result.lines = lines;
    } else {
      const lines = (result.lines = []);
      for (let i = 0; i < gabcPsalmTones.length; i += 2) {
        const psalmTones: GabcPsalmTones = {
          [VerseSegmentType.Mediant]: gabcPsalmTones[i],
          [VerseSegmentType.Termination]: gabcPsalmTones[i + 1],
          isMeinrad: false,
          clef
        };
        lines.push(psalmTones);
      }
    }
    return result;
  }

  tones: GabcSingleTone[];
  clef: string;
  gabc: GabcInfo;
  syllableCounts: SyllableCounts;

  static readonly getTonesForGabcString = (gabc) => {
    let match;
    let regexToneGabc = /(')?(?:\(([^)]+)\)|([^\sr]+)(r)?)(?=$|\s)/gi;
    let tones: GabcSingleTone[] = [];
    while ((match = regexToneGabc.exec(gabc))) {
      let result: GabcSingleTone = {
        accent: match[1] == "'",
        gabc: match[3],
        open: match[4] == "r"
      };
      if (match[2]) {
        result.toneAccentFork = match[2]
          .split("|")
          .map((gabc) => GabcPsalmTone.getTonesForGabcString(gabc));
      }
      tones.push(result);
    }
    return tones;
  };

  constructor(gabc: string, prefix = "", flexEqualsTenor = false, clef = "c4") {
    if (prefix) gabc = prefix + gabc;
    let tones = (this.tones = GabcPsalmTone.getTonesForGabcString(gabc));
    var intonation: GabcSingleTone[] = [];
    var accentedTones: GabcSingleTone[][] = [];
    var currentAccentTone;
    var preparatory: GabcSingleTone[] = [];
    var afterLastAccent: GabcSingleTone[] = [];
    var state = 3;
    var lastOpen = undefined;
    var toneTenor;
    var toneFlex;
    for (var i = tones.length - 1; i >= 0; --i) {
      var ton = tones[i];
      if (ton.accent) {
        if (intonation.length > 0) {
          // if we already have an intonation, then we need to add to it to that, and not to accentedTones
          intonation.unshift(ton);
          continue;
        }
        currentAccentTone = [ton];
        accentedTones.unshift(currentAccentTone);
        state = 1;
        if (lastOpen) {
          currentAccentTone.push(lastOpen);
          if (preparatory.length) {
            currentAccentTone.push(...preparatory);
          }
          lastOpen = undefined;
        } else if (tones[i - 1].open) {
          currentAccentTone.unshift(tones[i - 1]);
          --i;
        }
        preparatory = [];
      } else if (ton.open) {
        toneTenor = ton.gabc[0];
        if (state == 3) {
          // initial state: no accents have been found yet
          if (accentedTones.length == 0 && (i == 0 || !tones[i - 1].accent)) {
            // if we got all the way to the beginning or the intonation, what we
            // had considered to be after the last accent should really be
            // interpreted as preparatory syllables
            preparatory = afterLastAccent;
            afterLastAccent = [];
          }
          state = 1;
        }
        lastOpen = ton;
      } else if (state == 3) {
        // initial state: no accents or puncta cava have been found yet
        afterLastAccent.unshift(ton);
      } else if (state == 1) {
        // state 1 means there has already been found an accent or punctum cavum
        if (!lastOpen) {
          // the following tone to this one is an accent, so this must be a
          // preparatory syllable:
          preparatory.unshift(ton);
        } else {
          // the following tone to this one is a cavum, so this is probably an
          // intonation syllable, but we won't consider it as such if has the
          // same GABC code as the the tenor (or if we have already gotten the
          // last syllable of the intonation)
          if (intonation.length > 0 || ton.gabc != lastOpen.gabc)
            intonation.unshift(ton);
          continue;
        }
        lastOpen = undefined;
      }
    }
    if (toneTenor) {
      if (flexEqualsTenor) {
        toneFlex = toneTenor;
      } else {
        // calculate flex tone based on it being a full tone below the tenor,
        // unless this would only be a semitone in the psalm tone's clef
        let clefI = clef[0] == "f" ? 6 : 1;
        clefI += +parseInt(clef.slice(-1)) * 2;
        let toneNumber = (parseInt(toneTenor, 36) - 10 + 16 - clefI) % 8;
        let code = toneTenor.charCodeAt(0);
        code -= toneNumber == 0 || toneNumber == 3 ? 2 : 1;
        toneFlex = String.fromCharCode(code);
      }
    }
    this.clef = clef;
    this.gabc = {
      tenor: toneTenor,
      flex: toneFlex,
      intonation,
      preparatory,
      afterLastAccent,
      accents: accentedTones
    };
    this.syllableCounts = {
      intonation: intonation.length,
      accents: accentedTones.length,
      preparatory: preparatory.length,
      afterLastAccent: afterLastAccent.length
    };
  }
}
