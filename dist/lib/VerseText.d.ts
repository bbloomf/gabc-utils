import { GabcPsalmTone, GabcPsalmTones, GabcSingleTone } from "./GabcPsalmTone";
export declare type Syllabifier = (word: string) => string[];
export declare type WordAccentFinder = (word: VerseSyllable[]) => void;
export declare type PhraseAccentFinder = (phrase: VerseWord[]) => void;
export declare type FormattedString = {
    text: string;
    style?: "bold" | "italic" | "" | null;
};
export declare enum VerseSegmentType {
    Flex = "flex",
    Mediant = "mediant",
    Termination = "termination"
}
export declare type Language = "en" | "es" | "la";
export interface VerseGabcOptions {
    startVersesOnNewLine?: boolean;
    stripFlexMediantSymbols?: boolean;
    addSequentialVerseNumbersStartingAt?: number;
    addInitialVerseNumber?: number | string;
    minSylsOnRecitingTone?: number;
    useLargeInitial?: boolean;
    barDictionary?: {
        [k in VerseSegmentType]: string;
    };
}
export interface VerseTextArgs {
    text: string;
    isEaster?: boolean;
    language?: Language;
    syllabify?: Syllabifier;
}
export declare class VerseText {
    static readonly defaultSyllabify: Syllabifier;
    segments: VerseSegment[];
    stanzas: VerseSegment[][];
    language: Language;
    /**
     *
     * @param text the text to be split into segments
     * @param syllabify a function that takes a word string and returns an array of its syllables
     */
    constructor(text: string | VerseTextArgs, isEaster?: boolean | undefined, syllabify?: Syllabifier, language?: Language);
    /**
     * Returns a verse with GABC
     * @param  {Object} psalmTone hash of GabcPsalmTones for flex, mediant, and termination
     * @return {string}           GABC string
     */
    withGabc(psalmTone: GabcPsalmTones, { startVersesOnNewLine, stripFlexMediantSymbols, addSequentialVerseNumbersStartingAt, addInitialVerseNumber, minSylsOnRecitingTone, useLargeInitial, barDictionary }?: VerseGabcOptions): string;
    getStanzaGabc(psalmTone: GabcPsalmTones, i: number, { startVersesOnNewLine, stripFlexMediantSymbols, minSylsOnRecitingTone, useLargeInitial, barDictionary, }?: VerseGabcOptions): string;
    toString(): string;
    /**
     * Split a text into segments based on the presence of †, * and \n.
     * @param  {string} text          the text to be split
     * @param  {function} syllabify a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
     * @return {VerseSegment[]}       the array of VerseSegment objects
     */
    static splitIntoSegments(text: string, syllabify?: Syllabifier, language?: Language): VerseSegment[];
}
export declare class VerseSegment {
    words: VerseWord[];
    syllables: VerseSyllable[];
    segmentType: VerseSegmentType;
    accentedSyllables: VerseSyllable[];
    additionalWhitespace: string;
    verseMarker?: string;
    constructor(text: string, syllabify?: Syllabifier, type?: VerseSegmentType, additionalWhitespace?: string, language?: Language);
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
    withGabc(psalmTone: GabcPsalmTone, useIntonation?: boolean | GabcSingleTone[], useFlex?: boolean, stripFlexMediantSymbols?: boolean, useLargeInitial?: boolean, minSylsOnRecitingTone?: number, language?: string, observePause?: boolean): string;
    toString(): string;
    static splitIntoWords(text: string, syllabify?: Syllabifier, language?: Language): any[];
}
interface VerseWordArgs {
    text: string;
    pre: string;
    post: string;
    pause?: boolean;
    syllabify?: Syllabifier;
    findAccents?: WordAccentFinder;
    verseNumber?: string;
}
export declare class VerseWord {
    isActualWord: boolean;
    prePunctuation: string;
    punctuation: string;
    syllables: VerseSyllable[];
    verseNumber?: string;
    pause: boolean;
    constructor({ text, pre, post, pause, syllabify, findAccents, verseNumber }: VerseWordArgs);
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
export declare class VerseSyllable {
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
    constructor(sylText: string, firstOfWord: boolean, lastOfWord: boolean, pre: string | null | undefined, post: string | null | undefined, word: VerseWord);
    toString(): string;
    withoutPreText(): string;
    withoutPostText(): string;
    getPreText(): string;
    getPostText(): string;
    withGabc(gabc: string, observePause?: boolean): string;
}
export {};
