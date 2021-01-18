export declare type GabcWithTitles = {
    gabc: string;
    supertitle?: string;
    title?: string;
    subtitle?: string;
};
export declare const splitGabcByTitle: (gabc: string) => GabcWithTitles[];
