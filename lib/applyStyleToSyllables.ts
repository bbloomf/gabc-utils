import { FormattedString, VerseSyllable } from "./VerseText";

export const applyStyleToSyllables = (
  style: "italic" | "bold",
  syllables: VerseSyllable[],
  result: FormattedString[]
): FormattedString => {
  const lastSyllable = syllables[syllables.length - 1];
  const workingString = {
    style,
    text:
      syllables.length > 1
        ? syllables[0].withoutPreText() +
          syllables.slice(1, -1).join("") +
          lastSyllable.withoutPostText()
        : syllables[0].text,
  };
  result.push(workingString);
  return { text: lastSyllable.getPostText() };
};
