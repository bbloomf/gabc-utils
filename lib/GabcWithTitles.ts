export type GabcWithTitles = {
  gabc: string;
  supertitle?: string;
  title?: string;
  subtitle?: string;
};

const regexClef = /\([^)]*([cf]b?[1-4])/g;

export const splitGabcByTitle = (gabc: string): GabcWithTitles[] => {
  const gabcAndHeaders = gabc.split(/\s*<h2>([\s\S]*?)<\/h2>\s*/);
  // even indices are GABC; odd indices are <h2> tags.

  gabc = gabcAndHeaders[0];
  const result: GabcWithTitles[] = [{ gabc }];
  let { clef, isOnlyClef } = getLastClef(gabc);
  if (isOnlyClef) {
    result.pop();
  }
  for (let i = 1; i < gabcAndHeaders.length; i += 2) {
    const subtitle = gabcAndHeaders[i];
    const gabc = `(${clef})` + gabcAndHeaders[i + 1];
    ({ clef } = getLastClef(gabc));
    result.push({ gabc, subtitle });
  }
  return result;
};

function getLastClef(gabc: string): { clef?: string; isOnlyClef: boolean } {
  const matches = gabc.match(regexClef);
  if (matches) {
    const gabcWithoutWhitespace = gabc.replace(/\s+/g, "");
    const lastMatch = matches.pop();
    regexClef.exec("");
    const clef = regexClef.exec(lastMatch)[1];
    return {
      clef,
      isOnlyClef: gabcWithoutWhitespace === `(${clef})`,
    };
  }
  return {
    isOnlyClef: false,
  };
}
