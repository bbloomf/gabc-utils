/**
 * shift all notes in GABC by shift (upward if positive, downward if negative)
 * @param gabc string of GABC (without parentheses)
 * @param shift amount to shift
 */
export function shiftGabc(gabc: string, shift: number) {
  return gabc.replace(/([cf]b?[1-4])|([a-m])/gi, (match, clef, c) => {
    if (clef) return clef;
    const newC = String.fromCharCode(c.charCodeAt(0) + shift);
    if (!/[a-m]/i.test(newC)) throw "cannot be shifted that much";
    return newC;
  });
}
