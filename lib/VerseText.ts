import { applyStyleToSyllables } from "./applyStyleToSyllables";
import { findLatinPhraseAccents } from "./findLatinPhraseAccent";
import { findLatinWordAccent } from "./findLatinWordAccent";
import { findSpanishPhraseAccents } from "./findSpanishPhraseAccent";
import { findSpanishWordAccent } from "./findSpanishWordAccent";
import { GabcPsalmTone, GabcPsalmTones, GabcSingleTone } from "./GabcPsalmTone";
import { removeSolesmesMarkingsInMixedGabc } from "./removeSolesmesMarkings";
export type Syllabifier = (word: string) => string[];
export type WordAccentFinder = (word: VerseSyllable[]) => void;
export type PhraseAccentFinder = (phrase: VerseWord[]) => void;
export type FormattedString = {
  text: string;
  style?: "bold" | "italic" | "" | null;
};
export enum VerseSegmentType {
  Flex = "flex",
  Mediant = "mediant",
  Termination = "termination"
}
export type Language = "en"|"es"|"la";
export interface VerseGabcOptions {
  startVersesOnNewLine?: boolean;
  stripFlexMediantSymbols?: boolean;
  addSequentialVerseNumbersStartingAt?: number;
  addInitialVerseNumber?: number | string;
  minSylsOnRecitingTone?: number;
  useLargeInitial?: boolean;
  removeSolesmesMarkings?: boolean;
  barDictionary?: { [k in VerseSegmentType]: string };
};

