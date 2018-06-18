#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# Copyright (C) 2018  Eddie Antonio Santos <Eddie.Santos@nrc-cnrc.gc.ca>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""
Cleans issues with Wolvengrey.csv — the tab-separated values copy of Arok
Wolvengrey's “Nêhiýawêwin: Itwêwina" Cree-English dictionary.
"""

import csv
import hashlib
import sys
import unicodedata


WOLVENGREY_FILENAME = 'Wolvengrey.csv'
WOLVENGREY_SHA384 = '818c51dbbb08fe47d4b5ee0c02630746338c052e6d8c8e43b63368bbd8f0c5fe3f7052d8134b2c714c79ed6e11019de6'  # noqa


class Row:
    """
    Not all headers are unique in Wolvengrey.csv, so create a special class to
    combine them all.
    """
    __slots__ = '_keys', '_values'

    def __init__(self, header, row) -> None:
        assert len(header) == len(row)
        self._keys = tuple(header)
        self._values = list(row)

    def __getattr__(self, name: str):
        return self._values[self._getindex(name)]

    def __setattr__(self, name: str, value):
        if name in type(self).__slots__:
            return super().__setattr__(name, value)
        i = self._getindex(name)
        self._values[i] = value

    def _getindex(self, name: str) -> int:
        try:
            return self._keys.index(name)
        except ValueError:
            raise AttributeError(name)

    def __iter__(self):
        return iter(self._values)

    def clone(self) -> 'Row':
        # "Unzip" the _row to create a clone.
        return type(self)(self._keys, self._values)

    def to_seq(self):
        return tuple(self._values)

    def __repr__(self) -> 'str':
        clsname = type(self).__qualname__
        pairs = ' '.join(f"{name}={contents!r}"
                         for name, contents in self._row)
        return f"<{clsname} {pairs}>"


def clean_wolvengrey(wolvengrey_csv, output_file):
    global plains_cree_fixers
    reader = csv.reader(wolvengrey_csv, delimiter='\t')
    writer = csv.writer(output_file, delimiter='\t',
                        quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # Special case the header.
    rows = iter(reader)
    header = fix_header(next(rows))
    writer.writerow(header)

    for row_values in rows:
        row = Row(header, row_values)

        # Fix: erroneous Cans characters.
        row = fix_cans(row)

        if plains_cree_fixers:
            if not is_plains_cree(row):
                continue
            row = fix_dialect(row)

        writer.writerow(row)


def fix_header(row):
    r"""
    Issue: header titles are prefixed with '\'.

    This is not an erratum per se; the backslash is often an escape character
    in many programming languages. As such, having a backslash in every header
    makes working with this file more annoying than it has to be.
    """

    return tuple(col.lstrip('\\') for col in row)


def fix_cans(row: Row) -> Row:
    """
    Fix erroneous characters in the Canadian Aboriginal syllabics line.

    Namely:

        + The correct character for "hk" is 'ᕽ'
          <U+157D, CANADIAN SYLLABICS HK>.
        - Wolvengrey.csv uses 'ᕁ' <U+1541 CANADIAN SYLLABICS SAYISI YI>

        + The correct character for "m" is 'ᒼ'
          <U+14BC, CANADIAN SYLLABICS WEST-CREE M>
        - Wolvengrey.csv uses 'ᑦ' <U+1466, CANADIAN SYLLABICS T>
    """
    CANADIAN_SYLLABICS_SAYISI_YI = '\u1541'
    CANADIAN_SYLLABICS_HK = '\u157D'
    CANADIAN_SYLLABICS_T = '\u1466'
    CANADIAN_SYLLABICS_WEST_CREE_M = '\u14BC'

    new_row = row.clone()
    new_row.syl = row.syl.\
        replace(CANADIAN_SYLLABICS_SAYISI_YI, CANADIAN_SYLLABICS_HK).\
        replace(CANADIAN_SYLLABICS_T, CANADIAN_SYLLABICS_WEST_CREE_M)
    return new_row


def fix_dialect(row: Row) -> Row:
    """
    Converts 'ý' and 'ń' in the Standard Roman Orthography with thier Plains
    Cree appropriate letters.
    """

    LATIN_SMALL_LETTER_Y_WITH_ACUTE = '\u00FD'
    LATIN_SMALL_LETTER_N_WITH_ACUTE = '\u0144'

    new_row = row.clone()
    new_row.sro = nfc(row.sro).\
        replace(LATIN_SMALL_LETTER_Y_WITH_ACUTE, 'y').\
        replace(LATIN_SMALL_LETTER_N_WITH_ACUTE, 'n')
    return new_row


def is_plains_cree(row: Row) -> bool:
    return 'pC' in row.dl


def nfc(text: str) -> str:
    return unicodedata.normalize('NFC', text)


def verify_integrity(wolvengrey_file) -> None:
    """
    Checks the SHA-384 hash of the input CSV file.
    """
    m = hashlib.sha384()
    m.update(wolvengrey_file.read())
    actual_hash = m.hexdigest()
    if actual_hash != WOLVENGREY_SHA384:
        print(WOLVENGREY_FILENAME, 'does not have correct SHA-384 hash.',
              '\nExpected', WOLVENGREY_SHA384, '\nGot', actual_hash,
              '\nDid you provide the correct file?',
              file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    plains_cree_fixers = '--plains-cree' in sys.argv

    # Make sure we're dealing with the file we think we are first.
    with open(WOLVENGREY_FILENAME, 'rb') as wolvengrey_file:
        verify_integrity(wolvengrey_file)

    # Do the actual conversion now.
    with open(WOLVENGREY_FILENAME, 'rt') as wolvengrey_csv:
        clean_wolvengrey(wolvengrey_csv, sys.stdout)
