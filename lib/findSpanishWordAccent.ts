import { WordAccentFinder, VerseSyllable } from "./VerseText";

export const findSpanishWordAccent: WordAccentFinder = (
  syllables: VerseSyllable[]
) => {
  if (syllables.length > 1 && syllables.every((syl) => !syl.isAccented)) {
    const lastSyllable = syllables[syllables.length - 1];
    const accentPenult = /[aeiouy][ns]?$/i.test(lastSyllable.text);
    const accentIndex = accentPenult ? 2 : 1;
    syllables[syllables.length - accentIndex].isAccented = true;
  }
};
