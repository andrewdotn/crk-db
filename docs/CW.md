# Notes on _Cree: Words_ (CW)

Documentation of the structure of the _Cree: Words_ (CW) Toolbox database.

Fields marked `[multiple]` may appear multiple times within the same entry.

## General Notes

* `{curly brackets}`: inflectional morphemes
* `/slashes/`: derivational morphemes

## `\drv` **derivation** {#derivation}

* A list of forms showing the derivational breakdown of the word.
* Only shows the topmost layer of derivational structure (**ex:** primary stem + secondary derivation).
* Almost always contains a reference to another entry, except for TI-2 stems (see [part of speech]() below).
* `/word-/` indicates a stem (primary or secondary), to which inflection is added.
* `/-affix/` indicates a derivational suffix (primary or secondary).

## `\mrp` **morphemes** [multiple] {#morphemes}

* Each `\mrp` field shows one of the morphemes contained in the entry, regardless of whether that morpheme is part of the primary or secondary stem, or derivational or inflectional.
* `stem-`: "free" stems (like bound nouns)
* `/initial-/` (also `/stem-/`?)
* `/-medial-/`
* `/-final/`

## `\ps`: **part of speech** {#part-of-speech}

Code | Description
---- | -----------
INM  | indeclinable nominal  

### Notes on specific parts of speech

* `INM`: Shows breakdowns for complex forms.

## `\rw` **rapid words** {#rapid-words}

* Semantic classification of the entry according to the [Rapid Words][RapidWords] semantic hierarchy.

## `\src`: **data source** {#source}

* Where the information in the entry comes from. May contain multiple sources. Usually publications, sometimes speaker codes (less common).

<!-- LINKS -->
[RapidWords]: http://www.rapidwords.net/