export interface VerseTextArgs {
  text: string,
  isEaster?: boolean,
  language?: Language,
  syllabify?: Syllabifier,
}
export class VerseText {
  static readonly defaultSyllabify: Syllabifier = (text) =>
    text
      .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, "$1-")
      .replace(/\s+--\s+/g, "+")
      .replace(/(\|\S+\|)(\S)/gi, "$1+$2")
      .replace(/(\S)(\|\S+\|)/gi, "$1+$2")
      .replace(/(\S-)\+?(\S)/gi, "$1+$2")
      .split(/\+/g);
  segments: VerseSegment[];
  stanzas: VerseSegment[][];
  language: Language;

  /**
   *
   * @param text the text to be split into segments
   * @param syllabify a function that takes a word string and returns an array of its syllables
   */
  constructor(
    text: string | VerseTextArgs,
    isEaster: boolean | undefined = false,
    syllabify: Syllabifier = VerseText.defaultSyllabify,
    language: Language = 'en',
  ) {
    if (typeof text === "object") {
      ({ text, isEaster, language, syllabify } = text);
    }
    if (isEaster) {
      text = text.replace(/\s*([???*]?)\s*\(([???*]?)\)/g, ' $2');
      text = text.replace(
        /([,;:.!?])?(\s+[???*])?(\s)\s*\([ET]\.\s*[TP]\.\s*([^)]+)\)/g,
        (_, punctuation, flexMediant, whitespace, alleluia) =>
          `${punctuation || ","}${flexMediant || ""}${whitespace}${alleluia}`
      );
    } else if (isEaster === false) {
      text = text.replace(/\s*([???*]?)\s*\(([???*]?)\)/g, ' $1');
      text = text.replace(/\s*\([ET]\.\s*[TP]\.[^)]+\)/g,'');
    }
    const stanzas = text.split(/\n\s*\n/);
    this.stanzas = stanzas.map(stanza => VerseText.splitIntoSegments(stanza, syllabify, language));
    this.segments = this.stanzas.flat();
    this.language = language;
  }

  /**
   * Returns a verse with GABC
   * @param  {Object} psalmTone hash of GabcPsalmTones for flex, mediant, and termination
   * @return {string}           GABC string
   */
  withGabc(
    psalmTone: GabcPsalmTones,
    {
      startVersesOnNewLine = false,
      stripFlexMediantSymbols = true,
      addSequentialVerseNumbersStartingAt = 0,
      addInitialVerseNumber,
      minSylsOnRecitingTone = psalmTone.isGregorianSolemn ? -1 : 2,
      useLargeInitial = true,
      removeSolesmesMarkings = false,
      barDictionary = {
        [VerseSegmentType.Flex]: ",",
        [VerseSegmentType.Mediant]: ";",
        [VerseSegmentType.Termination]: ":"
      }
    }: VerseGabcOptions = {}
  ) {
    if (psalmTone.isMeinrad) {
      // some default overrides for meinrad tones, and a check to make sure there are 2-6 segments
      const stanzaLengths = this.stanzas.map(segments => segments.length);
      if (Math.min(...stanzaLengths) < 2 || Math.max(...stanzaLengths) > 6) {
        throw `Cannot use a Meinrad tone with a [${stanzaLengths.join(', ')}] line text.`;
      }
      stripFlexMediantSymbols = true;
      barDictionary[VerseSegmentType.Flex] = ";";
    } else if (psalmTone.isGregorianSolemn) {
      barDictionary[VerseSegmentType.Flex] = barDictionary[VerseSegmentType.Mediant] = ":";
    }
    let nextSequentialVerseNumber : number | string = addSequentialVerseNumbersStartingAt;
    if (addInitialVerseNumber !== undefined) {
      nextSequentialVerseNumber = addInitialVerseNumber;
    } else {
      addInitialVerseNumber = 0;
    }
    if (nextSequentialVerseNumber <= 0) {
      nextSequentialVerseNumber = 0;
    }
    const getNextVerseNumberString = (stanzaI) => {
      const { verseMarker } = this.stanzas[stanzaI]?.[0];
      if (verseMarker) return verseMarker + ' ';
      if (addInitialVerseNumber) {
        const result = `${nextSequentialVerseNumber}. `;
        addInitialVerseNumber = 0;
        nextSequentialVerseNumber = 0;
        return result;
      }
      return (nextSequentialVerseNumber && typeof nextSequentialVerseNumber === "number")
        ? `${nextSequentialVerseNumber++}. `
        : "";
    };
    useLargeInitial =
      useLargeInitial &&
      !addSequentialVerseNumbersStartingAt &&
      !addInitialVerseNumber;
    let verseMarker: string;
    return `(${psalmTone.clef}) ` + (
      this.stanzas.map((stanza, i) =>
        (verseMarker = getNextVerseNumberString(i)) + 
        this.getStanzaGabc(psalmTone, i, {
          startVersesOnNewLine,
          stripFlexMediantSymbols,
          minSylsOnRecitingTone,
          useLargeInitial: useLargeInitial && i === 0 && verseMarker === '',
          barDictionary,
          removeSolesmesMarkings,
        })
      ).join('\n\n')
    );
  }

  getStanzaGabc(
    psalmTone: GabcPsalmTones,
    i: number,
    {
      startVersesOnNewLine = false,
      stripFlexMediantSymbols = true,
      minSylsOnRecitingTone = 2,
      useLargeInitial = true,
      barDictionary = {
        [VerseSegmentType.Flex]: ",",
        [VerseSegmentType.Mediant]: ";",
        [VerseSegmentType.Termination]: ":"
      },
      removeSolesmesMarkings = false,
    }: VerseGabcOptions = {}
  ) {
    const segments = this.stanzas[i];
    const stanzaCount = segments.filter(
      (segment) => segment.segmentType === VerseSegmentType.Termination
    ).length;
    let stanzaI = 0;
    let intonationFollowingFlex: GabcSingleTone[] = null;
    if (psalmTone.isGregorianSolemn) {
      const termination = psalmTone[VerseSegmentType.Termination];
      const mediant = psalmTone[VerseSegmentType.Mediant];
      intonationFollowingFlex = termination.gabc.intonation.flatMap((tone) =>
        tone.toneAccentFork
          ? tone.toneAccentFork[tone.toneAccentFork.length - 1]
          : tone
      );
      if (termination.gabc.tenor !== mediant.gabc.tenor) {
        // handle cases like in tone 6, where the tenor of the termination is different from the tenor of the mediant
        // by changing the intonation to only include the notes required to get to the tenor pitch
        let firstMediantTenor = intonationFollowingFlex.findIndex(
          (tone) => tone.gabc === mediant.gabc.tenor
        );
        if (firstMediantTenor < 0) {
          firstMediantTenor =
            1 +
            intonationFollowingFlex.findIndex(
              (tone) => tone.gabc.indexOf(mediant.gabc.tenor) >= 0
            );
        }
        intonationFollowingFlex = intonationFollowingFlex.slice(
          0,
          firstMediantTenor
        );
      }
    }
    let forceNoIntonation = false;
    return (
      segments
        .map((seg, i, segments) => {
          let forceBar: string;
          let useFlex = seg.segmentType === VerseSegmentType.Flex,
            segmentName = useFlex ? VerseSegmentType.Mediant : seg.segmentType,
            tone = psalmTone[segmentName],
            intonation: boolean | GabcSingleTone[] = false;
          if (psalmTone.isMeinrad) {
            tone = psalmTone.lines[segments.length][i];
            useFlex = false;
          } else if (psalmTone.lines.length > 1) {
            let toneIndex;
            if (psalmTone.lines.length === 2) {
              toneIndex = stanzaI < stanzaCount - 1 ? 0 : 1;
            } else {
              toneIndex = Math.floor(
                (psalmTone.lines.length * stanzaI) / stanzaCount
              );
            }
            tone = psalmTone.lines[toneIndex][segmentName];
          }
          if (psalmTone.isGregorianSolemn) {
            useFlex = false;
            intonation = true;
            if (seg.segmentType === VerseSegmentType.Mediant && segments[i - 1]?.segmentType === VerseSegmentType.Flex) {
              intonation = intonationFollowingFlex;
            }
          }
          if (forceNoIntonation) {
            intonation = false;
            // reset for next time:
            forceNoIntonation = false;
          }
          let gabc = seg.withGabc(tone, {
            useIntonation: intonation || i == 0 || i == segments.length - 1, // use intonation on first and last segment, and when required by gregorian solemn tones
            useFlex,
            stripFlexMediantSymbols,
            useLargeInitial: i === 0 && useLargeInitial,
            minSylsOnRecitingTone,
            language: this.language,
            observePause: psalmTone.isGregorianSolemn,
            removeSolesmesMarkings,
            failOnNoIntonation: psalmTone.isGregorianSolemn && seg.segmentType === VerseSegmentType.Flex,
          });
          if (gabc === false) {
            // there were not enough syllables to use the intonation, so we treat it as a pause instead
            const alteredTone = new GabcPsalmTone(tone);
            alteredTone.gabc = {...alteredTone.gabc};
            alteredTone.gabc.accents = [];
            alteredTone.gabc.preparatory = [];
            alteredTone.gabc.afterLastAccent = [];
            gabc = seg.withGabc(alteredTone, {
              useIntonation: intonation || i == 0 || i == segments.length - 1,
              useFlex,
              stripFlexMediantSymbols,
              useLargeInitial: i === 0 && useLargeInitial,
              minSylsOnRecitingTone,
              language: this.language,
              observePause: psalmTone.isGregorianSolemn,
              removeSolesmesMarkings,
              failOnNoIntonation: false,
            }) as string;
            if (!removeSolesmesMarkings) {
              // add dot on last reciting tone:
              gabc = gabc.replace(/\)\s*$/, '.$&');
            }
            forceNoIntonation = true;
            forceBar = ",";
          }
          let bar: string;
          if (psalmTone.isMeinrad) {
            if (i === 0) {
              bar = segments.length === 2 ? ";" : ",";
            } else if (i === segments.length - 1) {
              bar = "::";
            } else {
              bar = i % 2 === 0 ? "," : ";";
            }
          } else {
            bar = barDictionary[seg.segmentType];
          }
          if (forceBar) {
            bar = forceBar;
          }
          if (seg.segmentType === VerseSegmentType.Termination) {
            ++stanzaI;
            if (i === segments.length - 1) {
              // force a double bar on the last segment:
              bar = "::";
            } else if (startVersesOnNewLine) {
              // never add a line break unless it isn't the last segment
              bar += "Z";
            }
          }
          return gabc + ` (${bar})`;
        })
        .join("\n\n")
    );
  }

  toString() {
    return this.segments
      .map((seg, i) => {
        let prevSeg = this.segments[i - 1];
        let indent =
          prevSeg && prevSeg.segmentType != VerseSegmentType.Termination;
        return (indent ? "\t" : "") + seg.toString();
      })
      .join("\n");
  }

  /**
   * Split a text into segments based on the presence of ???, * and \n.
   * @param  {string} text          the text to be split
   * @param  {function} syllabify a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
   * @return {VerseSegment[]}       the array of VerseSegment objects
   */
  static splitIntoSegments(
    text: string,
    syllabify = VerseText.defaultSyllabify,
    language: Language = 'en',
  ): VerseSegment[] {
    let segmentSplit = text.split(/[ \t]*([???*\n/])(\s*)/),
      segments: VerseSegment[] = [];
    for (let i = 0; i < segmentSplit.length; i += 3) {
      let text = segmentSplit[i];
      if (segmentSplit[i + 1]) {
        text += " " + segmentSplit[i + 1];
      }
      segments.push(
        new VerseSegment(
          text,
          syllabify,
          SegmentTypeDictionary[
            segmentSplit[i + 1] as keyof typeof SegmentTypeDictionary
          ],
          segmentSplit[i + 2],
          language,
        )
      );
    }
    return segments;
  }
}

