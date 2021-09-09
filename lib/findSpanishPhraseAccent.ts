import { VerseWord } from "./VerseText";

export function findSpanishPhraseAccents(
  words: VerseWord[]
) {
  const lastWordSyllables = words[words.length - 1]?.syllables ?? [];
  if (lastWordSyllables.length === 1) {
    lastWordSyllables[0].isAccented = true;
  }
};
