import { VerseSyllable } from "./VerseText";

export function findLatinWordAccent(
  syllables: VerseSyllable[]
) {
  if (syllables.length > 1 && syllables.every((syl) => !syl.isAccented)) {
    if (syllables.length <= 3 && /[AEIOUY]/.test(syllables[0].text)) {
      // If the first syllable is the penult or ante-penult andit contains a capital vowel, then it is accented according to standard non-usage of accented capitals.
      syllables[0].isAccented = true;
    } else {
      // otherwise, apply accent to the penult
      syllables[syllables.length - 2].isAccented = true;
    }
  }
};
