Object.defineProperty(exports, '__esModule', { value: true });

var GabcSyllabified = /** @class */ (function () {
    function GabcSyllabified() {
    }
    GabcSyllabified.merge = function (syllabifiedText, musicalNotation, isEaster, useLargeInitial) {
        if (useLargeInitial === void 0) { useLargeInitial = true; }
        var _a = GabcSyllabified.normalizeInputs(syllabifiedText, musicalNotation, isEaster), text = _a.text, notation = _a.notation;
        if (!notation)
            return text;
        var _b = GabcSyllabified.splitInputs(text, notation), syllables = _b.syllables, notationNodes = _b.notationNodes;
        var sylNdx = 0;
        var isFirstSyl = true;
        var result = notationNodes
            .map(function (notation) {
            var _a = GabcSyllabified.mapSyllable(notation, syllables, sylNdx, isFirstSyl, useLargeInitial), syllable = _a.syllable, nextIndex = _a.nextIndex, isFirstSyllable = _a.isFirstSyllable;
            sylNdx = nextIndex;
            isFirstSyl = isFirstSyllable;
            return syllable;
        })
            .join('')
            .trim();
        // add any additional syllables that come after the last notation data:
        while (sylNdx < syllables.length) {
            result +=
                syllables[sylNdx++].replace(/^(\s*)"?\(?(.*?)\)?"?$/, '$1$2') + '()';
        }
        return result;
    };
    /*-----  NORMALIZATION FUNCTIONS  -----*/
    GabcSyllabified.normalizeInputs = function (text, notation, isEaster) {
        // normalize the text, getting rid of multiple consecutive whitespace,
        // and handling lilypond's \forceHyphen directive
        // remove flex and mediant symbols if accents are marked with pipes:
        if (/\|/.test(text)) {
            text = text.replace(/\([†*]\)|[†*]/g, "");
        }
        text = text.replace(/\xad/g, "")
            .replace(/\xa0/g, " ");
        var notationMatch = null;
        var regexEasterTime = /\s*\([ET]\.\s*[TP]\.([^)]+)\)[.!]?\s*$/;
        var matchEasterTime = regexEasterTime.exec(text);
        if (matchEasterTime) {
            var syllableCount = matchEasterTime[1].split(/\s+--\s+|\s+|\+|-|\|([^|\s]+)\|/).filter(function (syl) { return syl; }).length;
            notationMatch = notation.match("(::|[:;,])((\\s+[^,`:;\\s]+(?:\\s+(?:[,`]|\\([^)]*))*){" + syllableCount + "}\\s+::\\s*)$");
        }
        if (typeof isEaster === 'boolean') {
            if (matchEasterTime) {
                if (isEaster) {
                    text = text.replace(/([,;:.!?])?\s*\([ET]\.\s*[TP]\.\s*([^)]+)\)/g, function (whole, punctuation, alleluia) {
                        return (punctuation || ',') + " " + alleluia;
                    });
                    if (notationMatch)
                        notation = notation.slice(0, notationMatch.index) + ';' + notationMatch[2];
                }
                else {
                    text = text.replace(regexEasterTime, '.');
                    if (notationMatch)
                        notation = notation.slice(0, notationMatch.index) + '::';
                }
            }
        }
        else {
            if (notationMatch && matchEasterTime)
                notation = notation.slice(0, notationMatch.index) + '::' + notationMatch[2];
            text = text.replace(/([^,.;:\s])\s+\((E|T)\.\s*(T|P)\.\s*(a|A)([^\s+-]*)([^)]+)\)([,.;:]*)/, "$1$7 \"<i>$2.$3.</i> A$5\"$6$7");
        }
        text = text
            // remove poetiic tags:
            .replace(/<\/?poetic>/g, '')
            // replace rubric tags:
            .replace(/<rubric>([^<]*)<\/rubric>/g, '<alt><c><i>$1</alt>')
            .replace(/(\s){([^}]+)}(\s)/g, '$1<alt><c><i>$2</alt>$3')
            .replace(/%[^\n]*(\n|$)/g, '$1')
            .replace(/\s*\n\s*/g, '\n')
            .replace(/(\s)\s+/g, '$1')
            .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, '$1-')
            .replace(/\|([^|]+)\|/g, '+$1+')
            .replace(/([ -])\+|\+([^a-záéíóúýàèìòùäëïöüÿæœǽœ́]*(?:[-\s]|$))/ig, '$1$2')
            .replace(/(^|\s)([^{}\s]+~[^{}\s]+)(?=$|\s)/g, '$1{$2}')
            .trim();
        notation = notation.replace(/%[^\n]*(\n|$)/g, '$1').trim();
        return { text: text, notation: notation };
    };
    GabcSyllabified.splitInputs = function (text, notation) {
        var lastSyl;
        var syllables = text
            .split(/(\s*(?:(?:<alt>[\s\S]*?<\/alt>|<h\d>[\s\S]*?<\/h\d>)\s*)+)|\s+--\s+|\+|(\s*\(?"[^"]+"\)?-?)|(\s*\([^+)]+\))|(\s*[^\s-+]+-)(?=[^\s-])|(?=\s)/)
            .filter(function (syl) { return syl === null || syl === void 0 ? void 0 : syl.trim(); })
            .reduce(function (result, syl) {
            // reverse the order when two <alt>s are in a row, and remove whitespace between them:
            syl = syl.replace(/(?:<alt>.*?<\/alt>\s*){2,}/g, function (alts) { return (alts.split(/(<alt>.*?<\/alt>)/).reverse().filter(function (text) { return !!text.trim(); }).join('')); });
            // remove parentheses around verse markers so that they can get concatenated with the next syllable:
            syl = syl.replace(/^\(((?:[℣℟]|\d+)\.?)\)$/, '$1');
            if (/^\s*(<(alt|h\d)>|([℣℟]|\d+)\.?$)/.test(lastSyl)) {
                if (syl.startsWith('(') && syl.endsWith(')')) {
                    syl = syl.slice(1);
                    result[result.length - 1] = '(' + result[result.length - 1];
                }
                result[result.length - 1] += syl;
            }
            else {
                result.push(syl);
            }
            lastSyl = syl;
            return result;
        }, []);
        var notationNodes = notation.split(/\s+/);
        return { syllables: syllables, notationNodes: notationNodes };
    };
    /*-----  STRING UTIL FUNCTIONS  -----*/
    GabcSyllabified.stripParens = function (s) {
        return s.replace(GabcSyllabified.regexFindParensWithLeadSpaces, '$1$2');
    };
    GabcSyllabified.stripNonDisplayCharacters = function (syllable) {
        return syllable.replace(/^(\s*)"?\(([\s\S]*?)\)"?$/, '$1$2').replace(/^(\s*)[!(]/, '$1');
    };
    // check whether a syllable text represents a syllable or not,
    //   It is considered non-syllable if
    //     * it starts with !
    //     * it contains no letters
    //     * it is surrounded by parentheses
    //     * It starts with a parenthesis and contains only letters and periods, e.g. `(E.T.` or `(T.P.`
    GabcSyllabified.isNonSyllableString = function (s) {
        return /^(?:\s*<(alt|h\d)>.*?<\/\1>\s*)*(\s*!|(\s*[^\sa-záéíóúýàèìòùäëïöüÿæœǽœ́][^a-záéíóúýàèìòùäëïöüÿæœǽœ́]*)$|(\s*\((?:[\s\S]*\)|[A-Z\.]+))$|(\s*"\([\s\S]*\)"$))/i.test(s);
    };
    /*-----  GETTER FUNCTIONS  -----*/
    GabcSyllabified.getSyllable = function (syllables, index) {
        return (syllables[index] || ' ').replace(/\)([^a-z]*)$/i, "$1").replace(/^(\s*)"(.*)"$/, '$1$2');
    };
    GabcSyllabified.getNonSyllable = function (syllables, syllableNdx, notation, noSyllable) {
        var syllable = syllables[syllableNdx];
        var hasAltHTag = /<(alt|h\d)>/.test(syllable);
        var isVerseMarker = /^\s*(\d+|℣|℟)\.?/.test(syllable);
        if (GabcSyllabified.isNonSyllableString(syllable) &&
            !GabcSyllabified.regexClef.test(notation) &&
            // If there is a GABC notation that does not get a syllable, e.g., a double bar, we need to make sure
            // that we don't use the text if it has an <h2> tag or an <alt> tag or is a verse marker:
            (noSyllable !== true || !(hasAltHTag || isVerseMarker))) {
            return GabcSyllabified.stripNonDisplayCharacters(syllable);
        }
        return '';
    };
    GabcSyllabified.getNonSyllableOrSpace = function (syllables, syllableNdx, notation) {
        return GabcSyllabified.getNonSyllable(syllables, syllableNdx, notation) || ' ';
    };
    /*-----  PROCESSOR FUNCTIONS  -----*/
    GabcSyllabified.mapSyllable = function (notation, syllables, sylNdx, isFirstSyllable, useLargeInitial) {
        var noSyllable = GabcSyllabified.regexNonSyllabicGabc.test(notation) || /^\(.*\)$/.test(notation);
        notation = GabcSyllabified.stripParens(notation);
        var nonSyllable = GabcSyllabified.getNonSyllable(syllables, sylNdx, notation, noSyllable);
        var syllable = noSyllable ? (nonSyllable || " ") : GabcSyllabified.getSyllable(syllables, sylNdx++);
        if (noSyllable) {
            if (/\S/.test(syllable))
                sylNdx++;
        }
        else {
            if (nonSyllable) {
                syllable = nonSyllable;
                var nextNonSyllable = void 0;
                while ((nextNonSyllable = GabcSyllabified.getNonSyllable(syllables, sylNdx++))) {
                    syllable += "()" + nextNonSyllable;
                }
                syllable += "()" + GabcSyllabified.getSyllable(syllables, sylNdx - 1);
            }
            if (isFirstSyllable) {
                isFirstSyllable = false;
                if (useLargeInitial) {
                    syllable = GabcSyllabified.capitalizeInitial(syllable, syllables[sylNdx]);
                }
            }
        }
        syllable = syllable + '(' + notation + ')';
        return { syllable: syllable, nextIndex: sylNdx, isFirstSyllable: isFirstSyllable };
    };
    GabcSyllabified.capitalizeInitial = function (syllable, nextSyllable) {
        var syllableMatch = /^\s*([a-záéíóúýàèìòùäëïöüÿæœǽœ́]+)/i.exec(syllable);
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
    };
    /*-----  REGEX DEFS  -----*/
    GabcSyllabified.regexClef = /^[cf]b?[1-4]$/;
    GabcSyllabified.regexNonSyllabicGabc = /^([cf]b?[1-4]|[,;:`]+|[a-m]\+|[zZ]0?)+$/;
    GabcSyllabified.regexFindParensWithLeadSpaces = /^(\s*)\(([\s\S]*)\)$/;
    GabcSyllabified.regexFindParens = /^\(([\s\S]*)\)$/;
    return GabcSyllabified;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var applyStyleToSyllables = function (style, syllables, result) {
    var lastSyllable = syllables[syllables.length - 1];
    var workingString = {
        style: style,
        text: syllables.length > 1
            ? syllables[0].withoutPreText() +
                syllables.slice(1, -1).join("") +
                lastSyllable.withoutPostText()
            : syllables[0].text,
    };
    result.push(workingString);
    return { text: lastSyllable.getPostText() };
};

function findLatinPhraseAccents(words) {
    var allSyllables = words.flatMap(function (word) { return word.syllables; });
    var nextAccentI = allSyllables.length;
    for (var i = nextAccentI - 1; i >= 0; --i) {
        var syl = allSyllables[i];
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
}

function findLatinWordAccent(syllables) {
    if (syllables.length > 1 && syllables.every(function (syl) { return !syl.isAccented; })) {
        if (syllables.length <= 3 && /[AEIOUY]/.test(syllables[0].text)) {
            // If the first syllable is the penult or ante-penult andit contains a capital vowel, then it is accented according to standard non-usage of accented capitals.
            syllables[0].isAccented = true;
        }
        else {
            // otherwise, apply accent to the penult
            syllables[syllables.length - 2].isAccented = true;
        }
    }
}

function findSpanishPhraseAccents(words) {
    var _a, _b;
    var lastWordSyllables = (_b = (_a = words[words.length - 1]) === null || _a === void 0 ? void 0 : _a.syllables) !== null && _b !== void 0 ? _b : [];
    if (lastWordSyllables.length === 1) {
        lastWordSyllables[0].isAccented = true;
    }
}

function findSpanishWordAccent(syllables) {
    if (syllables.length > 1 && syllables.every(function (syl) { return !syl.isAccented; })) {
        var lastSyllable = syllables[syllables.length - 1];
        var accentPenult = /[aeiouy][ns]?$/i.test(lastSyllable.text);
        var accentIndex = accentPenult ? 2 : 1;
        syllables[syllables.length - accentIndex].isAccented = true;
    }
}

(function (VerseSegmentType) {
    VerseSegmentType["Flex"] = "flex";
    VerseSegmentType["Mediant"] = "mediant";
    VerseSegmentType["Termination"] = "termination";
})(exports.VerseSegmentType || (exports.VerseSegmentType = {}));
var VerseText = /** @class */ (function () {
    /**
     *
     * @param text the text to be split into segments
     * @param syllabify a function that takes a word string and returns an array of its syllables
     */
    function VerseText(text, isEaster, syllabify, language) {
        var _a;
        if (isEaster === void 0) { isEaster = false; }
        if (syllabify === void 0) { syllabify = VerseText.defaultSyllabify; }
        if (language === void 0) { language = 'en'; }
        if (typeof text === "object") {
            (_a = text, text = _a.text, isEaster = _a.isEaster, language = _a.language, syllabify = _a.syllabify);
        }
        if (isEaster) {
            text = text.replace(/\s*([†*]?)\s*\(([†*]?)\)/g, ' $2');
            text = text.replace(/([,;:.!?])?(\s+[†*])?(\s)\s*\(E\.\s*T\.\s*([^)]+)\)/g, function (whole, punctuation, flexMediant, whitespace, alleluia) {
                return "" + (punctuation || ',') + flexMediant + whitespace + alleluia;
            });
        }
        else if (isEaster === false) {
            text = text.replace(/\s*([†*]?)\s*\(([†*]?)\)/g, ' $1');
            text = text.replace(/\s*\(E\.\s*T\.[^)]+\)/g, '');
        }
        var stanzas = text.split(/\n\s*\n/);
        this.stanzas = stanzas.map(function (stanza) { return VerseText.splitIntoSegments(stanza, syllabify, language); });
        this.segments = this.stanzas.flat();
        this.language = language;
    }
    /**
     * Returns a verse with GABC
     * @param  {Object} psalmTone hash of GabcPsalmTones for flex, mediant, and termination
     * @return {string}           GABC string
     */
    VerseText.prototype.withGabc = function (psalmTone, _a) {
        var _b;
        var _this = this;
        var _c = _a === void 0 ? {} : _a, _d = _c.startVersesOnNewLine, startVersesOnNewLine = _d === void 0 ? false : _d, _e = _c.stripFlexMediantSymbols, stripFlexMediantSymbols = _e === void 0 ? true : _e, _f = _c.addSequentialVerseNumbersStartingAt, addSequentialVerseNumbersStartingAt = _f === void 0 ? 0 : _f, addInitialVerseNumber = _c.addInitialVerseNumber, _g = _c.minSylsOnRecitingTone, minSylsOnRecitingTone = _g === void 0 ? psalmTone.isGregorianSolemn ? -1 : 2 : _g, _h = _c.useLargeInitial, useLargeInitial = _h === void 0 ? true : _h, _j = _c.barDictionary, barDictionary = _j === void 0 ? (_b = {},
            _b[exports.VerseSegmentType.Flex] = ",",
            _b[exports.VerseSegmentType.Mediant] = ";",
            _b[exports.VerseSegmentType.Termination] = ":",
            _b) : _j;
        if (psalmTone.isMeinrad) {
            // some default overrides for meinrad tones, and a check to make sure there are 2-6 segments
            var stanzaLengths = this.stanzas.map(function (segments) { return segments.length; });
            if (Math.min.apply(Math, stanzaLengths) < 2 || Math.max.apply(Math, stanzaLengths) > 6) {
                throw "Cannot use a Meinrad tone with a [" + stanzaLengths.join(', ') + "] line text.";
            }
            stripFlexMediantSymbols = true;
            barDictionary[exports.VerseSegmentType.Flex] = ";";
        }
        else if (psalmTone.isGregorianSolemn) {
            barDictionary[exports.VerseSegmentType.Flex] = barDictionary[exports.VerseSegmentType.Mediant] = ":";
        }
        var nextSequentialVerseNumber = addSequentialVerseNumbersStartingAt;
        if (addInitialVerseNumber !== undefined) {
            nextSequentialVerseNumber = addInitialVerseNumber;
        }
        else {
            addInitialVerseNumber = 0;
        }
        if (nextSequentialVerseNumber <= 0) {
            nextSequentialVerseNumber = 0;
        }
        var getNextVerseNumberString = function (stanzaI) {
            var _a;
            var verseMarker = ((_a = _this.stanzas[stanzaI]) === null || _a === void 0 ? void 0 : _a[0]).verseMarker;
            if (verseMarker)
                return verseMarker + ' ';
            if (addInitialVerseNumber) {
                var result = nextSequentialVerseNumber + ". ";
                addInitialVerseNumber = 0;
                nextSequentialVerseNumber = 0;
                return result;
            }
            return (nextSequentialVerseNumber && typeof nextSequentialVerseNumber === "number")
                ? nextSequentialVerseNumber++ + ". "
                : "";
        };
        useLargeInitial =
            useLargeInitial &&
                !addSequentialVerseNumbersStartingAt &&
                !addInitialVerseNumber;
        var verseMarker;
        return "(" + psalmTone.clef + ") " + (this.stanzas.map(function (stanza, i) {
            return (verseMarker = getNextVerseNumberString(i)) +
                _this.getStanzaGabc(psalmTone, i, {
                    startVersesOnNewLine: startVersesOnNewLine,
                    stripFlexMediantSymbols: stripFlexMediantSymbols,
                    minSylsOnRecitingTone: minSylsOnRecitingTone,
                    useLargeInitial: useLargeInitial && i === 0 && verseMarker === '',
                    barDictionary: barDictionary,
                });
        }).join('\n\n'));
    };
    VerseText.prototype.getStanzaGabc = function (psalmTone, i, _a) {
        var _b;
        var _this = this;
        var _c = _a === void 0 ? {} : _a, _d = _c.startVersesOnNewLine, startVersesOnNewLine = _d === void 0 ? false : _d, _e = _c.stripFlexMediantSymbols, stripFlexMediantSymbols = _e === void 0 ? true : _e, _f = _c.minSylsOnRecitingTone, minSylsOnRecitingTone = _f === void 0 ? 2 : _f, _g = _c.useLargeInitial, useLargeInitial = _g === void 0 ? true : _g, _h = _c.barDictionary, barDictionary = _h === void 0 ? (_b = {},
            _b[exports.VerseSegmentType.Flex] = ",",
            _b[exports.VerseSegmentType.Mediant] = ";",
            _b[exports.VerseSegmentType.Termination] = ":",
            _b) : _h;
        var segments = this.stanzas[i];
        var stanzaCount = segments.filter(function (segment) { return segment.segmentType === exports.VerseSegmentType.Termination; }).length;
        var stanzaI = 0;
        var intonationFollowingFlex = null;
        if (psalmTone.isGregorianSolemn) {
            var termination = psalmTone[exports.VerseSegmentType.Termination];
            var mediant_1 = psalmTone[exports.VerseSegmentType.Mediant];
            intonationFollowingFlex = termination.gabc.intonation.flatMap(function (tone) {
                return tone.toneAccentFork
                    ? tone.toneAccentFork[tone.toneAccentFork.length - 1]
                    : tone;
            });
            if (termination.gabc.tenor !== mediant_1.gabc.tenor) {
                // handle cases like in tone 6, where the tenor of the termination is different from the tenor of the mediant
                // by changing the intonation to only include the notes required to get to the tenor pitch
                var firstMediantTenor = intonationFollowingFlex.findIndex(function (tone) { return tone.gabc === mediant_1.gabc.tenor; });
                if (firstMediantTenor < 0) {
                    firstMediantTenor =
                        1 +
                            intonationFollowingFlex.findIndex(function (tone) { return tone.gabc.indexOf(mediant_1.gabc.tenor) >= 0; });
                }
                intonationFollowingFlex = intonationFollowingFlex.slice(0, firstMediantTenor);
            }
        }
        return (segments
            .map(function (seg, i, segments) {
            var _a;
            var useFlex = seg.segmentType === exports.VerseSegmentType.Flex, segmentName = useFlex ? exports.VerseSegmentType.Mediant : seg.segmentType, tone = psalmTone[segmentName], intonation = false;
            if (psalmTone.isMeinrad) {
                tone = psalmTone.lines[segments.length][i];
                useFlex = false;
            }
            else if (psalmTone.lines.length > 1) {
                var toneIndex = void 0;
                if (psalmTone.lines.length === 2) {
                    toneIndex = stanzaI < stanzaCount - 1 ? 0 : 1;
                }
                else {
                    toneIndex = Math.floor((psalmTone.lines.length * stanzaI) / stanzaCount);
                }
                tone = psalmTone.lines[toneIndex][segmentName];
            }
            if (psalmTone.isGregorianSolemn) {
                useFlex = false;
                intonation = true;
                if (seg.segmentType === exports.VerseSegmentType.Mediant && ((_a = segments[i - 1]) === null || _a === void 0 ? void 0 : _a.segmentType) === exports.VerseSegmentType.Flex) {
                    intonation = intonationFollowingFlex;
                }
            }
            var gabc = seg.withGabc(tone, intonation || i == 0 || i == segments.length - 1, // use intonation on first and last segment, and when required by gregorian solemn tones
            useFlex, stripFlexMediantSymbols, i === 0 && useLargeInitial, minSylsOnRecitingTone, _this.language, psalmTone.isGregorianSolemn);
            var bar;
            if (psalmTone.isMeinrad) {
                if (i === 0) {
                    bar = segments.length === 2 ? ";" : ",";
                }
                else if (i === segments.length - 1) {
                    bar = "::";
                }
                else {
                    bar = i % 2 === 0 ? "," : ";";
                }
            }
            else {
                bar = barDictionary[seg.segmentType];
            }
            if (seg.segmentType === exports.VerseSegmentType.Termination) {
                ++stanzaI;
                if (i === segments.length - 1) {
                    // force a double bar on the last segment:
                    bar = "::";
                }
                else if (startVersesOnNewLine) {
                    // never add a line break unless it isn't the last segment
                    bar += "Z";
                }
            }
            return gabc + (" (" + bar + ")");
        })
            .join("\n\n"));
    };
    VerseText.prototype.toString = function () {
        var _this = this;
        return this.segments
            .map(function (seg, i) {
            var prevSeg = _this.segments[i - 1];
            var indent = prevSeg && prevSeg.segmentType != exports.VerseSegmentType.Termination;
            return (indent ? "\t" : "") + seg.toString();
        })
            .join("\n");
    };
    /**
     * Split a text into segments based on the presence of †, * and \n.
     * @param  {string} text          the text to be split
     * @param  {function} syllabify a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
     * @return {VerseSegment[]}       the array of VerseSegment objects
     */
    VerseText.splitIntoSegments = function (text, syllabify, language) {
        if (syllabify === void 0) { syllabify = VerseText.defaultSyllabify; }
        if (language === void 0) { language = 'en'; }
        var segmentSplit = text.split(/[ \t]*([†*\n/])(\s*)/), segments = [];
        for (var i = 0; i < segmentSplit.length; i += 3) {
            var text_1 = segmentSplit[i];
            if (segmentSplit[i + 1]) {
                text_1 += " " + segmentSplit[i + 1];
            }
            segments.push(new VerseSegment(text_1, syllabify, SegmentTypeDictionary[segmentSplit[i + 1]], segmentSplit[i + 2], language));
        }
        return segments;
    };
    VerseText.defaultSyllabify = function (text) {
        return text
            .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, "$1-")
            .replace(/\s+--\s+/g, "+")
            .replace(/(\|\S+\|)(\S)/gi, "$1+$2")
            .replace(/(\S)(\|\S+\|)/gi, "$1+$2")
            .replace(/(\S-)(\S)/gi, "$1+$2")
            .split(/\+/g);
    };
    return VerseText;
}());
var SegmentTypeDictionary = {
    "†": exports.VerseSegmentType.Flex,
    "*": exports.VerseSegmentType.Mediant,
    "\n": exports.VerseSegmentType.Termination
};
var VerseSegment = /** @class */ (function () {
    function VerseSegment(text, syllabify, type, additionalWhitespace, language) {
        if (syllabify === void 0) { syllabify = VerseText.defaultSyllabify; }
        if (type === void 0) { type = exports.VerseSegmentType.Termination; }
        if (language === void 0) { language = 'en'; }
        var verseMarkerMatch = /^\s*(?:\(([^)]+)\)|((?:\d+|[℣℟])\.?))/.exec(text);
        if (verseMarkerMatch && !/^[ET]\.\s*[TP]\./.test(verseMarkerMatch[1])) {
            this.verseMarker = verseMarkerMatch[1] || verseMarkerMatch[2];
            text = text.slice(verseMarkerMatch[0].length);
        }
        this.words = VerseSegment.splitIntoWords(text, syllabify, language);
        this.syllables = [].concat.apply([], this.words.map(function (word) { return word.syllables; }));
        this.segmentType = type;
        // mark syllable indices:
        this.syllables.forEach(function (syl, i) { return (syl.indexInSegment = i); });
        this.syllables
            .slice()
            .reverse()
            .forEach(function (syl, i) { return (syl.indexFromSegmentEnd = i); });
        // mark the last two accents as 0 and 1:
        this.accentedSyllables = this.syllables
            .filter(function (syl) { return syl.isAccented; })
            .reverse();
        this.additionalWhitespace = additionalWhitespace || "";
    }
    /**
     * get an array of objects containing a text and a style, based on so many accents and preparatory syllables
     * @param  {number} accents     number of accents to mark at end
     * @param  {number} preparatory number of preparatory syllables to mark before the first marked accent
     * @param  {boolean} onlyMarkFirstPreparatory whether to mark only the first preparatory syllable
     * @param  {string} syllableSeparator string used to separate syllables within the same word, defaults to \xAD
     * @return {Object[]}             Array of {text, style} objects
     */
    VerseSegment.prototype.getFormattedStrings = function (_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.accents, accents = _c === void 0 ? 0 : _c, _d = _b.preparatory, preparatory = _d === void 0 ? 0 : _d, _e = _b.accentHasMultipleSyllables, accentHasMultipleSyllables = _e === void 0 ? [] : _e, _f = _b.onlyMarkFirstPreparatory, onlyMarkFirstPreparatory = _f === void 0 ? false : _f, _g = _b.syllableSeparator, syllableSeparator = _g === void 0 ? "\xAD" : _g, _h = _b.includeVerseNumbers, includeVerseNumbers = _h === void 0 ? false : _h;
        var markedAccents = this.accentedSyllables.slice(0, accents).reverse();
        var firstAccentIndex = markedAccents.length
            ? markedAccents[0].indexInSegment || 0
            : this.syllables.length;
        var firstMarkedPreparatoryIndex = Math.max(0, firstAccentIndex - preparatory);
        var result = [];
        var prefix = (includeVerseNumbers &&
            this.words[0].verseNumber &&
            this.words[0].verseNumber + " ") ||
            "";
        var workingString = {
            text: prefix +
                this.syllables
                    .slice(0, firstMarkedPreparatoryIndex)
                    .join(syllableSeparator)
        };
        var nextSyllableIndex = firstMarkedPreparatoryIndex;
        var lastItalicIndex = onlyMarkFirstPreparatory
            ? preparatory > 0
                ? nextSyllableIndex + 1
                : nextSyllableIndex
            : firstAccentIndex;
        var italics = this.syllables.slice(nextSyllableIndex, lastItalicIndex);
        if (italics.length) {
            workingString.text += italics[0].getPreText();
            result.push(workingString);
            workingString = applyStyleToSyllables('italic', italics, result);
            var nonItalic = this.syllables.slice(lastItalicIndex, firstAccentIndex);
            workingString.text += nonItalic.join("");
        }
        nextSyllableIndex = firstAccentIndex;
        markedAccents.forEach(function (accent, i) {
            var _a;
            var hasMultipleSyllables = accentHasMultipleSyllables[i];
            workingString.text += accent.getPreText();
            if (workingString.text)
                result.push(workingString);
            var nextAccent = markedAccents[i + 1];
            var nextAccentIndex = (_a = nextAccent === null || nextAccent === void 0 ? void 0 : nextAccent.indexInSegment) !== null && _a !== void 0 ? _a : _this.syllables.length;
            var nextSyllables = _this.syllables.slice((accent.indexInSegment || 0) + 1, nextAccentIndex);
            var bold = [accent];
            if (hasMultipleSyllables && nextSyllables.length > 1) {
                // splice the next syllables but one into bold; nextSyllables now contains only one.
                bold.push.apply(bold, nextSyllables.splice(0, nextSyllables.length - 1));
            }
            workingString = applyStyleToSyllables('bold', bold, result);
            if (nextAccent) {
                workingString.text += nextSyllables.join("");
                nextSyllableIndex = nextAccentIndex;
            }
            else {
                nextSyllableIndex += bold.length;
            }
        });
        var nextSyllables = this.syllables.slice(nextSyllableIndex);
        workingString.text += nextSyllables.join(syllableSeparator);
        workingString.text = workingString.text.replace(/\s+$/, "");
        if (workingString.text)
            result.push(workingString);
        return result;
    };
    /**
     * returns GABC for this verse segment
     * @param psalmTone definition for the psalm tone GABC
     * @param useIntonation false to ignore intonation, or array to override
     * @param useFlex
     * @param stripFlexMediantSymbols
     * @param useLargeInitial
     * @param minSylsOnRecitingTone non-negative number, or -1 to require 0 syllables if the intonation ends on the reciting tone, and 1 otherwise
     * @param language
     * @param observePause observe pauses in the text that occur on the reciting tone
     * @returns GABC string
     */
    VerseSegment.prototype.withGabc = function (psalmTone, useIntonation, useFlex, stripFlexMediantSymbols, useLargeInitial, minSylsOnRecitingTone, language, observePause) {
        var _a;
        var _this = this;
        var _b;
        if (useIntonation === void 0) { useIntonation = true; }
        if (useFlex === void 0) { useFlex = false; }
        if (stripFlexMediantSymbols === void 0) { stripFlexMediantSymbols = true; }
        if (useLargeInitial === void 0) { useLargeInitial = false; }
        if (minSylsOnRecitingTone === void 0) { minSylsOnRecitingTone = 2; }
        if (language === void 0) { language = "en"; }
        if (observePause === void 0) { observePause = false; }
        if (this.syllables.length === 0) {
            return "";
        }
        var syllables = this.syllables.slice(), _c = psalmTone.gabc, intonation = _c.intonation, preparatory = _c.preparatory, accents = _c.accents, afterLastAccent = _c.afterLastAccent, tenor = _c.tenor, flex = _c.flex, result = "";
        if (useLargeInitial && !syllables[0].preText) {
            syllables = syllables.slice();
            var firstSyllable = syllables[0];
            firstSyllable = syllables[0] = new VerseSyllable(firstSyllable.text, firstSyllable.firstOfWord, firstSyllable.lastOfWord, firstSyllable.preText, firstSyllable.postText, firstSyllable.word);
            if (firstSyllable.lastOfWord && firstSyllable.text.length === 3) {
                firstSyllable.text = firstSyllable.text.toUpperCase();
            }
            else {
                firstSyllable.text =
                    firstSyllable.text.slice(0, 2).toUpperCase() +
                        firstSyllable.text.slice(2).toLowerCase();
            }
        }
        if (useFlex) {
            (_a = psalmTone.getFlexTone(language), afterLastAccent = _a.afterLastAccent, preparatory = _a.preparatory, accents = _a.accents);
        }
        var firstInterestingAccent = this.accentedSyllables[accents.length - 1], indexOfFirstInterestingAccent = firstInterestingAccent
            ? firstInterestingAccent.indexInSegment || 0
            : syllables.length, indexOfFirstPreparatory = indexOfFirstInterestingAccent - preparatory.length;
        if (indexOfFirstPreparatory < 0) {
            // there are not enough syllables to cover all the preparatory tones,
            // so we cut off any unneeded tones from the beginning of the array:
            preparatory = preparatory.slice(-indexOfFirstPreparatory);
            indexOfFirstPreparatory = 0;
        }
        var syllablesBeforePreparatory = syllables.slice(0, indexOfFirstPreparatory), preparatorySyllables = syllables.slice(indexOfFirstPreparatory, indexOfFirstPreparatory + preparatory.length), accentedSyllableAndAfter = syllables.slice(indexOfFirstPreparatory + preparatory.length);
        var intonationForkIndex;
        if (useIntonation) {
            if (minSylsOnRecitingTone === -1) {
                minSylsOnRecitingTone = intonation[intonation.length - 1].gabc.endsWith(tenor) ? 0 : 1;
            }
            if (typeof useIntonation !== 'boolean') {
                intonation = useIntonation;
            }
            intonationForkIndex = intonation.findIndex(function (tone) { return tone.toneAccentFork; });
            var syllablesOnRecitingTone = syllablesBeforePreparatory.length - intonation.length + (intonationForkIndex >= 0 ? 1 : 0);
            if (useFlex &&
                afterLastAccent.length === 0 &&
                accents.length === 1 &&
                accents[0].length === 1 &&
                accents[0][0].toneAccentFork &&
                accents[0][0].toneAccentFork[0][0].gabc === tenor) {
                ++syllablesOnRecitingTone;
            }
            if (syllablesOnRecitingTone < minSylsOnRecitingTone) {
                useIntonation = false;
            }
        }
        // prepare GABC of intonation (if any)
        if (!useIntonation)
            intonation = [];
        if (intonation.length) {
            if (intonationForkIndex >= 0) {
                var fork = intonation[intonationForkIndex].toneAccentFork;
                // in the intonation, a tone accent fork means that we need to consider where accents occur in the intonation syllables
                var syllablesRequiredFollowingAccent = intonation.length - (intonationForkIndex + 2) + minSylsOnRecitingTone; // Plus Two for the fork itself and the accent following
                var syllablesToSearchForAccent = syllablesBeforePreparatory.slice(1, Math.min(syllablesBeforePreparatory.length -
                    syllablesRequiredFollowingAccent, 1 + intonationForkIndex + fork.length));
                var lastUsableAccent = syllablesToSearchForAccent
                    .reverse()
                    .findIndex(function (syllable) {
                    return syllable.isAccented ||
                        (syllable.firstOfWord && syllable.lastOfWord);
                });
                var accentIndex = lastUsableAccent === -1 ? -1 : syllablesToSearchForAccent.length - 1 - lastUsableAccent;
                intonation = __spreadArrays(intonation.slice(0, intonationForkIndex), ((_b = fork[accentIndex]) !== null && _b !== void 0 ? _b : []), intonation.slice(intonationForkIndex + 1));
            }
            for (var i = 0; i < intonation.length; ++i) {
                var syl = syllablesBeforePreparatory.shift();
                if (syl)
                    result += syl.withGabc(intonation[i].gabc);
            }
        }
        // handle all syllables on the reciting tone
        syllablesBeforePreparatory.forEach(function (syl) { return (result += syl.withGabc(tenor || "", observePause)); });
        // handle preparatory syllables
        preparatorySyllables.forEach(function (syl, i) { return (result += syl.withGabc(preparatory[i].gabc)); });
        // handle the final accents:
        var sylI = 0;
        accents.forEach(function (accentTones, accentI) {
            var nextAccent = _this.accentedSyllables[accents.length - 2 - accentI], endSylI = nextAccent
                ? (nextAccent.indexInSegment || 0) -
                    (accentedSyllableAndAfter[0].indexInSegment || 0)
                : Math.max(1, accentedSyllableAndAfter.length - afterLastAccent.length);
            // endSylI points to the next accent or to the first syllable applicable to afterLastAccent
            var useNonAccentNonOpen = false;
            if (accentTones.length === 1 && accentTones[0].toneAccentFork) {
                // toneAccentFork contains [accent on last syllable, accent on penult, accent on antepenult or earlier]:
                var accentForkIndex = Math.min(2, endSylI - 1);
                accentTones = accentTones[0].toneAccentFork[accentForkIndex];
                useNonAccentNonOpen = true;
            }
            accentTones.forEach(function (accentTone, i) {
                if (sylI >= endSylI)
                    return;
                var syl = accentedSyllableAndAfter[sylI];
                if (accentTone.accent || (!accentTone.open && i === accentTones.length - 1)) {
                    // we're looking for an accented syllable
                    if (syl.isAccented ||
                        (sylI + 1 === endSylI && i === accentTones.length - 1)) {
                        // Use this syllable if it's accented or if we need to use something
                        result += syl.withGabc(accentTone.gabc);
                        ++sylI;
                    }
                    else {
                        console.warn("Invalid state when applying psalm tone");
                    }
                }
                else if (accentTone.open) {
                    // take all syllables until the next accent:
                    var accentTonesRemaining = accentTones.length - 1 - i;
                    while (sylI < endSylI - accentTonesRemaining) {
                        result += syl.withGabc(accentTone.gabc);
                        syl = accentedSyllableAndAfter[++sylI];
                    }
                }
                else if (useNonAccentNonOpen) {
                    // this is a forked accent tone, so we have already chosen the right one based on the number of syllables present;
                    // just use the tone and the syllable.
                    result += syl.withGabc(accentTone.gabc);
                    ++sylI;
                }
            });
        });
        var remainingSyllables = accentedSyllableAndAfter.slice(sylI);
        if (remainingSyllables.length === afterLastAccent.length) {
            remainingSyllables.forEach(function (syl, i) { return (result += syl.withGabc(afterLastAccent[i].gabc)); });
        }
        else if (this.accentedSyllables.length &&
            (remainingSyllables.length || afterLastAccent.length > 1)) {
            // only bother warning if there are actually marked accents in the text
            // and there are remaining syllables, or more than one syllable after the accent in the psalm tone
            console.warn("Invalid state when applying psalm tone...incorrect number of syllables remaining");
        }
        if (stripFlexMediantSymbols)
            result = result.replace(/\s+[*†]/g, "");
        return result;
    };
    VerseSegment.prototype.toString = function () {
        return this.words.join(" ");
    };
    VerseSegment.splitIntoWords = function (text, syllabify, language) {
        if (syllabify === void 0) { syllabify = VerseText.defaultSyllabify; }
        if (language === void 0) { language = 'en'; }
        var accentUtils = {
            'en': {},
            'la': { findWordAccent: findLatinWordAccent, findPhraseAccents: findLatinPhraseAccents },
            'es': { findWordAccent: findSpanishWordAccent, findPhraseAccents: findSpanishPhraseAccents },
        };
        var _a = accentUtils[language], findWordAccent = _a.findWordAccent, findPhraseAccents = _a.findPhraseAccents;
        var wordSplit = text
            .trim()
            .split(/([ ,;:.!?"'’”»\]\)—–-]*)(?:$|\s+(\+\s+)?|^)(?:\[?((?:\d+:\s*)?\d+(?:[a-l]\b)?)\.?\]?\s*)?([\(\[«“‘'"¿¡—–-]*)/);
        // the text is now split into an array composed of text that didn't match
        // the regex, followed by the first group of the regex, the second, third, and fourth
        // group, and repeating.  We add two empty strings to the beginning and end
        // of this array so that the array has a number of elements that is divisible by 5
        // and is of the form [number,pre,word,post,pause, number,pre,word,post,pause,...]
        wordSplit.unshift("", "");
        wordSplit.push("", "");
        var words = [], lastWord, preWord;
        for (var i = 0; i + 2 < wordSplit.length; i += 5) {
            var _b = wordSplit.slice(i, i + 5), verseNumber = _b[0], pre = _b[1], text_2 = _b[2], post = _b[3], pause = _b[4];
            if (!text_2) {
                if (!(pre || post)) {
                    continue;
                }
                console.warn("no word found around " + (i + 1) + " when splitting string " + JSON.stringify(wordSplit) + " into words");
            }
            var verseWord = new VerseWord({
                text: text_2,
                pre: pre,
                post: post,
                pause: !!pause,
                syllabify: syllabify,
                findAccents: findWordAccent,
                verseNumber: verseNumber
            });
            if (verseWord.isActualWord) {
                if (preWord) {
                    verseWord.addPrePunctuation(preWord.syllables.join("").trim());
                    preWord = null;
                }
                words.push(verseWord);
                lastWord = verseWord;
            }
            else if (lastWord) {
                lastWord.addPunctuation(verseWord.syllables.join("").trim());
            }
            else {
                preWord = verseWord;
            }
        }
        findPhraseAccents === null || findPhraseAccents === void 0 ? void 0 : findPhraseAccents(words);
        return words;
    };
    return VerseSegment;
}());
var VerseWord = /** @class */ (function () {
    function VerseWord(_a) {
        var _this = this;
        var text = _a.text, pre = _a.pre, post = _a.post, pause = _a.pause, _b = _a.syllabify, syllabify = _b === void 0 ? VerseText.defaultSyllabify : _b, findAccents = _a.findAccents, verseNumber = _a.verseNumber;
        if (verseNumber)
            this.verseNumber = verseNumber;
        this.isActualWord = /[a-z]/i.test(text);
        this.prePunctuation = this.punctuation = "";
        this.pause = !!pause;
        this.syllables = syllabify(text).map(function (syl, i, syllabified) {
            return new VerseSyllable(syl, i === 0, i === syllabified.length - 1, pre, post, _this);
        });
        findAccents === null || findAccents === void 0 ? void 0 : findAccents(this.syllables);
    }
    /**
     * adds punctuation that comes after the word, but is separated by a space
     * @param {string} punctuation punctuation to add following the word
     */
    VerseWord.prototype.addPunctuation = function (punctuation) {
        this.syllables[this.syllables.length - 1].postText += "\xA0" + punctuation;
    };
    /**
     * adds punctuation that comes before the word, but is separated by a space
     * @param {string} prePunctuation punctuation to add before the word
     */
    VerseWord.prototype.addPrePunctuation = function (prePunctuation) {
        this.syllables[0].preText =
            prePunctuation + "\xA0" + this.syllables[0].preText;
    };
    VerseWord.prototype.toString = function () {
        return this.syllables.join("+");
    };
    return VerseWord;
}());
var VerseSyllable = /** @class */ (function () {
    function VerseSyllable(sylText, firstOfWord, lastOfWord, pre, post, word) {
        this.text = sylText;
        this.word = word;
        this.firstOfWord = firstOfWord;
        this.lastOfWord = lastOfWord;
        this.isAccented = /[áéíóúýǽ́]/i.test(sylText);
        if (/^\|[^|]+\|$/.test(sylText)) {
            this.text = sylText.slice(1, -1);
            this.isAccented = true;
        }
        this.preText = (firstOfWord && pre) || "";
        this.postText = (lastOfWord && post) || "";
        this.pause = lastOfWord && word.pause;
    }
    VerseSyllable.prototype.toString = function () {
        return (this.preText + this.text + this.postText + (this.lastOfWord ? " " : ""));
    };
    VerseSyllable.prototype.withoutPreText = function () {
        return this.text + this.postText + (this.lastOfWord ? " " : "");
    };
    VerseSyllable.prototype.withoutPostText = function () {
        return this.preText + this.text;
    };
    VerseSyllable.prototype.getPreText = function () {
        return this.preText;
    };
    VerseSyllable.prototype.getPostText = function () {
        return this.postText + (this.lastOfWord ? " " : "");
    };
    VerseSyllable.prototype.withGabc = function (gabc, observePause) {
        if (observePause === void 0) { observePause = false; }
        if (this.pause && observePause) {
            gabc += ".) (,";
        }
        return (this.preText +
            this.text +
            this.postText +
            ("(" + gabc + ")") +
            (this.lastOfWord ? "\n" : ""));
    };
    return VerseSyllable;
}());

/**
 * shift all notes in GABC by shift (upward if positive, downward if negative)
 * @param gabc string of GABC (without parentheses)
 * @param shift amount to shift
 */
function shiftGabc(gabc, shift) {
    return gabc.replace(/([cf]b?[1-4])|([a-m])/gi, function (match, clef, c) {
        if (clef)
            return clef;
        var newC = String.fromCharCode(c.charCodeAt(0) + shift);
        if (!/[a-m]/i.test(newC))
            throw "cannot be shifted that much";
        return newC;
    });
}

var GabcPsalmTone = /** @class */ (function () {
    function GabcPsalmTone(gabc, prefix, flexEqualsTenor, clef) {
        if (prefix === void 0) { prefix = ""; }
        if (flexEqualsTenor === void 0) { flexEqualsTenor = false; }
        if (clef === void 0) { clef = "c4"; }
        if (prefix)
            gabc = prefix + gabc;
        var tones = (this.tones = GabcPsalmTone.getTonesForGabcString(gabc));
        var intonation = [];
        var accentedTones = [];
        var currentAccentTone;
        var preparatory = [];
        var afterLastAccent = [];
        var state = 3;
        var lastOpen = undefined;
        var toneTenor;
        var toneFlex;
        for (var i = tones.length - 1; i >= 0; --i) {
            var ton = tones[i];
            if (ton.accent) {
                if (intonation.length > 0) {
                    // if we already have an intonation, then we need to add to it to that, and not to accentedTones
                    intonation.unshift(ton);
                    continue;
                }
                currentAccentTone = [ton];
                accentedTones.unshift(currentAccentTone);
                state = 1;
                if (lastOpen) {
                    currentAccentTone.push(lastOpen);
                    if (preparatory.length) {
                        currentAccentTone.push.apply(currentAccentTone, preparatory);
                    }
                    lastOpen = undefined;
                }
                else if (tones[i - 1].open) {
                    currentAccentTone.unshift(tones[i - 1]);
                    --i;
                }
                preparatory = [];
            }
            else if (ton.open) {
                toneTenor = ton.gabc[0];
                if (state == 3) {
                    // initial state: no accents have been found yet
                    if (accentedTones.length == 0 && (i == 0 || !tones[i - 1].accent)) {
                        // if we got all the way to the beginning or the intonation, what we
                        // had considered to be after the last accent should really be
                        // interpreted as preparatory syllables
                        preparatory = afterLastAccent;
                        afterLastAccent = [];
                    }
                    state = 1;
                }
                lastOpen = ton;
            }
            else if (state == 3) {
                // initial state: no accents or puncta cava have been found yet
                afterLastAccent.unshift(ton);
            }
            else if (state == 1) {
                // state 1 means there has already been found an accent or punctum cavum
                if (!lastOpen) {
                    // the following tone to this one is an accent, so this must be a
                    // preparatory syllable:
                    preparatory.unshift(ton);
                }
                else {
                    // the following tone to this one is a cavum, so this is probably an
                    // intonation syllable, but we won't consider it as such if has the
                    // same GABC code as the the tenor (or if we have already gotten the
                    // last syllable of the intonation)
                    if (intonation.length > 0 || ton.gabc != lastOpen.gabc)
                        intonation.unshift(ton);
                    continue;
                }
                lastOpen = undefined;
            }
        }
        if (toneTenor) {
            if (flexEqualsTenor) {
                toneFlex = toneTenor;
            }
            else {
                // calculate flex tone based on it being a full tone below the tenor,
                // unless this would only be a semitone in the psalm tone's clef
                var clefI = clef[0] == "f" ? 6 : 1;
                clefI += +parseInt(clef.slice(-1)) * 2;
                var toneNumber = (parseInt(toneTenor, 36) - 10 + 16 - clefI) % 8;
                var code = toneTenor.charCodeAt(0);
                code -= toneNumber == 0 || toneNumber == 3 ? 2 : 1;
                toneFlex = String.fromCharCode(code);
            }
        }
        this.clef = clef;
        this.gabc = {
            tenor: toneTenor,
            flex: toneFlex,
            intonation: intonation,
            preparatory: preparatory,
            afterLastAccent: afterLastAccent,
            accents: accentedTones
        };
        this.syllableCounts = {
            intonation: intonation.length,
            accents: accentedTones.length,
            preparatory: preparatory.length,
            afterLastAccent: afterLastAccent.length,
            accentHasMultipleSyllables: accentedTones.map(function (tones) { var _a; return (_a = tones === null || tones === void 0 ? void 0 : tones[0]) === null || _a === void 0 ? void 0 : _a.open; }),
        };
    }
    GabcPsalmTone.prototype.getFlexTone = function (language) {
        var _a = this.gabc, tenor = _a.tenor, flex = _a.flex;
        var tenorFlexDrop = parseInt(tenor, 23) - parseInt(flex, 23);
        var preparatory = [];
        var afterLastAccent, accents;
        if (language === "la") {
            afterLastAccent = [{ gabc: flex ? flex + "." : "" }];
            accents = [
                [
                    { accent: true, gabc: tenor || "" },
                    { open: true, gabc: flex || "" }
                ]
            ];
        }
        else {
            afterLastAccent = [];
            accents = [
                [
                    {
                        gabc: "",
                        accent: true,
                        toneAccentFork: [
                            [{ gabc: tenorFlexDrop === 1 ? flex : tenor }],
                            [{ gabc: tenor }, { gabc: flex }],
                            [{ gabc: tenor }, { gabc: flex, open: true }]
                        ]
                    }
                ]
            ];
        }
        return __assign(__assign({}, this.gabc), { preparatory: preparatory, accents: accents, afterLastAccent: afterLastAccent });
    };
    /**
     * Takes gabc like `(jr//////////k//j)(:)(jr////////h///i//g)(::)` or
     *                 `jr k j : jr h i g ::
     * and
     * @param  {string} gabc GABC code for psalm tone
     * @param  {string} clef GABC clef code
     * @param  {object} options special options as a hash of booleans:
     * treatAsOneAccentWithXPreparatory:
     * @return {{mediant: GabcPsalmTone, termination: GabcPsalmTone}}      object hash with mediant and termination
     */
    GabcPsalmTone.getFromGabc = function (gabc, options, clef) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        if (!/\|/.test(gabc)) {
            gabc = gabc.replace(/[()]+/g, " ");
        }
        var useFlex = options.useFlex, isGregorianSolemn = options.isGregorianSolemn;
        if (/(^|\n)%\s*flex\s*\n/.test(gabc)) {
            useFlex = true;
        }
        if (/(^|\n)%\s*gregorianSolemn\s*\n/.test(gabc)) {
            isGregorianSolemn = true;
        }
        gabc = gabc.replace(/(^|\n)(%[^\n]*\n)+/g, "$1");
        var originalGabc = gabc;
        var clefMatch = /^[^a-m]*((?:cb?|f)[1-4])/.exec(gabc);
        if (clefMatch) {
            var detectedClef = clefMatch[1];
            if (clef && clef[0] === detectedClef[0]) {
                var detectedClefPosition = parseInt(detectedClef.slice(-1)), desiredClefPosition = parseInt(clef.slice(-1)), shift = 2 * (desiredClefPosition - detectedClefPosition);
                // shift the psalm tone
                try {
                    gabc = shiftGabc(gabc, shift);
                }
                catch (exception) {
                    clef = detectedClef;
                }
                if (clef.length !== detectedClef.length) {
                    var newClefHasAccidental = clef.length === 3;
                    // find pitch of accidental based on clef position:
                    var accid = String.fromCharCode(desiredClefPosition * 2 + "a".charCodeAt(0));
                    // can't make a reciting tone to have an accidental, so if that's the case,
                    // just shift the detected clef, without adding or removing the accidental
                    if (new RegExp(accid + "r").test(gabc)) {
                        clef = detectedClef.slice(0, -1) + clef.slice(-1);
                    }
                    else if (newClefHasAccidental) {
                        // remove accidentals from the psalm tone, and add naturals to any pitches that weren't marked with a flat
                        gabc = gabc.replace(new RegExp("([^xy])" + accid + "([^xy]|$)", "g"), "$1" + accid + "y" + accid + "$2");
                        gabc = gabc.replace(new RegExp(accid + "x" + accid, "g"), accid);
                    }
                    else {
                        // add accidentals to the psalm tone, since they are no longer in the clef:
                        gabc = gabc.replace(new RegExp("([^xy])" + accid + "([^xy]|$)", "g"), "$1" + accid + "x" + accid);
                        gabc = gabc.replace(new RegExp(accid + "y" + accid, "g"), accid);
                    }
                }
            }
            else {
                clef = detectedClef;
            }
            gabc = gabc.slice(clefMatch.index + clefMatch[0].length);
        }
        else if (!clef) {
            clef = "c4";
        }
        originalGabc = (clef + " " + gabc.trim())
            .replace(/\(([^|)]+)[^)]*\)/g, "$1") // remove all but the first option from parenthetic option groups, e.g. (option 1|option 2|option 3)
            .replace(/\s+([a-m][xy][a-mA-M])/, "/$1"); // use a single / instead of whitespace before accidentals
        if (/'/.test(gabc)) {
            options.treatAsOneAccentWithXPreparatory = false;
        }
        if (!options.treatAsOneAccentWithXPreparatory) {
            // convert psalm tone GABC notation to something with visible accent marks and reciting tone marked
            originalGabc = originalGabc
                .replace(/((?:^|\n|:)[^\n:r]*?[a-m]r)([\s/])/g, "$10$2") // convert initial punctum cavum to reciting tone
                .replace(/(\s[^'\s]+[\s/]+)((?:[a-m][xy])?[a-m]r)([\s/]+)'([^ /]+)/g, "$1$2[ocba:1{]$3$4[ocba:0}]") // add bracketed accents
                .replace(/'((?:[a-m][xy])?[a-m])/g, "$1r1") // replace accented puncta with proper code to display accents
                .replace(/r0\s+/g, 'r0////////') // add extra space after reciting tone
                .replace(/r\s+((?:[^r\s,;:]*\s+)*)((?:[a-m][xy])?[a-m]r1)/g, 'r//////$1$2'); // add extra space between puncta cava and accented tones
        }
        gabc = gabc.replace(/\/{2,}/g, " ").replace(/::\s*$/, "");
        var gabcSegments = gabc.split(/\s+:+\s+/);
        var gabcPsalmTones = gabcSegments.map(function (gabc) {
            gabc = gabc.trim();
            if (options.treatAsOneAccentWithXPreparatory && !/'/.test(gabc)) {
                var match = gabc.match(/\s(([^\sr',;:()])+)$/);
                if (match) {
                    // jr h i g => jr h i 'g gr g
                    gabc =
                        gabc.slice(0, match.index) +
                            " '" +
                            match[1] +
                            " " +
                            match[2].toLowerCase() +
                            "r " +
                            match[2].toLowerCase();
                }
            }
            gabc = gabc.replace(/\s'?\(([^r|)]+\|[^r]*)\s([^\sr',;:()])\)$/, " '($1 $2r $2)");
            return new GabcPsalmTone(gabc, "", !useFlex, clef);
        });
        var isMeinrad = !!options.isMeinrad || gabcPsalmTones.length === 2 + 3 + 4 + 5 + 6;
        var result = (_a = {},
            _a[exports.VerseSegmentType.Mediant] = gabcPsalmTones[0],
            _a[exports.VerseSegmentType.Termination] = gabcPsalmTones[1],
            _a.isMeinrad = isMeinrad,
            _a.isGregorianSolemn = isGregorianSolemn,
            _a.originalGabc = originalGabc,
            _a.clef = clef,
            _a);
        if (isMeinrad) {
            if (gabcPsalmTones.length != 2 + 3 + 4 + 5 + 6) {
                console.warn("Incorrect number of psalm tone lines given for Meinrad type psalm tone.  Expected 20, but received " + gabcPsalmTones.length);
            }
            var lines = [];
            for (var i = 0, count = 2; i < gabcPsalmTones.length; i += count++) {
                lines[count] = gabcPsalmTones.slice(i, i + count);
            }
            result.lines = lines;
        }
        else {
            var lines = (result.lines = []);
            for (var i = 0; i < gabcPsalmTones.length; i += 2) {
                var psalmTones = (_b = {},
                    _b[exports.VerseSegmentType.Mediant] = gabcPsalmTones[i],
                    _b[exports.VerseSegmentType.Termination] = gabcPsalmTones[i + 1],
                    _b.isMeinrad = false,
                    _b.clef = clef,
                    _b);
                lines.push(psalmTones);
            }
        }
        return result;
    };
    GabcPsalmTone.getTonesForGabcString = function (gabc) {
        var match;
        var regexToneGabc = /(')?(?:\(([^)]+)\)|([^\sr]+)(r)?)(?=$|\s)/gi;
        var tones = [];
        while ((match = regexToneGabc.exec(gabc))) {
            var result = {
                accent: match[1] == "'",
                gabc: match[3],
                open: match[4] == "r"
            };
            if (match[2]) {
                result.toneAccentFork = match[2]
                    .split("|")
                    .map(function (gabc) { return GabcPsalmTone.getTonesForGabcString(gabc); });
            }
            tones.push(result);
        }
        return tones;
    };
    return GabcPsalmTone;
}());

var regexClef = /\([^)]*([cf]b?[1-4])/g;
var splitGabcByTitle = function (gabc) {
    var gabcAndHeaders = gabc.split(/\s*<h2>([\s\S]*?)<\/h2>\s*/);
    // even indices are GABC; odd indices are <h2> tags.
    gabc = gabcAndHeaders[0];
    var result = [{ gabc: gabc }];
    var _a = getLastClef(gabc), clef = _a.clef, isOnlyClef = _a.isOnlyClef;
    if (isOnlyClef) {
        result.pop();
    }
    for (var i = 1; i < gabcAndHeaders.length; i += 2) {
        var subtitle = gabcAndHeaders[i];
        var gabc_1 = "(" + clef + ")" + gabcAndHeaders[i + 1];
        (clef = getLastClef(gabc_1).clef);
        result.push({ gabc: gabc_1, subtitle: subtitle });
    }
    return result;
};
function getLastClef(gabc) {
    var matches = gabc.match(regexClef);
    if (matches) {
        var gabcWithoutWhitespace = gabc.replace(/\s+/g, "");
        var lastMatch = matches.pop();
        regexClef.exec("");
        var clef = regexClef.exec(lastMatch)[1];
        return {
            clef: clef,
            isOnlyClef: gabcWithoutWhitespace === "(" + clef + ")",
        };
    }
    return {
        isOnlyClef: false,
    };
}

exports.GabcPsalmTone = GabcPsalmTone;
exports.GabcSyllabified = GabcSyllabified;
exports.VerseSegment = VerseSegment;
exports.VerseText = VerseText;
exports.splitGabcByTitle = splitGabcByTitle;
//# sourceMappingURL=index.js.map
