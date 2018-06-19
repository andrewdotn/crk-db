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
Cleans issues with Wolvengrey.csv — the tab-separated values copy of
Dr. Arok Wolvengrey's “nēhiýawēwin: itwēwina” Cree-English dictionary.
"""

import csv
import hashlib
import re
import sys
import unicodedata


WOLVENGREY_FILENAME = 'Wolvengrey.csv'
WOLVENGREY_SHA384 = '818c51dbbb08fe47d4b5ee0c02630746338c052e6d8c8e43b63368bbd8f0c5fe3f7052d8134b2c714c79ed6e11019de6'  # noqa

# bona fide Plains Cree characters
CANADIAN_SYLLABICS_WEST_CREE_M = '\u14BC'  # ᒼ
CANADIAN_SYLLABICS_WEST_CREE_Y = '\u1540'  # ᕀ
CANADIAN_SYLLABICS_HK = '\u157D'  # ᕽ

# Dubious lookalikes:
CANADIAN_SYLLABICS_SAYISI_YI = '\u1541'  # ᕁ
CANADIAN_SYLLABICS_T = '\u1466'  # ᑦ
CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT = '\u1427'  # ᐧ
CANADIAN_SYLLABICS_FINAL_PLUS = '\u1429'  # ᐩ

SRO_ALPHABET = 'achikmnopstwyâêîô'
ALLOWABLE_SRO = SRO_ALPHABET + ' !?-'
ALLOWABLE_SRO += 'r'  # Used in loan words like "kihcihtwâwi-mêriy-"
SYLLABICS = (
    'ᐁᐃᐄᐅᐆᐊᐋᐍᐏᐑᐓᐕᐘᐚ'  # WV
    'ᐯᐱᐲᐳᐴᐸᐹᐻᐽᐿᑁᑃᑅᑇ'  # pWV
    'ᑌᑎᑏᑐᑑᑕᑖᑘᑚᑜᑞᑠᑢᑤ'  # tWV
    'ᑫᑭᑮᑯᑰᑲᑳᑵᑷᑹᑻᑽᑿᒁ'  # kWV
    'ᒉᒋᒌᒍᒎᒐᒑᒓᒕᒗᒙᒛᒝᒟ'  # cWV
    'ᒣᒥᒦᒧᒨᒪᒫᒭᒯᒱᒳᒵᒷᒹ'  # mWV
    'ᓀᓂᓃᓄᓅᓇᓈᓊᓌᓎ'      # nWV (only nwê, nwa, and nwâ are used in Plains Cree)
    'ᓭᓯᓰᓱᓲᓴᓵᓷᓹᓻᓽᓿᔁᔃ'  # sWV
    'ᔦᔨᔩᔪᔫᔭᔮᔰᔲᔴᔶᔸᔺᔼ'  # yWV
    'ᑊᐟᐠᐨᒼᐣᐢᕀᐤᐦᕽ'     # finals
)
ALLOWABLE_SYLLABICS = SYLLABICS + ' -?'
ALLOWABLE_SYLLABICS += 'ᕒ'  # Used in loan words like "ᑭᐦᒋᐦᑤᐏ ᒣᕒᐃᕀ"


syllable_to_w = {
        'ᐁ': 'ᐍ', 'ᐃ': 'ᐏ', 'ᐄ': 'ᐑ', 'ᐅ': 'ᐓ', 'ᐆ': 'ᐕ', 'ᐊ': 'ᐘ', 'ᐋ': 'ᐚ',
        'ᐯ': 'ᐻ', 'ᐱ': 'ᐽ', 'ᐲ': 'ᐿ', 'ᐳ': 'ᑁ', 'ᐴ': 'ᑃ', 'ᐸ': 'ᑅ', 'ᐹ': 'ᑇ',
        'ᑌ': 'ᑘ', 'ᑎ': 'ᑚ', 'ᑏ': 'ᑜ', 'ᑐ': 'ᑞ', 'ᑑ': 'ᑠ', 'ᑕ': 'ᑢ', 'ᑖ': 'ᑤ',
        'ᑫ': 'ᑵ', 'ᑭ': 'ᑷ', 'ᑮ': 'ᑹ', 'ᑯ': 'ᑻ', 'ᑰ': 'ᑽ', 'ᑲ': 'ᑿ', 'ᑳ': 'ᒁ',
        'ᒉ': 'ᒓ', 'ᒋ': 'ᒕ', 'ᒌ': 'ᒗ', 'ᒍ': 'ᒙ', 'ᒎ': 'ᒛ', 'ᒐ': 'ᒝ', 'ᒑ': 'ᒟ',
        'ᒣ': 'ᒭ', 'ᒥ': 'ᒯ', 'ᒦ': 'ᒱ', 'ᒧ': 'ᒳ', 'ᒨ': 'ᒵ', 'ᒪ': 'ᒷ', 'ᒫ': 'ᒹ',
        'ᓀ': 'ᓊ', 'ᓇ': 'ᓌ', 'ᓈ': 'ᓎ',
        'ᓭ': 'ᓷ', 'ᓯ': 'ᓹ', 'ᓰ': 'ᓻ', 'ᓱ': 'ᓽ', 'ᓲ': 'ᓿ', 'ᓴ': 'ᔁ', 'ᓵ': 'ᔃ',
        'ᔦ': 'ᔰ', 'ᔨ': 'ᔲ', 'ᔩ': 'ᔴ', 'ᔪ': 'ᔶ', 'ᔫ': 'ᔸ', 'ᔭ': 'ᔺ', 'ᔮ': 'ᔼ',
}
non_w_syllables = ''.join(syllable_to_w.keys())
w_pattern = re.compile(
    f'([{non_w_syllables}]){CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT}'
)


class Row:
    """
    Unsettlingly, not all column names are unique in Wolvengrey.csv, so we
    can't use DictReader or something like that.
    This special class keeps all headers and values in order, so that no data
    is lost, while being able to access well-behaving columns via attributes.
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
        """
        Create a shallow copy of this row.
        """
        return type(self)(self._keys, self._values)

    def clone_with(self, **kwargs) -> 'Row':
        """
        Create a copy of this row with the given attributes changed.
        """
        new_row = self.clone()
        for attr, value in kwargs.items():
            setattr(new_row, attr, value)
        return new_row

    def __repr__(self) -> str:
        clsname = type(self).__qualname__
        pairs = ' '.join(f"{name}={contents!r}"
                         for name, contents in zip(self._keys, self._values))
        return f"<{clsname} {pairs}>"