const SegmentTypeDictionary = {
  "???": VerseSegmentType.Flex,
  "*": VerseSegmentType.Mediant,
  "\n": VerseSegmentType.Termination
};
export class VerseSegment {
  words: VerseWord[];
  syllables: VerseSyllable[];
  segmentType: VerseSegmentType;
  accentedSyllables: VerseSyllable[];
  additionalWhitespace: string;
  verseMarker?: string;

  constructor(
    text: string,
    syllabify = VerseText.defaultSyllabify,
    type: VerseSegmentType = VerseSegmentType.Termination,
    additionalWhitespace?: string,
    language: Language = 'en',
  ) {
    const verseMarkerMatch = /^\s*(?:\(([^)]+)\)|((?:\d+|[??????])\.?))/.exec(text);
    if (verseMarkerMatch && !/^[ET]\.\s*[TP]\./.test(verseMarkerMatch[1])) {
      this.verseMarker = verseMarkerMatch[1] || verseMarkerMatch[2];
      text = text.slice(verseMarkerMatch[0].length);
    }
    this.words = VerseSegment.splitIntoWords(text, syllabify, language);

    this.syllables = [].concat(...this.words.map((word) => word.syllables));
    this.segmentType = type;

    // mark syllable indices:
    this.syllables.forEach((syl, i) => (syl.indexInSegment = i));
    this.syllables
      .slice()
      .reverse()
      .forEach((syl, i) => (syl.indexFromSegmentEnd = i));

