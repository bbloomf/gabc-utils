export class GabcSyllabified {
  /*-----  REGEX DEFS  -----*/
  static readonly regexClef = /^[cf]b?[1-4]$/;
  static readonly regexNonSyllabicGabc = /^([cf]b?[1-4]|[,;:`]+|[a-m]\+|[zZ]0?)+$/;
  static readonly regexFindParensWithLeadSpaces = /^(\s*)\(([\s\S]*)\)$/;
  static readonly regexFindParens = /^\(([\s\S]*)\)$/;

  static merge(syllabifiedText: string, musicalNotation: string, isEaster?: boolean, useLargeInitial: boolean = true) {

    const { text, notation } = GabcSyllabified.normalizeInputs(syllabifiedText, musicalNotation, isEaster);

    if (!notation) return text;

    const { syllables, notationNodes } = GabcSyllabified.splitInputs(text, notation);

    let sylNdx = 0
    let isFirstSyl = true;
    let result = notationNodes
      .map((notation) => {
        const { syllable, nextIndex, isFirstSyllable } = GabcSyllabified.mapSyllable(notation, syllables, sylNdx, isFirstSyl, useLargeInitial);
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
  static normalizeInputs(text: string, notation: string, isEaster?: boolean): { text: string, notation: string } {
    // normalize the text, getting rid of multiple consecutive whitespace,
    // and handling lilypond's \forceHyphen directive
    // remove flex and mediant symbols if accents are marked with pipes:
    if (/\|/.test(text)) {
      text = text.replace(/[†*]/g, "");
    }

    text = text.replace(/\xad/g, "")
      .replace(/\xa0/g, " ");
    const notationMatch = notation.match(/(::|[:;,`])(\s[^:;,`]+::\s*)$/);
    const regexEasterTime = /\s*\([ET]\.\s*[TP]\.[^)]+\)/g;
    const hasEasterTime = regexEasterTime.test(text);
    if (typeof isEaster === 'boolean') {
      if (hasEasterTime) {
        if (isEaster) {
          text = text.replace(/([,;:.!?])?\s*\([ET]\.\s*[TP]\.\s*([^)]+)\)/g, (whole,punctuation,alleluia) => {
            return `${(punctuation || ',')} ${alleluia}`;
          });
          if (notationMatch) notation = notation.slice(0, notationMatch.index) + ';' + notationMatch[2];
        } else {
          text = text.replace(regexEasterTime, '');
          if (notationMatch) notation = notation.slice(0, notationMatch.index) + '::';
        }
      }
    } else {
      if (notationMatch) notation = notation.slice(0, notationMatch.index) + '::' + notationMatch[2];
      text = text.replace(
        /([^,.;:\s])\s+\((E|T)\.\s*(T|P)\.\s*(a|A)([^)]+)\)([,.;:]*)/,
        "$1$6 (<i>$2.$3.</i>) A$5$6"
      );
    }
    text = text
      // remove poetiic tags:
      .replace(/<\/?poetic>/g,'')

      // replace rubric tags:
      .replace(/<rubric>([^<]*)<\/rubric>/g,'<alt><c><i>$1</alt>')
      .replace(/(\s){([^}]+)}(\s)/g,'$1<alt><c><i>$2</alt>$3')

      .replace(/%[^\n]*(\n|$)/g, '$1')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/(\s)\s+/g, '$1')
      .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, '$1-')
      .replace(/\|([^|]+)\|/g, '+$1+')
      .replace(/([ -])\+|\+(\W*(?:[-\s]|$))/g, '$1$2')
      .replace(/(^|\s)([^{}\s]+~[^{}\s]+)(?=$|\s)/g,'$1{$2}')
      .trim()
    ;

    notation = notation.replace(/%[^\n]*(\n|$)/g, '$1').trim();

    return { text, notation }
  }



  static splitInputs(text: string, notation: string): { syllables: string[], notationNodes: string[] } {
    let lastSyl: string;
    const syllables = text
      .split(/(\s*(?:(?:<alt>[\s\S]*?<\/alt>|<h\d>[\s\S]*?<\/h\d>)\s*)+)|\s+--\s+|\+|(\s*\(?"[^"]+"\)?-?)|(\s*\([^+)]+\))|(\s*[^\s-+]+-)(?=[^\s-])|(?=\s)/)
      .filter(syl => syl?.trim())
      .reduce((result, syl) => {
        // reverse the order when two <alt>s are in a row, and remove whitespace between them:
        syl = syl.replace(/(?:<alt>.*?<\/alt>\s*){2,}/g, (alts) => (
          alts.split(/(<alt>.*?<\/alt>)/).reverse().filter(text => !!text.trim()).join('')
        ));
        // remove parentheses around verse markers so that they can get concatenated with the next syllable:
        syl = syl.replace(/^\(((?:[℣℟]|\d+)\.?)\)$/, '$1');
        if (/^\s*(<(alt|h\d)>|([℣℟]|\d+)\.?$)/.test(lastSyl)) {
          if(syl.startsWith('(') && syl.endsWith(')')) {
            syl = syl.slice(1);
            result[result.length - 1] = '(' + result[result.length - 1];
          }
          result[result.length - 1] += syl;
        } else {
          result.push(syl);
        }
        lastSyl = syl;
        return result;
      }, [] as string[])
    ;

    const notationNodes = notation.split(/\s+/);

    return { syllables, notationNodes };
  }

  /*-----  STRING UTIL FUNCTIONS  -----*/
  static stripParens(s: string) {
    return s.replace(GabcSyllabified.regexFindParensWithLeadSpaces, '$1$2');
  }
  static stripNonDisplayCharacters(syllable: string) {
    return syllable.replace(/^(\s*)"?\(([\s\S]*?)\)"?$/, '$1$2').replace(/^(\s*)[!(]/, '$1');
  }
  // check whether a syllable text represents a syllable or not,
  //   It is considered non-syllable if
  //     * it starts with !
  //     * it contains no letters
  //     * it is surrounded by parentheses
  //     * It starts with a parenthesis and contains only letters and periods, e.g. `(E.T.` or `(T.P.`
  static isNonSyllableString (s: string) {
    return /^(?:\s*<(alt|h\d)>.*?<\/\1>\s*)*(\s*!|(\s*[^\sa-záéíóúýàèìòùäëïöüÿæœǽœ́][^a-záéíóúýàèìòùäëïöüÿæœǽœ́]*)$|(\s*\((?:[\s\S]*\)|[A-Z\.]+))$|(\s*"\([\s\S]*\)"$))/i.test(s);
  }


  /*-----  GETTER FUNCTIONS  -----*/
  static getSyllable(syllables: string[], index: number) {
    return (syllables[index] || ' ').replace(/\)([^a-z]*)$/i,"$1").replace(/^(\s*)"(.*)"$/, '$1$2');
  }

  static getNonSyllable(syllables: string[], syllableNdx: number, notation?: string, noSyllable?: boolean): string {
    let syllable = syllables[syllableNdx];

    const hasAltHTag = /<(alt|h\d)>/.test(syllable);
    const isVerseMarker = /^\s*(\d+|℣|℟)\.?/.test(syllable);

    if(
      GabcSyllabified.isNonSyllableString(syllable) &&
      !GabcSyllabified.regexClef.test(notation) &&
      // If there is a GABC notation that does not get a syllable, e.g., a double bar, we need to make sure
      // that we don't use the text if it has an <h2> tag or an <alt> tag or is a verse marker:
      (noSyllable !== true || !(hasAltHTag || isVerseMarker))
    ) {
      return GabcSyllabified.stripNonDisplayCharacters(syllable);
    }

    return '';
  }

  static getNonSyllableOrSpace(syllables: string[], syllableNdx: number, notation?: string): string {
    return GabcSyllabified.getNonSyllable(syllables, syllableNdx, notation) || ' ';
  }

  /*-----  PROCESSOR FUNCTIONS  -----*/
  static mapSyllable(
    notation: string,
    syllables: string[],
    sylNdx: number,
    isFirstSyllable: boolean,
    useLargeInitial?: boolean
  ): { syllable: string, nextIndex: number, isFirstSyllable: boolean } {
    const noSyllable = GabcSyllabified.regexNonSyllabicGabc.test(notation) || /^\(.*\)$/.test(notation);
    notation = GabcSyllabified.stripParens(notation);

    let nonSyllable = GabcSyllabified.getNonSyllable(syllables, sylNdx, notation, noSyllable);
    let syllable = noSyllable ? (nonSyllable || " ") : GabcSyllabified.getSyllable(syllables, sylNdx++);
    if (noSyllable) {
      if(/\S/.test(syllable)) sylNdx++;
    } else {
      if (nonSyllable) {
        syllable = nonSyllable;
        let nextNonSyllable: string;
        while ((nextNonSyllable = GabcSyllabified.getNonSyllable(syllables, sylNdx++))) {
          syllable += `()${nextNonSyllable}`
        }
        syllable += `()${GabcSyllabified.getSyllable(syllables, sylNdx - 1)}`
      }

      if (isFirstSyllable) {
        isFirstSyllable = false;
        if(useLargeInitial) {
          syllable = GabcSyllabified.capitalizeInitial(syllable, syllables[sylNdx]);
        }
      }
    }

    syllable = syllable + '(' + notation + ')';

    return { syllable, nextIndex: sylNdx, isFirstSyllable }
  }

  static capitalizeInitial(syllable: string, nextSyllable: string): string {
    const syllableMatch = /^\s*([a-záéíóúýàèìòùäëïöüÿæœǽœ́]+)/i.exec(syllable)
    if (syllableMatch) {
      // special capitalization rules for the large initial:
      // the second letter should also be capitalized, and the third as well,
      // if it is a three letter word
      syllable = syllable.slice(0, 2).toUpperCase() + syllable.slice(2).toLowerCase();
      if (syllableMatch[1].length === 3 && /^\s/.test(nextSyllable)) {
        syllable = syllable.toUpperCase();
      }
    }

    return syllable;
  }
}
