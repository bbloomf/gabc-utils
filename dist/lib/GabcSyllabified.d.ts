export declare class GabcSyllabified {
    static readonly regexClef: RegExp;
    static readonly regexNonSyllabicGabc: RegExp;
    static readonly regexFindParensWithLeadSpaces: RegExp;
    static readonly regexFindParens: RegExp;
    static merge(syllabifiedText: string, musicalNotation: string, useLargeInitial?: boolean): string;
    static normalizeInputs(text: string, notation: string): {
        text: string;
        notation: string;
    };
    static splitInputs(text: string, notation: string): {
        syllables: string[];
        notationNodes: string[];
    };
    static stripParens(s: string): string;
    static stripNonDisplayCharacters(syllable: string): string;
    static isNonSyllableString(s: string): boolean;
    static getSyllable(syllables: string[], index: number): string;
    static getNonSyllable(syllables: string[], syllableNdx: number, notation?: string): string;
    static getNonSyllableOrSpace(syllables: string[], syllableNdx: number, notation?: string): string;
    static mapSyllable(notation: string, syllables: string[], sylNdx: number, isFirstSyllable: boolean, useLargeInitial?: boolean): {
        syllable: string;
        nextIndex: number;
        isFirstSyllable: boolean;
    };
    static capitalizeInitial(syllable: string, nextSyllable: string): string;
}
