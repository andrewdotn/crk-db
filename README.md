clean-wolvengrey
================

Cleans the tab-separated value copy of Dr. Arok Wolvengrey's
“Nêhiýawêwin: Itwêwina” Cree-English dictionary.

Requirements
------------

 - Python 3.6+
 - GNU make

Usage
-----

Make sure you have downloaded the original `Wolvengrey.csv` in the
current directory.

Type `make` in the current directory. It will create:

### `Wolvengrey.fixed.csv`

A copy of `Wolvengrey.csv` with fixed headers and general errata
corrected.

### `Wolvengrey.crk.fixed.csv`

("crk" is the [ISO 639-3 identifier for Plains Cree](https://iso639-3.sil.org/code/crk)).

Same as `Wolvengrey.fixed.csv`, but includes only words in Plains Cree.
The orthography changes all dialect-variable characters to their Plains
Cree specifics.


License
-------

Code is licensed under the GNU General Public License v3;
Copyright © 2018 Eddie Antonio Santos.
`Wolvengrey.csv` is Copyright © 2001 Arok Wolvengrey;
All rights reserved.