def clean_wolvengrey(wolvengrey_csv, output_file):
    global plains_cree_fixers
    reader = csv.reader(wolvengrey_csv, delimiter='\t')
    writer = csv.writer(output_file, delimiter='\t', lineterminator='\n',
                        quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # Special case the header.
    rows = iter(reader)
    header = fix_header(next(rows))
    writer.writerow(header)

    for row_values in rows:
        row = Row(header, row_values)

        # Fix erroneous Cans characters.
        row = fix_cans(row)

        # Fix how CwV and wV are written
        row = fix_middle_dot_w(row)
        # Fix how /VCw / is written.
        row = fix_middle_dot_coda(row)

        if plains_cree_fixers:
            if not is_plains_cree(row):
                continue
            row = fix_dialect(row)

        # Fix entry-specific errata.
        row = fix_errata(row)

        # Do some sanity checks:
        assert row.sro == nfc(row.sro), (
            f'The SRO is not NFC normalized in: {row!r}'
        )
        if plains_cree_fixers:
            assert all(c in ALLOWABLE_SRO for c in row.sro), (
                f'Found characters outside alphabet in {row!r}'
            )
        assert all(c in ALLOWABLE_SYLLABICS for c in row.syl), (
            f'Found characters outside Plains Cree syllabics in {row!r}'
        )

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

        + The correct character for "y" is 'ᕀ'
          <U+1540 CANADIAN SYLLABICS WEST-CREE Y>
        - Wolvengrey.csv sometimes uses 'ᐩ'
          <U+1429, CANADIAN SYLLABICS FINAL PLUS>
    """

    new_row = row.clone()
    new_row.syl = row.syl.\
        replace(CANADIAN_SYLLABICS_SAYISI_YI, CANADIAN_SYLLABICS_HK).\
        replace(CANADIAN_SYLLABICS_T, CANADIAN_SYLLABICS_WEST_CREE_M).\
        replace(CANADIAN_SYLLABICS_FINAL_PLUS, CANADIAN_SYLLABICS_WEST_CREE_Y)
    return new_row


def fix_dialect(row: Row) -> Row:
    """
    Converts 'ý' and 'ń' in the Standard Roman Orthography with their Plains
    Cree appropriate letters.

    Excerpt from Wolvengrey 2001, pp. xix:

        ...the symbol **ý** [...] occurs in Plains Cree words to indicate a
        corresponding Woods **th** or Swampy **n**. Similarly, for those few
        Swampy words cited specifically, the symbol **ñ** [sic] [...] is used
        when Plains will have **y** and Woods **th**.
    """

    LATIN_SMALL_LETTER_Y_WITH_ACUTE = '\u00FD'
    LATIN_SMALL_LETTER_N_WITH_ACUTE = '\u0144'

    new_row = row.clone()
    new_row.sro = nfc(row.sro).\
        replace(LATIN_SMALL_LETTER_Y_WITH_ACUTE, 'y').\
        replace(LATIN_SMALL_LETTER_N_WITH_ACUTE, 'y')
    return new_row


def fix_middle_dot_w(row: Row) -> Row:
    """
    Converts a syllable followed by CANADIAN SYLLABICS MIDDLE DOT to the
    appropriate /C?wV/ syllabic.

    That is, where in Wolvengrey.csv, syllables that begin contain a 'w' dot
    are notated as the syllable without the 'w' dot, followed by a FINAL
    MIDDLE DOT, this function converts the two characters into one character,
    which is a 'WEST-CREE W' character.
    """

    # Skip it if unaffected.
    if CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT not in row.syl:
        return row

    def to_correct_syllabic(match):
        return syllable_to_w[match.group(1)]

    # find a vowel, followed by the middle dot
    return row.clone_with(
            syl=w_pattern.sub(to_correct_syllabic, row.syl)
    )


def fix_middle_dot_coda(row: Row) -> Row:
    """
    There are words that have a Cw coda followed by a space.  The 'w' is
    represented as a final middle dot, which is Not A Plains Cree Thing™, so I
    replace it with the final ring.

    Examples:

        - kîkw-âya          ᑮᐠᐤ ᐋᔭ
        - kîkw-âyi          ᑮᐠᐤ ᐋᔨ
        - mamôhcw-âyihtiw   ᒪᒨᐦᐨᐤ ᐋᔨᐦᑎᐤ
        - mostosw-âya       ᒧᐢᑐᐢᐤ ᐋᔭ

    Honestly, I have no idea if this is appropriate, and I need to consult with
    somebody that knows more about this than me.
    """
    if CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT not in row.syl:
        return row

    # XXX: FIGURE OUT IF THIS IS CORRECT!
    return row.clone_with(
            syl=re.sub(f'{CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT}\\s',
                       "ᐤ ",
                       row.syl)
    )


def fix_errata(row: Row) -> Row:
    """
    Fix additional errata...
    """

    errata = (
        # SRO           # Fixing function
        # XXX: I'm not really sure how to write these two!
    )

    for sro, fixer in errata:
        if sro == row.sro:
            row = fixer(row)
    return row


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
    with open(WOLVENGREY_FILENAME, 'rt', newline='') as wolvengrey_csv:
        clean_wolvengrey(wolvengrey_csv, sys.stdout)
