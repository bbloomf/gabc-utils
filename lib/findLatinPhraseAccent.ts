import { VerseWord } from "./VerseText";

export function findLatinPhraseAccents(
  words: VerseWord[]
) {
  const allSyllables = words.flatMap((word) => word.syllables);
  let nextAccentI = allSyllables.length;
  for (let i = nextAccentI - 1; i >= 0; --i) {
    const syl = allSyllables[i];
    if (syl.isAccented) {
      nextAccentI = i;
      continue;
    }
    if (nextAccentI - i === 3) {
      nextAccentI = i + 1;
      allSyllables[nextAccentI].isAccented = true;
    }
  }
  if (nextAccentI === 2) {
    allSyllables[0].isAccented = true;
  }
};
