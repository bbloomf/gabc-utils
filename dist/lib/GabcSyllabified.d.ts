export interface GabcSyllabifiedOptions {
    /**
     * true to use E.T. alleluia at the end, false to remove it, undefined to include it with the E.T. before
     */
    isEaster?: boolean;
    /**
     * true to use a large initial, and set up the capitalization of the second and sometimes third letter
     */
    useLargeInitial?: boolean;
    /**
     * true to remove any Solesmes markings (ictus, episema, punctum mora)
     */
    removeSolesmesMarkings?: boolean;
    /**
     * gabc melody that follows this one, to use to calculate a custos at the end for a clef change (if the followedByGabc starts with a different clef than the GABC being merged ends with).
     */
    followedByGabc?: string;
}
export declare class GabcSyllabified {
    static readonly regexClef: RegExp;
    static readonly regexAllClefs: RegExp;
    static readonly regexNonSyllabicGabc: RegExp;
    static readonly regexFindParensWithLeadSpaces: RegExp;
    static readonly regexFindParens: RegExp;
    static merge(syllabifiedText: string, musicalNotation: string, isEaster?: boolean, useLargeInitial?: boolean): string;
    static merge(syllabifiedText: string, musicalNotation: string, options?: GabcSyllabifiedOptions): string;
    static normalizeInputs(text: string, notation: string, isEaster?: boolean, removeSolesmes?: boolean): {
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
    static getNonSyllable(syllables: string[], syllableNdx: number, notation?: string, noSyllable?: boolean): string;
    static getNonSyllableOrSpace(syllables: string[], syllableNdx: number, notation?: string): string;
    static mapSyllable(notation: string, syllables: string[], sylNdx: number, isFirstSyllable: boolean, useLargeInitial?: boolean): {
        syllable: string;
        nextIndex: number;
        isFirstSyllable: boolean;
    };
    static capitalizeInitial(syllable: string, nextSyllable: string): string;
}