    // mark the last two accents as 0 and 1:
    this.accentedSyllables = this.syllables
      .filter((syl) => syl.isAccented)
      .reverse();

    this.additionalWhitespace = additionalWhitespace || "";
  }

  /**
   * get an array of objects containing a text and a style, based on so many accents and preparatory syllables
   * @param  {number} accents     number of accents to mark at end
   * @param  {number} preparatory number of preparatory syllables to mark before the first marked accent
   * @param  {boolean} onlyMarkFirstPreparatory whether to mark only the first preparatory syllable
   * @param  {string} syllableSeparator string used to separate syllables within the same word, defaults to \xAD
   * @return {Object[]}             Array of {text, style} objects
   */
  getFormattedStrings({
    accents = 0,
    preparatory = 0,
    accentHasMultipleSyllables = [],
    onlyMarkFirstPreparatory = false,
    syllableSeparator = "\xAD",
    includeVerseNumbers = false
  }: {
    accents?: number;
    preparatory?: number;
    accentHasMultipleSyllables?: boolean[]
    onlyMarkFirstPreparatory?: boolean;
    syllableSeparator?: string;
    includeVerseNumbers?: boolean;
  } = {}): FormattedString[] {
    let markedAccents = this.accentedSyllables.slice(
      0,
      accents
    ).reverse();
    let firstAccentIndex = markedAccents.length
      ? markedAccents[0].indexInSegment || 0
      : this.syllables.length;
    let firstMarkedPreparatoryIndex = Math.max(
      0,
      firstAccentIndex - preparatory
    );
    let result: FormattedString[] = [];
    const prefix =
      (includeVerseNumbers &&
        this.words[0].verseNumber &&
        `${this.words[0].verseNumber} `) ||
      "";
    let workingString: FormattedString = {
      text:
        prefix +
        this.syllables
          .slice(0, firstMarkedPreparatoryIndex)
          .join(syllableSeparator)
    };
    let nextSyllableIndex = firstMarkedPreparatoryIndex;
    let lastItalicIndex = onlyMarkFirstPreparatory
      ? preparatory > 0
        ? nextSyllableIndex + 1
        : nextSyllableIndex
      : firstAccentIndex;
    let italics = this.syllables.slice(nextSyllableIndex, lastItalicIndex);
    if (italics.length) {
      workingString.text += italics[0].getPreText();
      result.push(workingString);
      workingString = applyStyleToSyllables('italic', italics, result);
      let nonItalic = this.syllables.slice(lastItalicIndex, firstAccentIndex);
      workingString.text += nonItalic.join("");
    }
    nextSyllableIndex = firstAccentIndex;
    markedAccents.forEach((accent, i) => {
      const hasMultipleSyllables = accentHasMultipleSyllables[i];
      workingString.text += accent.getPreText();
      if (workingString.text) result.push(workingString);
      let nextAccent = markedAccents[i + 1];
      let nextAccentIndex = nextAccent?.indexInSegment ?? this.syllables.length;
      const nextSyllables = this.syllables.slice(
        (accent.indexInSegment || 0) + 1,
        nextAccentIndex
      );

      const bold = [accent];
      if (hasMultipleSyllables && nextSyllables.length > 1) {
        // splice the next syllables but one into bold; nextSyllables now contains only one.
        bold.push(...nextSyllables.splice(0, nextSyllables.length - 1));
      }
      workingString = applyStyleToSyllables('bold', bold, result);

      if (nextAccent) {
        workingString.text += nextSyllables.join("");
        nextSyllableIndex = nextAccentIndex;
      } else {
        nextSyllableIndex += bold.length;
      }
    });
    let nextSyllables = this.syllables.slice(nextSyllableIndex);
    workingString.text += nextSyllables.join(syllableSeparator);
    workingString.text = workingString.text.replace(/\s+$/, "");
    if (workingString.text) result.push(workingString);
    return result;
  }

  /**
   * returns GABC for this verse segment
   * @param psalmTone definition for the psalm tone GABC
   * @param useIntonation false to ignore intonation, or array to override
   * @param useFlex 
   * @param stripFlexMediantSymbols 
   * @param useLargeInitial 
   * @param minSylsOnRecitingTone non-negative number, or -1 to require 0 syllables if the intonation ends on the reciting tone, and 1 otherwise
   * @param language 
   * @param observePause observe pauses in the text that occur on the reciting tone
   * @returns GABC string
   */
   withGabc(
    psalmTone: GabcPsalmTone,
    {
      useIntonation = true,
      useFlex = false,
      stripFlexMediantSymbols = true,
      useLargeInitial = false,
      minSylsOnRecitingTone = 2,
      language = "en",
      observePause = false,
      removeSolesmesMarkings = false,
      failOnNoIntonation = false,
    }: {
      useIntonation: boolean | GabcSingleTone[];
      useFlex?: boolean;
      stripFlexMediantSymbols?: boolean;
      useLargeInitial?: boolean;
      minSylsOnRecitingTone?: number;
      language?: Language;
      observePause?: boolean;
      removeSolesmesMarkings?: boolean;
      failOnNoIntonation?: boolean;
    }
  ): string | false {
    if (this.syllables.length === 0) {
      return "";
    }
    let syllables = this.syllables.slice(),
      {
        intonation,
        preparatory,
        accents,
        afterLastAccent,
        tenor,
        flex
      } = psalmTone.gabc,
      result = "";
    if (useLargeInitial && !syllables[0].preText) {
      syllables = syllables.slice();
      let firstSyllable = syllables[0];
      firstSyllable = syllables[0] = new VerseSyllable(
        firstSyllable.text,
        firstSyllable.firstOfWord,
        firstSyllable.lastOfWord,
        firstSyllable.preText,
        firstSyllable.postText,
        firstSyllable.word
      );
      if (firstSyllable.lastOfWord && firstSyllable.text.length === 3) {
        firstSyllable.text = firstSyllable.text.toUpperCase();
      } else {
        firstSyllable.text =
          firstSyllable.text.slice(0, 2).toUpperCase() +
          firstSyllable.text.slice(2).toLowerCase();
      }
    }
    if (useFlex) {
      ({ afterLastAccent, preparatory, accents } = psalmTone.getFlexTone(language));
    }
    if (accents.length > this.accentedSyllables.length) {
      console.warn(`not enough accents in text to properly apply psalm tone with ${accents.length} accents: "${this.toString()}"`)
      // if there aren't enough accented syllables, cut out the ones from the tone that we don't have available to us
      const unusedAccent = accents[accents.length - this.accentedSyllables.length - 1];
      accents = accents.slice(-this.accentedSyllables.length);
      // and get rid of any preparatory syllables
      preparatory = unusedAccent.slice(1);
    }
    let firstInterestingAccent = this.accentedSyllables[
        accents.length - 1
      ],
      indexOfFirstInterestingAccent = firstInterestingAccent
        ? firstInterestingAccent.indexInSegment || 0
        : syllables.length,
      indexOfFirstPreparatory =
        indexOfFirstInterestingAccent - preparatory.length;
      if (indexOfFirstPreparatory < 0) {
        // there are not enough syllables to cover all the preparatory tones,
        // so we cut off any unneeded tones from the beginning of the array:
        preparatory = preparatory.slice(-indexOfFirstPreparatory);
        indexOfFirstPreparatory = 0;
      }
    let syllablesBeforePreparatory = syllables.slice(0, indexOfFirstPreparatory),
      preparatorySyllables = syllables.slice(
        indexOfFirstPreparatory,
        indexOfFirstPreparatory + preparatory.length
      ),
      accentedSyllableAndAfter = syllables.slice(
        indexOfFirstPreparatory + preparatory.length
      );

    let intonationForkIndex: number;
    if (useIntonation) {
      if (minSylsOnRecitingTone === -1) {
        minSylsOnRecitingTone = intonation[intonation.length - 1].gabc.endsWith(tenor) ? 0 : 1;
      }
      if (typeof useIntonation !== 'boolean') {
        intonation = useIntonation;
      }
      intonationForkIndex = intonation.findIndex(tone => tone.toneAccentFork);
      let syllablesOnRecitingTone =
        syllablesBeforePreparatory.length - intonation.length + (intonationForkIndex >= 0 ? 1 : 0);
      if (
        useFlex &&
        afterLastAccent.length === 0 &&
        accents.length === 1 &&
        accents[0].length === 1 &&
        accents[0][0].toneAccentFork &&
        accents[0][0].toneAccentFork[0][0].gabc === tenor
      ) {
        ++syllablesOnRecitingTone;
      }
      if (syllablesOnRecitingTone < minSylsOnRecitingTone) {
        if (failOnNoIntonation) {
          return false;
        }
        useIntonation = false;
      }
    }

    // prepare GABC of intonation (if any)
    if (!useIntonation) intonation = [];
    if (intonation.length) {
      if (intonationForkIndex >= 0) {
        const fork = intonation[intonationForkIndex].toneAccentFork;
        // in the intonation, a tone accent fork means that we need to consider where accents occur in the intonation syllables
        const syllablesRequiredFollowingAccent = intonation.length - (intonationForkIndex + 2) + minSylsOnRecitingTone; // Plus Two for the fork itself and the accent following
        const syllablesToSearchForAccent = syllablesBeforePreparatory.slice(
          1,
          Math.min(
            syllablesBeforePreparatory.length -
              syllablesRequiredFollowingAccent,
            1 + intonationForkIndex + fork.length
          )
        );
        const lastUsableAccent = syllablesToSearchForAccent
          .reverse()
          .findIndex(
            (syllable) =>
              syllable.isAccented ||
              (syllable.firstOfWord && syllable.lastOfWord)
          );
        const accentIndex = lastUsableAccent === -1 ? -1 : syllablesToSearchForAccent.length - 1 - lastUsableAccent;
        intonation = [
          ...intonation.slice(0, intonationForkIndex),
          ...(fork[accentIndex] ?? []),
          ...intonation.slice(intonationForkIndex + 1),
        ];
      }
      for (let i = 0; i < intonation.length; ++i) {
        let syl = syllablesBeforePreparatory.shift();
        if (syl) result += syl.withGabc(intonation[i].gabc);
      }
    }
    // handle all syllables on the reciting tone
    syllablesBeforePreparatory.forEach(
      (syl) => (result += syl.withGabc(tenor || "", observePause))
    );
    // handle preparatory syllables
    preparatorySyllables.forEach(
      (syl, i) => (result += syl.withGabc(preparatory[i].gabc))
    );

    // handle the final accents:
    let sylI = 0;
    accents.forEach((accentTones, accentI) => {
      let nextAccent = this.accentedSyllables[accents.length - 2 - accentI],
        endSylI = nextAccent
          ? (nextAccent.indexInSegment || 0) -
            (accentedSyllableAndAfter[0].indexInSegment || 0)
          : Math.max(
              1,
              accentedSyllableAndAfter.length - afterLastAccent.length
            );
      // endSylI points to the next accent or to the first syllable applicable to afterLastAccent
      let useNonAccentNonOpen = false;
      if (accentTones.length === 1 && accentTones[0].toneAccentFork) {
        // toneAccentFork contains [accent on last syllable, accent on penult, accent on antepenult or earlier]:
        const accentForkIndex = Math.min(2, endSylI - 1);
        accentTones = accentTones[0].toneAccentFork[accentForkIndex];
        useNonAccentNonOpen = true;
      }
      accentTones.forEach((accentTone, i) => {
        if (sylI >= endSylI) return;
        let syl = accentedSyllableAndAfter[sylI];
        if (accentTone.accent || (!accentTone.open && i === accentTones.length - 1)) {
          // we're looking for an accented syllable
          if (
            syl.isAccented ||
            (sylI + 1 === endSylI && i === accentTones.length - 1)
          ) {
            // Use this syllable if it's accented or if we need to use something
            result += syl.withGabc(accentTone.gabc);
            ++sylI;
          } else {
            console.warn("Invalid state when applying psalm tone");
          }
        } else if (accentTone.open) {
          // take all syllables until the next accent:
          let accentTonesRemaining = accentTones.length - 1 - i;
          while (sylI < endSylI - accentTonesRemaining) {
            result += syl.withGabc(accentTone.gabc);
            syl = accentedSyllableAndAfter[++sylI];
          }
        } else if (useNonAccentNonOpen) {
          // this is a forked accent tone, so we have already chosen the right one based on the number of syllables present;
          // just use the tone and the syllable.
          result += syl.withGabc(accentTone.gabc);
          ++sylI;
        }
      });
    });
    let remainingSyllables = accentedSyllableAndAfter.slice(sylI);
    if (remainingSyllables.length === afterLastAccent.length) {
      remainingSyllables.forEach(
        (syl, i) => (result += syl.withGabc(afterLastAccent[i].gabc))
      );
    } else if (
      this.accentedSyllables.length &&
      (remainingSyllables.length || afterLastAccent.length > 1)
    ) {
      // only bother warning if there are actually marked accents in the text
      // and there are remaining syllables, or more than one syllable after the accent in the psalm tone
      console.warn(
        "Invalid state when applying psalm tone...incorrect number of syllables remaining"
      );
    }
    if (stripFlexMediantSymbols) result = result.replace(/\s+[*???]/g, "");
    if (removeSolesmesMarkings) {
      result = removeSolesmesMarkingsInMixedGabc(result);
    }
    return result;
  }

  toString() {
    return this.words.join(" ");
  }

  static splitIntoWords(
    text: string,
    syllabify = VerseText.defaultSyllabify,
    language: Language = 'en',
  ) {
    const accentUtils: { [key in Language]: { findWordAccent?: WordAccentFinder, findPhraseAccents?: PhraseAccentFinder }} = {
      'en': {},
      'la': { findWordAccent: findLatinWordAccent, findPhraseAccents: findLatinPhraseAccents },
      'es': { findWordAccent: findSpanishWordAccent, findPhraseAccents: findSpanishPhraseAccents },
    }  
    const { findWordAccent, findPhraseAccents } = accentUtils[language];
    let wordSplit = text
      .trim()
      .split(
        /([??,;:.!?"'????????\]\)??????-]*)(?:$|\s+(\+\s+)?|^)(?:\[?((?:\d+:\s*)?\d+(?:[a-l]\b)?)\.?\]?\s*)?([\(\[????????'"??????????-]*)/
      );
    // the text is now split into an array composed of text that didn't match
    // the regex, followed by the first group of the regex, the second, third, and fourth
    // group, and repeating.  We add two empty strings to the beginning and end
    // of this array so that the array has a number of elements that is divisible by 5
    // and is of the form [number,pre,word,post,pause, number,pre,word,post,pause,...]
    wordSplit.unshift("", "");
    wordSplit.push("", "");
    let words = [],
      lastWord,
      preWord;
    for (let i = 0; i + 2 < wordSplit.length; i += 5) {
      const [verseNumber, pre, text, post, pause] = wordSplit.slice(i, i + 5);
      if (!text) {
        if (!(pre || post)) {
          continue;
        }
        console.warn(
          `no word found around ${i + 1} when splitting string ${JSON.stringify(
            wordSplit
          )} into words`
        );
      }
      let verseWord = new VerseWord({
        text,
        pre,
        post,
        pause: !!pause,
        syllabify,
        findAccents: findWordAccent,
        verseNumber
      });
      if (verseWord.isActualWord) {
        if (preWord) {
          verseWord.addPrePunctuation(preWord.syllables.join("").trim());
          preWord = null;
        }
        words.push(verseWord);
        lastWord = verseWord;
      } else if (lastWord) {
        lastWord.addPunctuation(verseWord.syllables.join("").trim());
      } else {
        preWord = verseWord;
      }
    }
    findPhraseAccents?.(words);
    return words;
  }
}

