export class GabcSyllabified {
  /*-----  REGEX DEFS  -----*/
  static readonly regexClef = /^[cf]b?[1-4]$/;
  static readonly regexNonSyllabicGabc = /^([cf]b?[1-4]|[,;:`]+|[a-m]\+|[zZ]0?)+$/;
  static readonly regexFindParensWithLeadSpaces = /^(\s*)\((.*)\)$/;
  static readonly regexFindParens = /^\((.*)\)$/;

  static merge(syllabifiedText: string, musicalNotation: string, useLargeInitial: boolean = true) {

    const { text, notation } = GabcSyllabified.normalizeInputs(syllabifiedText, musicalNotation);

    if (!text) return notation;
    if (!notation) return text;

    const { syllables, notationNodes } = GabcSyllabified.splitInputs(text, notation);

    let sylNdx = 0
    let isFirstSyl = true;
    let result = notationNodes
      .map((notation) => {
        const { syllable, nextIndex, isFirstSyllable } = GabcSyllabified.mapSyllable(notation, syllables, sylNdx, isFirstSyl);
        sylNdx = nextIndex;
        isFirstSyl = isFirstSyllable;
        return syllable;
      })
      .join('')
      .trim()
    ;

    // add any additional syllables that come after the last notation data:
    while (sylNdx < syllables.length) {
      result +=
        syllables[sylNdx++].replace(/^(\s*)"?\(?(.*?)\)?"?$/, '$1$2') + '()';
    }
    return result;
  }

  /*-----  NORMALIZATION FUNCTIONS  -----*/
  static normalizeInputs(text: string, notation: string): { text: string, notation: string } {
    // normalize the text, getting rid of multiple consecutive whitespace,
    // and handling lilypond's \forceHyphen directive
    text = text
      .replace(/%[^\n]*(\n|$)/g, '$1')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/(\s)\s+/g, '$1')
      .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, '$1-')
      .trim()
    ;

    notation = notation.replace(/%[^\n]*(\n|$)/g, '$1').trim();

    return { text, notation }
  }



  static splitInputs(text: string, notation: string): { syllables: string[], notationNodes: string[] } {
    const syllables = text
      .split(/\s+--\s+|\+|(\s*\(?"[^"]+"\)?-?)|([^\s-+]+-)(?=[^\s-])|(?=\s)/)
      .filter((syl) => syl && syl.trim());

    const notationNodes = notation.split(/\s+/);

    return { syllables, notationNodes };
  }

  /*-----  STRING UTIL FUNCTIONS  -----*/
  static stripParens(s: string) {
    return s.replace(GabcSyllabified.regexFindParensWithLeadSpaces, '$1$2')
        s.replace(GabcSyllabified.regexFindParens, '$1')
    ;
  }

  /*-----  GETTER FUNCTIONS  -----*/
  static getSyllable(syllables: string[], index: number) {
    return (syllables[index] || ' ').replace(/^(\s*)"(.*)"$/, '$1$2');
  }

  static getNonSyllable(syllables: string[], syllableNdx: number, notation: string): string {
    let syllable = syllables[syllableNdx];

    if (/^(\s*!|[^a-záéíóúýàèìòùäëïöüÿæœǽœ́]+$|\s*\(.*\)$|\s*"\(.*\)"$)/i.test(syllable)
        && !GabcSyllabified.regexClef.test(notation)) {

      return syllable.replace(/^(\s*)!/, '$1')
          .replace(/^(\s*)"?\((.*?)\)"?$/, '$1$2')
      ;
    }

    return ' ';
  }

  /*-----  PROCESSOR FUNCTIONS  -----*/
  static mapSyllable(
    notation: string,
    syllables: string[],
    sylNdx: number,
    isFirstSyllable: boolean
  ): { syllable: string, nextIndex: number, isFirstSyllable: boolean } {
    const noSyllable = GabcSyllabified.regexNonSyllabicGabc.test(notation) || /^\(.*\)$/.test(notation);
    notation = GabcSyllabified.stripParens(notation);

    let syllable = noSyllable ? GabcSyllabified.getNonSyllable(syllables, sylNdx, notation) : GabcSyllabified.getSyllable(syllables, sylNdx++);
    if (!noSyllable) {
      let nextSyllable = syllable;
      syllable = GabcSyllabified.stripParens(syllable);

      while (/^\s*\(.*\)$/.test(nextSyllable)) {
        if (/^".*"$/.test(syllable)) {
          syllable = syllable.slice(1, -1);
        }

        nextSyllable = GabcSyllabified.getSyllable(syllables, sylNdx++);
        syllable += '()' + GabcSyllabified.stripParens(nextSyllable);
      }

      if (isFirstSyllable) {
        isFirstSyllable = false;

        syllable = GabcSyllabified.capitalizeInitial(syllable, syllables[sylNdx]);
      }
    }

    syllable = syllable + '(' + notation + ')';

    return { syllable, nextIndex: sylNdx, isFirstSyllable }
  }

  static capitalizeInitial(syllable: string, nextSyllable: string): string {
    if (/^\s*[a-záéíóúýàèìòùäëïöüÿæœǽœ́]+/i.test(syllable)) {
      // special capitalization rules for the large initial:
      // the second letter should also be capitalized, and the third as well,
      // if it is a three letter word
      syllable = syllable.slice(0, 2).toUpperCase() + syllable.slice(2).toLowerCase();
      if (syllable.length === 3 && /^\s/.test(nextSyllable)) {
        syllable = syllable.toUpperCase();
      }
    }

    return syllable;
  }
}
