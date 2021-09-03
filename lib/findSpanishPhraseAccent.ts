import { PhraseAccentFinder, VerseWord } from "./VerseText";

export const findSpanishPhraseAccents: PhraseAccentFinder = (
  words: VerseWord[]
) => {
  const lastWordSyllables = words[words.length - 1]?.syllables ?? [];
  if (lastWordSyllables.length === 1) {
    lastWordSyllables[0].isAccented = true;
  }
};