interface VerseWordArgs {
  text: string,
  pre: string,
  post: string,
  pause?: boolean,
  syllabify?: Syllabifier,
  findAccents?: WordAccentFinder,
  verseNumber?: string
};
export class VerseWord {
  isActualWord: boolean;
  prePunctuation: string;
  punctuation: string;
  syllables: VerseSyllable[];
  verseNumber?: string;
  pause: boolean;

  constructor({
    text,
    pre,
    post,
    pause,
    syllabify = VerseText.defaultSyllabify,
    findAccents,
    verseNumber
  }: VerseWordArgs) {
    if (verseNumber) this.verseNumber = verseNumber;
    this.isActualWord = /[a-z]/i.test(text);
    this.prePunctuation = this.punctuation = "";
    this.pause = !!pause;
    this.syllables = syllabify(text).map(
      (syl, i, syllabified) =>
        new VerseSyllable(
          syl,
          i === 0,
          i === syllabified.length - 1,
          pre,
          post,
          this
        )
    );
    findAccents?.(this.syllables);
  }
  /**
   * adds punctuation that comes after the word, but is separated by a space
   * @param {string} punctuation punctuation to add following the word
   */
  addPunctuation(punctuation: string) {
    this.syllables[this.syllables.length - 1].postText += "\xA0" + punctuation;
  }
  /**
   * adds punctuation that comes before the word, but is separated by a space
   * @param {string} prePunctuation punctuation to add before the word
   */
  addPrePunctuation(prePunctuation: string) {
    this.syllables[0].preText =
      prePunctuation + "\xA0" + this.syllables[0].preText;
  }

