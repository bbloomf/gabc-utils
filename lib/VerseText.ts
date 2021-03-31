import { GabcPsalmTone, GabcPsalmTones } from "./GabcPsalmTone";
export type Syllabifier = (word: string) => string[];
export type FormattedString = {
  text: string;
  style?: "bold" | "italic" | "" | null;
};
export enum VerseSegmentType {
  Flex = "flex",
  Mediant = "mediant",
  Termination = "termination"
}
export interface VerseGabcOptions {
  startVersesOnNewLine?: boolean;
  stripFlexMediantSymbols?: boolean;
  addSequentialVerseNumbersStartingAt?: number;
  addInitialVerseNumber?: number | string;
  minSylsOnRecitingTone?: number;
  useLargeInitial?: boolean;
  barDictionary?: { [k in VerseSegmentType]: string };
};
export class VerseText {
  static readonly defaultSyllabifier: Syllabifier = (text) =>
    text
      .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, "$1-")
      .replace(/\s+--\s+/g, "+")
      .replace(/(\|\S+\|)(\S)/gi, "$1+$2")
      .replace(/(\S)(\|\S+\|)/gi, "$1+$2")
      .replace(/(\S-)(\S)/gi, "$1+$2")
      .split(/\+/g);
  segments: VerseSegment[];
  stanzas: VerseSegment[][];

  /**
   *
   * @param text the text to be split into segments
   * @param syllabifier a function that takes a word string and returns an array of its syllables
   */
  constructor(
    text: string,
    isEaster: boolean | undefined = false,
    syllabifier: Syllabifier = VerseText.defaultSyllabifier
  ) {
    if (isEaster) {
      text = text.replace(/([,;:.!?])?\s*\(E\.\s*T\.\s*([^)]+)\)/g, (whole,punctuation,alleluia) => {
        return `${(punctuation || ',')} ${alleluia}`;
      });
    } else if (isEaster === false) {
      text = text.replace(/\s*\(E\.\s*T\.[^)]+\)/g,'');
    }
    const stanzas = text.split(/\n\s*\n/);
    this.stanzas = stanzas.map(stanza => VerseText.splitIntoSegments(stanza, syllabifier));
    this.segments = this.stanzas.flat();
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
      minSylsOnRecitingTone = 2,
      useLargeInitial = true,
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
    }: VerseGabcOptions = {}
  ) {
    const segments = this.stanzas[i];
    const stanzaCount = segments.filter(
      (segment) => segment.segmentType === VerseSegmentType.Termination
    ).length;
    let stanzaI = 0;
    return (
      segments
        .map((seg, i, segments) => {
          let useFlex = seg.segmentType === VerseSegmentType.Flex,
            segmentName = useFlex ? VerseSegmentType.Mediant : seg.segmentType,
            tone = psalmTone[segmentName];
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
          let gabc = seg.withGabc(
            tone as GabcPsalmTone,
            i == 0 || i == segments.length - 1, // use intonation on first and last segment
            useFlex,
            stripFlexMediantSymbols,
            i === 0 && useLargeInitial,
            minSylsOnRecitingTone
          );
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
   * Split a text into segments based on the presence of †, * and \n.
   * @param  {string} text          the text to be split
   * @param  {function} syllabifier a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
   * @return {VerseSegment[]}       the array of VerseSegment objects
   */
  static splitIntoSegments(
    text: string,
    syllabifier = VerseText.defaultSyllabifier
  ): VerseSegment[] {
    let segmentSplit = text.split(/[ \t]*([†*\n/])(\s*)/),
      segments: VerseSegment[] = [];
    for (let i = 0; i < segmentSplit.length; i += 3) {
      let text = segmentSplit[i];
      if (segmentSplit[i + 1]) {
        text += " " + segmentSplit[i + 1];
      }
      segments.push(
        new VerseSegment(
          text,
          syllabifier,
          SegmentTypeDictionary[
            segmentSplit[i + 1] as keyof typeof SegmentTypeDictionary
          ],
          segmentSplit[i + 2]
        )
      );
    }
    return segments;
  }
}

const SegmentTypeDictionary = {
  "†": VerseSegmentType.Flex,
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
    syllabifier = VerseText.defaultSyllabifier,
    type: VerseSegmentType = VerseSegmentType.Termination,
    additionalWhitespace?: string
  ) {
    const verseMarkerMatch = /^\s*(?:\(([^)]+)\)|((?:\d+|[℣℟])\.?))/.exec(text);
    if (verseMarkerMatch && !/^[ET]\.\s*[TP]\./.test(verseMarkerMatch[1])) {
      this.verseMarker = verseMarkerMatch[1] || verseMarkerMatch[2];
      text = text.slice(verseMarkerMatch[0].length);
    }
    this.words = VerseSegment.splitIntoWords(text, syllabifier);
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
    onlyMarkFirstPreparatory = false,
    syllableSeparator = "\xAD",
    includeVerseNumbers = false
  }: {
    accents?: number;
    preparatory?: number;
    onlyMarkFirstPreparatory?: boolean;
    syllableSeparator?: string;
    includeVerseNumbers?: boolean;
  } = {}): FormattedString[] {
    let markedAccents = this.accentedSyllables.slice(
      this.accentedSyllables.length - accents
    );
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
      let lastItalic = italics[italics.length - 1];
      workingString.text += italics[0].getPreText();
      result.push(workingString);
      if (italics.length > 1) {
        workingString = {
          style: "italic",
          text:
            italics[0].withoutPreText() +
            italics.slice(1, -1).join("") +
            lastItalic.withoutPostText()
        };
      } else {
        workingString = {
          style: "italic",
          text: italics[0].text
        };
      }
      result.push(workingString);
      workingString = { text: lastItalic.getPostText() };
      let nonItalic = this.syllables.slice(lastItalicIndex, firstAccentIndex);
      workingString.text += nonItalic.join("");
    }
    nextSyllableIndex = firstAccentIndex;
    markedAccents.forEach((accent, i) => {
      workingString.text += accent.getPreText();
      result.push(workingString);

      workingString = { style: "bold", text: accent.text };
      result.push(workingString);

      let nextAccent = markedAccents[i + 1];
      workingString = { text: accent.getPostText() };
      if (nextAccent) {
        let nextSyllables = this.syllables.slice(
          (accent.indexInSegment || 0) + 1,
          nextAccent.indexInSegment
        );
        workingString.text += nextSyllables.join("");
        nextSyllableIndex = nextAccent.indexInSegment || 0;
      } else {
        ++nextSyllableIndex;
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
   * @param  {GabcPsalmTone} psalmTone definition for the psalm tone GABC
   * @return {string}           GABC string
   */
  withGabc(
    psalmTone: GabcPsalmTone,
    useIntonation = true,
    useFlex = false,
    stripFlexMediantSymbols = true,
    useLargeInitial = false,
    minSylsOnRecitingTone = 2
  ) {
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
      ({ afterLastAccent, preparatory, accents } = psalmTone.getFlexTone("en"));
    }
    let firstInterestingAccent = this.accentedSyllables[
        psalmTone.gabc.accents.length - 1
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

    if (useIntonation) {
      let syllablesOnRecitingTone =
        syllablesBeforePreparatory.length - intonation.length;
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
        useIntonation = false;
      }
    }

    // prepare GABC of intonation (if any)
    if (!useIntonation) intonation = [];
    if (intonation.length) {
      for (let i = 0; i < intonation.length; ++i) {
        let syl = syllablesBeforePreparatory.shift();
        if (syl) result += syl.withGabc(intonation[i].gabc);
      }
    }
    // handle all syllables on the reciting tone
    syllablesBeforePreparatory.forEach(
      (syl) => (result += syl.withGabc(tenor || ""))
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
        if (accentTone.accent) {
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
    if (stripFlexMediantSymbols) result = result.replace(/\s+[*†]/g, "");
    return result;
  }

  toString() {
    return this.words.join(" ");
  }

  static splitIntoWords(
    text: string,
    syllabifier = VerseText.defaultSyllabifier
  ) {
    let wordSplit = text
      .trim()
      .split(
        /([ ,;:.!?"'’”»\]\)—–-]*)(?:$|\s+|^)(?:\[?((?:\d+:\s*)?\d+(?:[a-l]\b)?)\.?\]?\s*)?([\(\[«“‘'"¿¡—–-]*)/
      );
    // the text is now split into an array composed of text that didn't match
    // the regex, followed by the first group of the regex, and the second
    // group, and repeating.  We add two empty strings to the beginning and end
    // of this array so that the array has a number of elements that is divisible by 4
    // and is of the form [number,pre,word,post, number,pre,word,post,...]
    wordSplit.unshift("", "");
    wordSplit.push("");
    let words = [],
      lastWord,
      preWord;
    for (let i = 0; i + 2 < wordSplit.length; i += 4) {
      if (!wordSplit[i + 2]) {
        if (!(wordSplit[i + 1] || wordSplit[i + 3])) {
          continue;
        }
        console.warn(
          `no word found around ${i + 1} when splitting string ${JSON.stringify(
            wordSplit
          )} into words`
        );
      }
      let verseWord = new VerseWord(
        wordSplit[i + 2],
        wordSplit[i + 1],
        wordSplit[i + 3],
        syllabifier,
        wordSplit[i]
      );
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
    return words;
  }
}

class VerseWord {
  isActualWord: boolean;
  prePunctuation: string;
  punctuation: string;
  syllables: VerseSyllable[];
  verseNumber?: string;

  constructor(
    text: string,
    pre: string,
    post: string,
    syllabifier = VerseText.defaultSyllabifier,
    verseNumber?: string
  ) {
    if (verseNumber) this.verseNumber = verseNumber;
    this.isActualWord = /[a-z]/i.test(text);
    this.prePunctuation = this.punctuation = "";
    let syllabified = syllabifier(text);
    this.syllables = syllabified.map(
      (syl, i) =>
        new VerseSyllable(
          syl,
          i === 0,
          i === syllabified.length - 1,
          pre,
          post,
          this
        )
    );
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

class VerseSyllable {
  text: string;
  word: VerseWord;
  firstOfWord: boolean;
  lastOfWord: boolean;
  isAccented: boolean;
  preText: string;
  postText: string;

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
    this.isAccented = /[áéíóúýǽ́]/i.test(sylText);
    if (/^\|[^|]+\|$/.test(sylText)) {
      this.text = sylText.slice(1, -1);
      this.isAccented = true;
    }
    this.preText = (firstOfWord && pre) || "";
    this.postText = (lastOfWord && post) || "";
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

  withGabc(gabc: string) {
    return (
      this.preText +
      this.text +
      this.postText +
      `(${gabc})` +
      (this.lastOfWord ? "\n" : "")
    );
  }
}
