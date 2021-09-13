import { VerseSegmentType } from "./VerseText";
export declare type GabcPsalmTones = GabcPsalmToneChunk & {
    lines?: (GabcPsalmToneChunk | GabcPsalmTone[])[];
    isMeinrad: boolean;
    isGregorianSolemn?: boolean;
    originalGabc?: string;
    clef: string;
};
export declare type GabcPsalmToneChunk = {
    [VerseSegmentType.Flex]?: GabcPsalmTone;
    [VerseSegmentType.Mediant]?: GabcPsalmTone;
    [VerseSegmentType.Termination]: GabcPsalmTone;
};
export declare type GabcPsalmToneOptions = {
    treatAsOneAccentWithXPreparatory?: boolean;
    useFlex?: boolean;
    isMeinrad?: boolean;
    isGregorianSolemn?: boolean;
};
export declare type GabcSingleTone = {
    gabc: string;
    accent?: boolean;
    open?: boolean;
    toneAccentFork?: GabcSingleTone[][];
};
declare type GabcInfo = {
    tenor?: string;
    flex?: string;
    intonation: GabcSingleTone[];
    preparatory: GabcSingleTone[];
    afterLastAccent: GabcSingleTone[];
    accents: GabcSingleTone[][];
};
declare type SyllableCounts = {
    intonation: number;
    accents: number;
    preparatory: number;
    afterLastAccent: number;
    accentHasMultipleSyllables: boolean[];
};
export declare class GabcPsalmTone {
    getFlexTone(language: string): GabcInfo;
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
    static getFromGabc(gabc: string, options?: GabcPsalmToneOptions, clef?: string): GabcPsalmTones;
    tones: GabcSingleTone[];
    clef: string;
    gabc: GabcInfo;
    syllableCounts: SyllableCounts;
    static readonly getTonesForGabcString: (gabc: any) => GabcSingleTone[];
    constructor(gabc: string, prefix?: string, flexEqualsTenor?: boolean, clef?: string);
}
export {};