  toString() {
    return this.syllables.join("+");
  }
}

export class VerseSyllable {
  text: string;
  word: VerseWord;
  firstOfWord: boolean;
  lastOfWord: boolean;
  isAccented: boolean;
  preText: string;
  postText: string;
  pause: boolean;

  indexInSegment?: number;
  indexFromSegmentEnd?: number;

  constructor(
    sylText: string,
    firstOfWord: boolean,
    lastOfWord: boolean,
    pre: string | null | undefined,
    post: string | null | undefined,
    word: VerseWord
  ) {
    this.text = sylText;
    this.word = word;
    this.firstOfWord = firstOfWord;
    this.lastOfWord = lastOfWord;
    this.isAccented = /[????????????????]/i.test(sylText);
    if (/^\|[^|]+\|$/.test(sylText)) {
      this.text = sylText.slice(1, -1);
      this.isAccented = true;
    }
    this.preText = (firstOfWord && pre) || "";
    this.postText = (lastOfWord && post) || "";
    this.pause = lastOfWord && word.pause;
  }

  toString() {
    return (
      this.preText + this.text + this.postText + (this.lastOfWord ? " " : "")
    );
  }
  withoutPreText() {
    return this.text + this.postText + (this.lastOfWord ? " " : "");
  }
  withoutPostText() {
    return this.preText + this.text;
  }
  getPreText() {
    return this.preText;
  }
  getPostText() {
    return this.postText + (this.lastOfWord ? " " : "");
  }

  withGabc(gabc: string, observePause = false) {
    if (this.pause && observePause) {
      gabc += ".) (,";
    }
    return (
      this.preText +
      this.text +
      this.postText +
      `(${gabc})` +
      (this.lastOfWord ? "\n" : "")
    );
  }
}
