clean-wolvengrey
================

Cleans the tab-separated value copy of Dr. Arok Wolvengrey's
“nēhiýawēwin: itwēwina” Cree-English dictionary.

Requirements
------------

 - Python 3.6+
 - GNU make

Usage
-----

Make sure you have downloaded the original `Wolvengrey.csv` in the
current directory. You may also download `Wolvengrey_eng2crk.csv` in the
current directory, however this is optional.

Type `make` in the current directory. It will create:

### `Wolvengrey.fixed.csv`

A copy of `Wolvengrey.csv` with fixed headers and general errata
corrected.

### `Wolvengrey.crk.fixed.csv`

("crk" is the [ISO 639-3 identifier for Plains Cree](https://iso639-3.sil.org/code/crk)).

Same as `Wolvengrey.fixed.csv`, but includes only words in Plains Cree.
The orthography changes all dialect-variable characters to their Plains
Cree specifics.

---

If you have downloaded `Wolvengrey_eng2crk.csv`, `make` will create
similar `Wolvengrey_eng2crk.fixed.csv` and
`Wolvengrey_eng2crk.crk.fixed.csv`, just as above.

License
-------

Code is licensed under the GNU General Public License v3;
Copyright © 2018 Eddie Antonio Santos.
`Wolvengrey.csv` is copyright © 2001 Arok Wolvengrey;
All rights reserved.
