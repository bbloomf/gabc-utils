## [3.2.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.2.1...v3.2.2) (2021-01-18)


### Bug Fixes

* Fix check for verse marker to allow initial whitespace ([1542d3f](https://gitlab.com/sourceandsummit/gabc-utils/commit/1542d3f21e2f01d772849df193c2fe922e4b3f7c))



## [3.2.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.2.0...v3.2.1) (2021-01-18)


### Bug Fixes

* add splitByTitles to exports ([75c8cac](https://gitlab.com/sourceandsummit/gabc-utils/commit/75c8cac431e4dd82636482fb7b337429d1947299))



# [3.2.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.1.0...v3.2.0) (2021-01-18)


### Features

* Add function to split GABC by <h2> tag ([1e13fa9](https://gitlab.com/sourceandsummit/gabc-utils/commit/1e13fa9851f02d5f888e874b920f12a2a97a4e7e))



# [3.1.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.7...v3.1.0) (2021-01-18)


### Features

* Don't use non-syllable text with non-syllabic GABC in the case of <h2> or <alt> tags or verse markers ([be81a7b](https://gitlab.com/sourceandsummit/gabc-utils/commit/be81a7b7a6bed2d8e19bf6dcc0c32a35f0ff49bb))



## [3.0.7](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.6...v3.0.7) (2021-01-18)



## [3.0.6](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.5...v3.0.6) (2021-01-18)


### Bug Fixes

* Fix handling of h2 tags ([1d9cb8f](https://gitlab.com/sourceandsummit/gabc-utils/commit/1d9cb8fb9b63b65acb4d884998ff0e4721044da9))



## [3.0.5](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.4...v3.0.5) (2021-01-18)


### Bug Fixes

* Handle h2 tags like alt tags—keep them from producing a new syllable ([da19708](https://gitlab.com/sourceandsummit/gabc-utils/commit/da197083bbe25dcaf4402134e9457c88de606581))



## [3.0.4](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.3...v3.0.4) (2021-01-15)


### Bug Fixes

* Remove <poetic> tags and handle <alt> <rubric> and {} directives ([d54f31d](https://gitlab.com/sourceandsummit/gabc-utils/commit/d54f31daf3886c8816a5e1ef7f373018a08d79c1))



## [3.0.3](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.2...v3.0.3) (2021-01-05)


### Bug Fixes

* **Easter Time directives:** Handle chants properly when they do not have any easter time directive ([bc28fe9](https://gitlab.com/sourceandsummit/gabc-utils/commit/bc28fe980f08bbd02181d2a466b612d763f2551f))



## [3.0.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.1...v3.0.2) (2020-12-22)


### Bug Fixes

* Fix error in combining GABC with text during easter time ([f72ba6b](https://gitlab.com/sourceandsummit/gabc-utils/commit/f72ba6b5628b594368a368e018ec92a1da55acd6))



## [3.0.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v3.0.0...v3.0.1) (2020-12-22)


### Bug Fixes

* Fix handling of easter time Alleluia when the bar coinciding with the E.T. rubric is not a double bar ([b3a59e6](https://gitlab.com/sourceandsummit/gabc-utils/commit/b3a59e6dd1bee9f03908e786b3dec504030cde0d))



# [3.0.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.3.2...v3.0.0) (2020-12-22)


### Features

* Add isEaster parameter to merge() before useLargeInitial ([90bc8de](https://gitlab.com/sourceandsummit/gabc-utils/commit/90bc8de66a0acaaf37d2b117b2eb97f429aa3b4c))



## [2.3.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.3.1...v2.3.2) (2020-11-05)


### Bug Fixes

* allow non-breaking space character as part of the punctuation following a word ([5ca68bc](https://gitlab.com/sourceandsummit/gabc-utils/commit/5ca68bc2ea02a4f526c293dfa4b05ae9dc77955d))



## [2.3.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.3.0...v2.3.1) (2020-08-26)


### Bug Fixes

* Don't force undertie to center around entire syllables ([65ba0a9](https://gitlab.com/sourceandsummit/gabc-utils/commit/65ba0a922259e26f1eb3714cf8ff950778557cb3))



# [2.3.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.2.3...v2.3.0) (2020-08-26)


### Features

* **GabcSyllabified:** Handle centering of lyrics with elisions properly ([2a5b1b2](https://gitlab.com/sourceandsummit/gabc-utils/commit/2a5b1b2f1b8de1da352e321ca472c3f188ffc964))



## [2.2.3](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.2.2...v2.2.3) (2020-07-28)



## [2.2.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.2.1...v2.2.2) (2020-07-28)



## [2.2.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.2.0...v2.2.1) (2020-07-28)


### Bug Fixes

* **VerseText:** Count the final accent as a reciting tone when applying a flex that doesn't move down on final accent ([44e2894](https://gitlab.com/sourceandsummit/gabc-utils/commit/44e28940bc597332b874b759758b4c591ea15edd))



# [2.2.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.1.2...v2.2.0) (2020-07-23)


### Features

* **VerseText:** Allow removal of (E.T. alleluia)s from VerseText based on a parameter added to the constructor ([d5609b4](https://gitlab.com/sourceandsummit/gabc-utils/commit/d5609b43a7ec7be4bc41881b0322a6819824dbde))



## [2.1.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.1.1...v2.1.2) (2020-07-23)


### Bug Fixes

* **GabcSyllabified:** Only count letters when determining whether to capitalize the first 2 letters or 3 based on whether the first word is only 3 letters ([7d0ed66](https://gitlab.com/sourceandsummit/gabc-utils/commit/7d0ed66a977cc38084612c075fbe21c905c12d08))



## [2.1.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.1.0...v2.1.1) (2020-07-15)


### Bug Fixes

* **GabcPsalmTone:** Fix application of psalm tones on short lines that don't contain any reciting tones ([cbbe5c5](https://gitlab.com/sourceandsummit/gabc-utils/commit/cbbe5c5c4f5f7400df76e836885b4d2e25bde153))



# [2.1.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v2.0.0...v2.1.0) (2020-07-15)


### Features

* **VerseText:** Allow string value for initial verse number ([184c64d](https://gitlab.com/sourceandsummit/gabc-utils/commit/184c64d89275a45f26ec936d6d68e3cda9153c98))



# [2.0.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.3.1...v2.0.0) (2020-07-13)


### Features

* **Psalm Tones:** Make GabcPsalmTone capable of handling Meinrad tones and solemn antiphon tones ([cf477af](https://gitlab.com/sourceandsummit/gabc-utils/commit/cf477afab5f10b73df0114230eb37b22cc410b2c))



## [1.3.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.3.0...v1.3.1) (2020-07-06)


### Bug Fixes

* **GabcSyllabified:** Properly handle punctuation and capitalization around (E.T. alleluia) ([85bad8a](https://gitlab.com/sourceandsummit/gabc-utils/commit/85bad8ab0d644fc4c40f43a63addd0b6e86d1f7e))



# [1.3.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.2.0...v1.3.0) (2020-07-01)


### Features

* **GabcSyllabified:** Handle texts that end with `(E.T. al+le+lu+ia).` properly ([0f93ad0](https://gitlab.com/sourceandsummit/gabc-utils/commit/0f93ad02365b862c209d1039ba48e64df6d7ab31))



# [1.2.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.1.1...v1.2.0) (2020-06-11)


### Features

* **GabcPsalmTone:** Handle psalm tones that end in a melisma ([c42f89f](https://gitlab.com/sourceandsummit/gabc-utils/commit/c42f89fb3cd93fcc17c774a97391065aa42b55e4))



## [1.1.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.1.0...v1.1.1) (2020-06-10)


### Bug Fixes

* **VerseText:** Properly handle psalm tones with a melisma on the last accent with texts that end on an accented syllable ([fcc5b8a](https://gitlab.com/sourceandsummit/gabc-utils/commit/fcc5b8a66a873de70d9db9a40cbe20a7c3284297))



# [1.1.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.1...v1.1.0) (2020-06-10)


### Bug Fixes

* **GabcSyllabified:** Only capitalize the second letter if useLargeInitial is set to true ([0708702](https://gitlab.com/sourceandsummit/gabc-utils/commit/0708702e09941ede8504b33da46324b706eaaad0))


### Features

* **VerseText:** Always use a double bar at the end of a fully notated psalm tone ([4839a99](https://gitlab.com/sourceandsummit/gabc-utils/commit/4839a9903fd4fe58a7c747fc9e4c422228498ff2))



## [1.0.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0...v1.0.1) (2020-06-09)


### Features

* **GabcPsalmTone:** Allow custom bars to be used for the flex, mediant, and termination ([1a334da](https://gitlab.com/sourceandsummit/gabc-utils/commit/1a334dad4125ec322c8aa2038c155ba8d6b6a753))



# [1.0.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.8...v1.0.0) (2020-06-09)


### Bug Fixes

* Fix initial verse number config ([9338b48](https://gitlab.com/sourceandsummit/gabc-utils/commit/9338b486cf337d195d4f77c685093c2ba5f81ba5))



# [1.0.0-alpha.8](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) (2020-06-09)


### Features

* Add parameter to use capitalization rules for drop cap on psalm toned antiphons ([3d9f7d6](https://gitlab.com/sourceandsummit/gabc-utils/commit/3d9f7d67f03209e3780777ecdf1927feef5f59f3))



# [1.0.0-alpha.7](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-06-09)


### Bug Fixes

* Never double a text ([7ae71e3](https://gitlab.com/sourceandsummit/gabc-utils/commit/7ae71e3d193bed6892630fb19716abe8bb21a909))



# [1.0.0-alpha.6](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-06-06)


### Bug Fixes

* **GabcPsalmTone:** Preserve extra space after reciting tone ([667f535](https://gitlab.com/sourceandsummit/gabc-utils/commit/667f53562ce36a084cd64137fc0bdfa8e26c3741))



# [1.0.0-alpha.5](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-06-06)


### Features

* **GabcPsalmTone:** Include "originalGabc" on the GabcPsalmTones object ([bb3f466](https://gitlab.com/sourceandsummit/gabc-utils/commit/bb3f46640df872d610b9ad22efaa29ab010757a3))



# [1.0.0-alpha.4](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-06-05)


### Features

* **GabcPsalmTone:** Shift psalmtone melody when passing in a different clef ([7178114](https://gitlab.com/sourceandsummit/gabc-utils/commit/7178114e332f1f948cb301b21f4fe41b8ea914cb))



# [1.0.0-alpha.3](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2020-06-04)


### Bug Fixes

* **GabcPsalmTone:** Work correctly with English psalm tones that end with puncta inclinata ([f282467](https://gitlab.com/sourceandsummit/gabc-utils/commit/f282467dedf66852f1e6096198b1bc304d9a5cdf))



# [1.0.0-alpha.2](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2020-06-04)


### Bug Fixes

* **gabcsyllabified:** update project with Ben's most recent changes ([e78fcc6](https://gitlab.com/sourceandsummit/gabc-utils/commit/e78fcc660c20468b1c34d91edfa1274f1d6c36d9))



# [1.0.0-alpha.1](https://gitlab.com/sourceandsummit/gabc-utils/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2020-06-04)


### Bug Fixes

* **versetext:** apply Ben's fixes to VerseText ([e3d74f0](https://gitlab.com/sourceandsummit/gabc-utils/commit/e3d74f02406d937a32c01185f1806d93b492ce58))



# [1.0.0-alpha.0](https://gitlab.com/sourceandsummit/gabc-utils/compare/afeaebb1f91a00ad5710be3ccb8198daecce2114...v1.0.0-alpha.0) (2020-06-04)


### Features

* ***/*:** aggregate verious GABC processing scripts Ben has created for various tasks ([afeaebb](https://gitlab.com/sourceandsummit/gabc-utils/commit/afeaebb1f91a00ad5710be3ccb8198daecce2114))



