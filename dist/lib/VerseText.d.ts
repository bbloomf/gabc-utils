import { GabcPsalmTone, GabcPsalmTones } from "./GabcPsalmTone";
export declare type Syllabifier = (word: string) => string[];
export declare type FormattedString = {
    text: string;
    style?: "bold" | "italic" | "" | null;
};
export declare enum VerseSegmentType {
    Flex = "flex",
    Mediant = "mediant",
    Termination = "termination"
}
export declare class VerseText {
    static readonly defaultSyllabifier: Syllabifier;
    segments: VerseSegment[];
    /**
     *
     * @param text the text to be split into segments
     * @param syllabifier a function that takes a word string and returns an array of its syllables
     */
    constructor(text: string, syllabifier?: Syllabifier);
    /**
     * Returns a verse with GABC
     * @param  {Object} psalmTone hash of GabcPsalmTones for flex, mediant, and termination
     * @return {string}           GABC string
     */
    withGabc(psalmTone: GabcPsalmTones, { startVersesOnNewLine, stripFlexMediantSymbols, addSequentialVerseNumbersStartingAt, addInitialVerseNumber, minSylsOnRecitingTone, useLargeInitial, barDictionary }?: {
        startVersesOnNewLine?: boolean;
        stripFlexMediantSymbols?: boolean;
        addSequentialVerseNumbersStartingAt?: number;
        addInitialVerseNumber?: number;
        minSylsOnRecitingTone?: number;
        useLargeInitial?: boolean;
        barDictionary?: {
            [k in VerseSegmentType]: string;
        };
    }): string;
    toString(): string;
    /**
     * Split a text into segments based on the presence of †, * and \n.
     * @param  {string} text          the text to be split
     * @param  {function} syllabifier a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
     * @return {VerseSegment[]}       the array of VerseSegment objects
     */
    static splitIntoSegments(text: string, syllabifier?: Syllabifier): VerseSegment[];
}
declare class VerseSegment {
    words: VerseWord[];
    syllables: VerseSyllable[];
    segmentType: VerseSegmentType;
    accentedSyllables: VerseSyllable[];
    additionalWhitespace: string;
    constructor(text: string, syllabifier?: Syllabifier, type?: VerseSegmentType, additionalWhitespace?: string);
    /**
     * get an array of objects containing a text and a style, based on so many accents and preparatory syllables
     * @param  {number} accents     number of accents to mark at end
     * @param  {number} preparatory number of preparatory syllables to mark before the first marked accent
     * @param  {boolean} onlyMarkFirstPreparatory whether to mark only the first preparatory syllable
     * @param  {string} syllableSeparator string used to separate syllables within the same word, defaults to \xAD
     * @return {Object[]}             Array of {text, style} objects
     */
    getFormattedStrings({ accents, preparatory, onlyMarkFirstPreparatory, syllableSeparator, includeVerseNumbers }?: {
        accents?: number;
        preparatory?: number;
        onlyMarkFirstPreparatory?: boolean;
        syllableSeparator?: string;
        includeVerseNumbers?: boolean;
    }): FormattedString[];
    /**
     * returns GABC for this verse segment
     * @param  {GabcPsalmTone} psalmTone definition for the psalm tone GABC
     * @return {string}           GABC string
     */
    withGabc(psalmTone: GabcPsalmTone, useIntonation?: boolean, useFlex?: boolean, stripFlexMediantSymbols?: boolean, useLargeInitial?: boolean, minSylsOnRecitingTone?: number): string;
    toString(): string;
    static splitIntoWords(text: string, syllabifier?: Syllabifier): any[];
}
declare class VerseWord {
    isActualWord: boolean;
    prePunctuation: string;
    punctuation: string;
    syllables: VerseSyllable[];
    verseNumber?: string;
    constructor(text: string, pre: string, post: string, syllabifier?: Syllabifier, verseNumber?: string);
    /**
     * adds punctuation that comes after the word, but is separated by a space
     * @param {string} punctuation punctuation to add following the word
     */
    addPunctuation(punctuation: string): void;
    /**
     * adds punctuation that comes before the word, but is separated by a space
     * @param {string} prePunctuation punctuation to add before the word
     */
    addPrePunctuation(prePunctuation: string): void;
    toString(): string;
}
declare class VerseSyllable {
    text: string;
    word: VerseWord;
    firstOfWord: boolean;
    lastOfWord: boolean;
    isAccented: boolean;
    preText: string;
    postText: string;
    indexInSegment?: number;
    indexFromSegmentEnd?: number;
    constructor(sylText: string, firstOfWord: boolean, lastOfWord: boolean, pre: string | null | undefined, post: string | null | undefined, word: VerseWord);
    toString(): string;
    withoutPreText(): string;
    withoutPostText(): string;
    getPreText(): string;
    getPostText(): string;
    withGabc(gabc: string): string;
}
export {};
