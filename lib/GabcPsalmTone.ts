import { VerseSegmentType } from "./VerseText";
import { shiftGabc } from "./shiftGabc";

export type GabcPsalmTones = {
  [VerseSegmentType.Flex]?: GabcPsalmTone;
  [VerseSegmentType.Mediant]: GabcPsalmTone;
  [VerseSegmentType.Termination]: GabcPsalmTone;
  originalGabc: string;
  clef: string;
};
export type GabcPsalmToneOptions = {
  treatAsOneAccentWithXPreparatory?: boolean;
};

type GabcSingleTone = {
  gabc: string;
  accent?: boolean;
  open?: boolean;
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
    gabc = gabc.replace(/[()]+/g, " ");
    let originalGabc = gabc;
    let clefMatch = /^[^a-m]*((?:cb?|f)[1-4])/.exec(gabc);
    if (clefMatch) {
      const detectedClef = clefMatch[1],
        desiredClef = clef;
      if (clef && clef.slice(0, -1) === detectedClef.slice(0, -1)) {
        const detectedClefPosition = parseInt(detectedClef.slice(-1)),
          desiredClefPosition = parseInt(clef.slice(-1)),
          shift = 2 * (desiredClefPosition - detectedClefPosition);
        // shift the psalm tone
        try {
          gabc = shiftGabc(gabc, shift);
        } catch (exception) {
          clef = detectedClef;
        }
      } else {
        clef = detectedClef;
      }
      gabc = gabc.slice(clefMatch.index + clefMatch[0].length);
    } else if (!clef) {
      clef = "c4";
    }
    originalGabc = clef + " " + gabc.trim();
    gabc = gabc.replace(/\/+/g, " ");
    let gabcSegments = gabc.split(" : ");
    if (gabcSegments.length != 2) {
      console.warn("GabcPsalmTone.getFromGabc called on invalid GABC:", gabc);
    }
    let gabcPsalmTones = gabcSegments.map(gabc => {
      gabc = gabc.replace(/::\s*$/, "").trim();
      if (options.treatAsOneAccentWithXPreparatory) {
        let match = gabc.match(/\s(([^\sr',;:])+)$/);
        if (match) {
          // jr h i g => jr h i 'g gr g
          gabc =
            gabc.slice(0, -match[0].length) +
            " '" +
            match[1] +
            " " +
            match[2].toLowerCase() +
            "r " +
            match[2].toLowerCase();
        }
      }
      return new GabcPsalmTone(gabc, "", true, clef);
    });
    return {
      [VerseSegmentType.Mediant]: gabcPsalmTones[0],
      [VerseSegmentType.Termination]: gabcPsalmTones[1],
      originalGabc,
      clef
    };
  }

  tones: GabcSingleTone[];
  clef: string;
  gabc: GabcInfo;
  syllableCounts: SyllableCounts;

  constructor(gabc: string, prefix = "", flexEqualsTenor = false, clef = "c4") {
    let tones: GabcSingleTone[] = (this.tones = []);
    if (prefix) gabc = prefix + gabc;
    let match;
    let index = 0;
    let regexToneGabc = /(')?(([^\sr]+)(r)?)(?=$|\s)/gi;
    while ((match = regexToneGabc.exec(gabc))) {
      tones.push({
        accent: match[1] == "'",
        gabc: match[3],
        open: match[4] == "r"
      });
    }
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
        currentAccentTone = [ton];
        accentedTones.unshift(currentAccentTone);
        state = 1;
        if (lastOpen) {
          currentAccentTone.push(lastOpen);
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
          if (intonation.length > 0 || ton.gabc != lastOpen.gabc) intonation.unshift(ton);
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
