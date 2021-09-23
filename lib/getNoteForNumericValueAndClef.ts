export function getNoteForNumericValueAndClef(numericValue: number, clef: string) {
  const clefPosition = Number(clef.match(/\d+/)[0]) * 2 + 1;
  const clefValue = clef.charCodeAt(0) - 'a'.charCodeAt(0);
  // numericValue = noteInt - clefPosition + clefValue;
  const noteInt = numericValue - clefValue + clefPosition;
  // const noteInt = note.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
  return String.fromCharCode('a'.charCodeAt(0) + noteInt);
}