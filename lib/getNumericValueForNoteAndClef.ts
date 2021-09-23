export function getNumericValueForNoteAndClef(note: string, clef: string) {
  const noteInt = note.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
  const clefPosition = Number(clef.match(/\d+/)[0]) * 2 + 1;
  const clefValue = clef.charCodeAt(0) - 'a'.charCodeAt(0);
  return noteInt - clefPosition + clefValue;
}