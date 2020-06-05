Object.defineProperty(exports, '__esModule', { value: true });

var GabcSyllabified = /** @class */ (function () {
    function GabcSyllabified() {
    }
    GabcSyllabified.merge = function (syllabifiedText, musicalNotation, useLargeInitial) {
        var _a = GabcSyllabified.normalizeInputs(syllabifiedText, musicalNotation), text = _a.text, notation = _a.notation;
        if (!notation)
            return text;
        var _b = GabcSyllabified.splitInputs(text, notation), syllables = _b.syllables, notationNodes = _b.notationNodes;
        var sylNdx = 0;
        var isFirstSyl = true;
        var result = notationNodes
            .map(function (notation) {
            var _a = GabcSyllabified.mapSyllable(notation, syllables, sylNdx, isFirstSyl), syllable = _a.syllable, nextIndex = _a.nextIndex, isFirstSyllable = _a.isFirstSyllable;
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
    GabcSyllabified.normalizeInputs = function (text, notation) {
        // normalize the text, getting rid of multiple consecutive whitespace,
        // and handling lilypond's \forceHyphen directive
        // remove flex and mediant symbols if accents are marked with pipes:
        if (/\|/.test(text)) {
            text = text.replace(/[†*]/g, "");
        }
        text = text.replace(/%[^\n]*(\n|$)/g, '$1')
            .replace(/\s*\n\s*/g, '\n')
            .replace(/(\s)\s+/g, '$1')
            .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, '$1-')
            .replace(/\|([^|]+)\|/g, '+$1+')
            .replace(/([ -])\+|\+(\W*(?:[-\s]|$))/g, '$1$2')
            .trim();
        notation = notation.replace(/%[^\n]*(\n|$)/g, '$1').trim();
        return { text: text, notation: notation };
    };
    GabcSyllabified.splitInputs = function (text, notation) {
        var syllables = text
            .split(/\s+--\s+|\+|(\s*\(?"[^"]+"\)?-?)|(\s*[^\s-+]+-)(?=[^\s-])|(?=\s)/)
            .filter(function (syl) { return syl && syl.trim(); });
        var notationNodes = notation.split(/\s+/);
        return { syllables: syllables, notationNodes: notationNodes };
    };
    /*-----  STRING UTIL FUNCTIONS  -----*/
    GabcSyllabified.stripParens = function (s) {
        return s.replace(GabcSyllabified.regexFindParensWithLeadSpaces, '$1$2');
    };
    /*-----  GETTER FUNCTIONS  -----*/
    GabcSyllabified.getSyllable = function (syllables, index) {
        return (syllables[index] || ' ').replace(/^(\s*)"(.*)"$/, '$1$2');
    };
    GabcSyllabified.getNonSyllable = function (syllables, syllableNdx, notation) {
        var syllable = syllables[syllableNdx];
        if (/^(\s*!|[^a-záéíóúýàèìòùäëïöüÿæœǽœ́]+$|\s*\(.*\)$|\s*"\(.*\)"$)/i.test(syllable)
            && !GabcSyllabified.regexClef.test(notation)) {
            return syllable.replace(/^(\s*)!/, '$1')
                .replace(/^(\s*)"?\((.*?)\)"?$/, '$1$2');
        }
        return ' ';
    };
    /*-----  PROCESSOR FUNCTIONS  -----*/
    GabcSyllabified.mapSyllable = function (notation, syllables, sylNdx, isFirstSyllable) {
        var noSyllable = GabcSyllabified.regexNonSyllabicGabc.test(notation) || /^\(.*\)$/.test(notation);
        notation = GabcSyllabified.stripParens(notation);
        var syllable = noSyllable ? GabcSyllabified.getNonSyllable(syllables, sylNdx, notation) : GabcSyllabified.getSyllable(syllables, sylNdx++);
        if (!noSyllable) {
            var nextSyllable = syllable;
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
        return { syllable: syllable, nextIndex: sylNdx, isFirstSyllable: isFirstSyllable };
    };
    GabcSyllabified.capitalizeInitial = function (syllable, nextSyllable) {
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
    };
    /*-----  REGEX DEFS  -----*/
    GabcSyllabified.regexClef = /^[cf]b?[1-4]$/;
    GabcSyllabified.regexNonSyllabicGabc = /^([cf]b?[1-4]|[,;:`]+|[a-m]\+|[zZ]0?)+$/;
    GabcSyllabified.regexFindParensWithLeadSpaces = /^(\s*)\((.*)\)$/;
    GabcSyllabified.regexFindParens = /^\((.*)\)$/;
    return GabcSyllabified;
}());

(function (VerseSegmentType) {
    VerseSegmentType["Flex"] = "flex";
    VerseSegmentType["Mediant"] = "mediant";
    VerseSegmentType["Termination"] = "termination";
})(exports.VerseSegmentType || (exports.VerseSegmentType = {}));
var defaultSyllabifier = function (text) {
    return text
        .replace(/\\forceHyphen\s+(\S+)\s+--\s+/g, "$1-")
        .replace(/\s+--\s+/g, "+")
        .replace(/(\|\S+\|)(\S)/gi, "$1+$2")
        .replace(/(\S)(\|\S+\|)/gi, "$1+$2")
        .replace(/(\S-)(\S)/gi, "$1+$2")
        .split(/\+/g);
};
var VerseText = /** @class */ (function () {
    /**
     *
     * @param text the text to be split into segments
     * @param syllabifier a function that takes a word string and returns an array of its syllables
     */
    function VerseText(text, syllabifier) {
        if (syllabifier === void 0) { syllabifier = defaultSyllabifier; }
        this.segments = VerseText.splitIntoSegments(text, syllabifier);
    }
    /**
     * Returns a verse with GABC
     * @param  {Object} psalmTone hash of GabcPsalmTones for flex, mediant, and termination
     * @return {string}           GABC string
     */
    VerseText.prototype.withGabc = function (psalmTone, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.startVersesOnNewLine, startVersesOnNewLine = _c === void 0 ? true : _c, _d = _b.stripFlexMediantSymbols, stripFlexMediantSymbols = _d === void 0 ? true : _d, _e = _b.addSequentialVerseNumbersStartingAt, addSequentialVerseNumbersStartingAt = _e === void 0 ? 1 : _e;
        var nextSequentialVerseNumber = addSequentialVerseNumbersStartingAt;
        if (nextSequentialVerseNumber <= 0)
            nextSequentialVerseNumber = 0;
        var getNextVerseNumberString = function () {
            return nextSequentialVerseNumber ? nextSequentialVerseNumber++ + ". " : "";
        };
        return ("(" + psalmTone.clef + ") " +
            this.segments
                .map(function (seg, i, segments) {
                var useFlex = seg.segmentType === exports.VerseSegmentType.Flex, segmentName = useFlex ? exports.VerseSegmentType.Mediant : seg.segmentType, tone = psalmTone[segmentName];
                var gabc = seg.withGabc(tone, i == 0 || i == _this.segments.length - 1, // use intonation on first and last segment
                useFlex, stripFlexMediantSymbols);
                if (i === 0 || segments[i - 1].segmentType === exports.VerseSegmentType.Termination)
                    gabc = getNextVerseNumberString() + gabc;
                switch (seg.segmentType) {
                    case exports.VerseSegmentType.Flex:
                        return gabc + " (,)";
                    case exports.VerseSegmentType.Mediant:
                        return gabc + " (:)";
                    case exports.VerseSegmentType.Termination:
                        return gabc + (" (::" + (startVersesOnNewLine ? "Z" : "") + ")");
                }
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
     * @param  {function} syllabifier a function that takes a string containing a single word, and returns an array of strings of the individual syllables.
     * @return {VerseSegment[]}       the array of VerseSegment objects
     */
    VerseText.splitIntoSegments = function (text, syllabifier) {
        if (syllabifier === void 0) { syllabifier = defaultSyllabifier; }
        var segmentSplit = text.split(/[ \t]*([†*\n/])(\s*)/), segments = [];
        for (var i = 0; i < segmentSplit.length; i += 3) {
            var text_1 = segmentSplit[i];
            if (segmentSplit[i + 1]) {
                text_1 += " " + segmentSplit[i + 1];
            }
            segments.push(new VerseSegment(text_1, syllabifier, SegmentTypeDictionary[segmentSplit[i + 1]], segmentSplit[i + 2]));
        }
        return segments;
    };
    return VerseText;
}());
var SegmentTypeDictionary = {
    "†": exports.VerseSegmentType.Flex,
    "*": exports.VerseSegmentType.Mediant,
    "\n": exports.VerseSegmentType.Termination
};
var VerseSegment = /** @class */ (function () {
    function VerseSegment(text, syllabifier, type, additionalWhitespace) {
        if (syllabifier === void 0) { syllabifier = defaultSyllabifier; }
        if (type === void 0) { type = exports.VerseSegmentType.Termination; }
        this.words = VerseSegment.splitIntoWords(text, syllabifier);
        this.syllables = [].concat.apply([], this.words.map(function (word) { return word.syllables; }));
        this.segmentType = type;
        // mark syllable indices:
        this.syllables.forEach(function (syl, i) { return (syl.indexInSegment = i); });
        this.syllables
            .slice()
            .reverse()
            .forEach(function (syl, i) { return (syl.indexFromSegmentEnd = i); });
        // mark the last two accents as 0 and 1:
        this.accentedSyllables = this.syllables.filter(function (syl) { return syl.isAccented; }).reverse();
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
        var _b = _a === void 0 ? {} : _a, _c = _b.accents, accents = _c === void 0 ? 0 : _c, _d = _b.preparatory, preparatory = _d === void 0 ? 0 : _d, _e = _b.onlyMarkFirstPreparatory, onlyMarkFirstPreparatory = _e === void 0 ? false : _e, _f = _b.syllableSeparator, syllableSeparator = _f === void 0 ? "\xAD" : _f;
        var markedAccents = this.accentedSyllables.slice(this.accentedSyllables.length - accents);
        var firstAccentIndex = markedAccents.length
            ? markedAccents[0].indexInSegment || 0
            : this.syllables.length;
        var firstMarkedPreparatoryIndex = Math.max(0, firstAccentIndex - preparatory);
        var result = [];
        var workingString = {
            text: this.syllables.slice(0, firstMarkedPreparatoryIndex).join(syllableSeparator)
        };
        var nextSyllableIndex = firstMarkedPreparatoryIndex;
        var lastItalicIndex = onlyMarkFirstPreparatory
            ? preparatory > 0
                ? nextSyllableIndex + 1
                : nextSyllableIndex
            : firstAccentIndex;
        var italics = this.syllables.slice(nextSyllableIndex, lastItalicIndex);
        if (italics.length) {
            var lastItalic = italics[italics.length - 1];
            workingString.text += italics[0].getPreText();
            result.push(workingString);
            if (italics.length > 1) {
                workingString = {
                    style: "italic",
                    text: italics[0].withoutPreText() +
                        italics.slice(1, -1).join("") +
                        lastItalic.withoutPostText()
                };
            }
            else {
                workingString = {
                    style: "italic",
                    text: italics[0].text
                };
            }
            result.push(workingString);
            workingString = { text: lastItalic.getPostText() };
            var nonItalic = this.syllables.slice(lastItalicIndex, firstAccentIndex);
            workingString.text += nonItalic.join("");
        }
        nextSyllableIndex = firstAccentIndex;
        markedAccents.forEach(function (accent, i) {
            workingString.text += accent.getPreText();
            result.push(workingString);
            workingString = { style: "bold", text: accent.text };
            result.push(workingString);
            var nextAccent = markedAccents[i + 1];
            workingString = { text: accent.getPostText() };
            if (nextAccent) {
                var nextSyllables_1 = _this.syllables.slice((accent.indexInSegment || 0) + 1, nextAccent.indexInSegment);
                workingString.text += nextSyllables_1.join("");
                nextSyllableIndex = nextAccent.indexInSegment || 0;
            }
            else {
                ++nextSyllableIndex;
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
     * @param  {GabcPsalmTone} psalmTone definition for the psalm tone GABC
     * @return {string}           GABC string
     */
    VerseSegment.prototype.withGabc = function (psalmTone, useIntonation, useFlex, stripFlexMediantSymbols) {
        var _this = this;
        if (useIntonation === void 0) { useIntonation = true; }
        if (useFlex === void 0) { useFlex = false; }
        if (stripFlexMediantSymbols === void 0) { stripFlexMediantSymbols = true; }
        var syllables = this.syllables.slice(), _a = psalmTone.gabc, intonation = _a.intonation, preparatory = _a.preparatory, accents = _a.accents, afterLastAccent = _a.afterLastAccent, tenor = _a.tenor, flex = _a.flex, result = "";
        if (useFlex) {
            afterLastAccent = [{ gabc: flex || "" }];
            accents = [
                [
                    { accent: true, gabc: tenor || "" },
                    { open: true, gabc: flex || "" }
                ]
            ];
            preparatory = [];
        }
        var firstInterestingAccent = this.accentedSyllables[psalmTone.gabc.accents.length - 1], indexOfFirstInterestingAccent = firstInterestingAccent
            ? firstInterestingAccent.indexInSegment || 0
            : syllables.length, indexOfFirstPreparatory = indexOfFirstInterestingAccent - preparatory.length, syllablesBeforePreparatory = syllables.slice(0, indexOfFirstPreparatory), preparatorySyllables = syllables.slice(indexOfFirstPreparatory, indexOfFirstPreparatory + preparatory.length), accentedSyllableAndAfter = syllables.slice(indexOfFirstPreparatory + preparatory.length);
        // prepare GABC of intonation (if any)
        if (!useIntonation)
            intonation = [];
        if (intonation.length) {
            for (var i = 0; i < intonation.length; ++i) {
                var syl = syllablesBeforePreparatory.shift();
                if (syl)
                    result += syl.withGabc(intonation[i].gabc);
            }
        }
        // handle all syllables on the reciting tone
        syllablesBeforePreparatory.forEach(function (syl) { return (result += syl.withGabc(tenor || "")); });
        // handle preparatory syllables
        preparatorySyllables.forEach(function (syl, i) { return (result += syl.withGabc(preparatory[i].gabc)); });
        // handle the final accents:
        var sylI = 0;
        accents.forEach(function (accentTones, accentI) {
            var nextAccent = _this.accentedSyllables[accents.length - 2 - accentI], endSylI = nextAccent
                ? (nextAccent.indexInSegment || 0) - (accentedSyllableAndAfter[0].indexInSegment || 0)
                : accentedSyllableAndAfter.length - afterLastAccent.length;
            // endSylI points to the next accent or to the first syllable applicable to afterLastAccent
            accentTones.forEach(function (accentTone, i) {
                if (sylI >= endSylI)
                    return;
                var syl = accentedSyllableAndAfter[sylI];
                if (accentTone.accent) {
                    // we're looking for an accented syllable
                    if (syl.isAccented || (sylI + 1 === endSylI && i === accentTones.length - 1)) {
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
            });
        });
        var remainingSyllables = accentedSyllableAndAfter.slice(sylI);
        if (remainingSyllables.length === afterLastAccent.length) {
            remainingSyllables.forEach(function (syl, i) { return (result += syl.withGabc(afterLastAccent[i].gabc)); });
        }
        else if (this.accentedSyllables.length) {
            // only bother warning if there are actually marked accents in the text
            console.warn("Invalid state when applying psalm tone...incorrect number of syllables remaining");
        }
        if (stripFlexMediantSymbols)
            result = result.replace(/\s+[*†]/g, "");
        return result;
    };
    VerseSegment.prototype.toString = function () {
        return this.words.join(" ");
    };
    VerseSegment.splitIntoWords = function (text, syllabifier) {
        if (syllabifier === void 0) { syllabifier = defaultSyllabifier; }
        var wordSplit = text
            .trim()
            .split(/([,;:.!?"'’”»\]\)—–-]*)(?:$|\s+|^)(?:\[?(\d+(?:[a-l]\b)?)\.?\]?\s*)?([\(\[«“‘'"¿¡—–-]*)/);
        // the text is now split into an array composed of text that didn't match
        // the regex, followed by the first group of the regex, and the second
        // group, and repeating.  We add two empty strings to the beginning and end
        // of this array so that the array has a number of elements that is divisible by 4
        // and is of the form [number,pre,word,post, number,pre,word,post,...]
        wordSplit.unshift("", "");
        wordSplit.push("");
        var words = [], lastWord, preWord;
        for (var i = 0; i + 2 < wordSplit.length; i += 4) {
            if (!wordSplit[i + 2]) {
                if (!(wordSplit[i + 1] || wordSplit[i + 3])) {
                    continue;
                }
                console.warn("no word found around " + (i + 1) + " when splitting string " + JSON.stringify(wordSplit) + " into words");
            }
            var verseWord = new VerseWord(wordSplit[i + 2], wordSplit[i + 1], wordSplit[i + 3], syllabifier, wordSplit[i]);
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
        return words;
    };
    return VerseSegment;
}());
var VerseWord = /** @class */ (function () {
    function VerseWord(text, pre, post, syllabifier, verseNumber) {
        var _this = this;
        if (syllabifier === void 0) { syllabifier = defaultSyllabifier; }
        if (verseNumber)
            this.verseNumber = verseNumber;
        this.isActualWord = /[a-z]/i.test(text);
        this.prePunctuation = this.punctuation = "";
        var syllabified = syllabifier(text);
        this.syllables = syllabified.map(function (syl, i) { return new VerseSyllable(syl, i === 0, i === syllabified.length - 1, pre, post, _this); });
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
        this.syllables[0].preText = prePunctuation + "\xA0" + this.syllables[0].preText;
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
    }
    VerseSyllable.prototype.toString = function () {
        return this.preText + this.text + this.postText + (this.lastOfWord ? " " : "");
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
    VerseSyllable.prototype.withGabc = function (gabc) {
        return this.preText + this.text + this.postText + ("(" + gabc + ")") + (this.lastOfWord ? "\n" : "");
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
        var tones = (this.tones = []);
        if (prefix)
            gabc = prefix + gabc;
        var match;
        var regexToneGabc = /(')?(([^\sr]+)(r)?)(?=$|\s)/gi;
        while ((match = regexToneGabc.exec(gabc))) {
            tones.push({
                accent: match[1] == "'",
                gabc: match[3],
                open: match[4] == "r"
            });
        }
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
                currentAccentTone = [ton];
                accentedTones.unshift(currentAccentTone);
                state = 1;
                if (lastOpen) {
                    currentAccentTone.push(lastOpen);
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
            afterLastAccent: afterLastAccent.length
        };
    }
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
        var _a;
        if (options === void 0) { options = {}; }
        gabc = gabc.replace(/[/()]+/g, " ");
        var clefMatch = /^[^a-m]*((?:cb?|f)[1-4])/.exec(gabc);
        if (clefMatch) {
            var detectedClef = clefMatch[1];
            if (clef && clef.slice(0, -1) === detectedClef.slice(0, -1)) {
                var detectedClefPosition = parseInt(detectedClef.slice(-1)), desiredClefPosition = parseInt(clef.slice(-1)), shift = 2 * (desiredClefPosition - detectedClefPosition);
                // shift the psalm tone
                try {
                    gabc = shiftGabc(gabc, shift);
                }
                catch (exception) {
                    clef = detectedClef;
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
        var gabcSegments = gabc.split(" : ");
        if (gabcSegments.length != 2) {
            console.warn("GabcPsalmTone.getFromGabc called on invalid GABC:", gabc);
        }
        var gabcPsalmTones = gabcSegments.map(function (gabc) {
            gabc = gabc.replace(/::\s*$/, "").trim();
            if (options.treatAsOneAccentWithXPreparatory) {
                var match = gabc.match(/\s(([^\sr',;:])+)$/);
                if (match) {
                    // jr h i g => jr h i 'g gr g
                    gabc =
                        gabc.slice(0, -match[0].length) +
                            " '" +
                            match[1] +
                            " " +
                            match[2].toLowerCase() +
                            "r " +
                            match[2].toLowerCase();
                }
            }
            return new GabcPsalmTone(gabc, "", true, clef);
        });
        return _a = {},
            _a[exports.VerseSegmentType.Mediant] = gabcPsalmTones[0],
            _a[exports.VerseSegmentType.Termination] = gabcPsalmTones[1],
            _a.clef = clef,
            _a;
    };
    return GabcPsalmTone;
}());

exports.GabcPsalmTone = GabcPsalmTone;
exports.GabcSyllabified = GabcSyllabified;
exports.VerseText = VerseText;
exports.defaultSyllabifier = defaultSyllabifier;
//# sourceMappingURL=index.js.map
