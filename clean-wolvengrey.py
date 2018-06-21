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

import argparse
import csv
import hashlib
import re
import sys
import unicodedata
from pathlib import Path


WOLVENGREY_FILENAME = 'Wolvengrey.csv'
SHA384_HASH = {
        'Wolvengrey': '818c51dbbb08fe47d4b5ee0c02630746338c052e6d8c8e43b63368bbd8f0c5fe3f7052d8134b2c714c79ed6e11019de6',  # noqa
        'Wolvengrey_eng2crk': '74a0914fbeb73e3736676a67b521ab083c0e03ec50dd2932383a439580155a3c961569d424942d2c5186a0b5f2c4d120',  # noqa
}

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

# Series of tables generated from: syllabics.tsv
# https://github.com/UAlbertaALTLab/nehiyawewin-syllabics/blob/master/syllabics.tsv
#
# Most of this was cobbled together using awk.
# Do this to get a list of column numbers:
#
#   (head -1  | tr $'\t' $'\n' | nl ) < syllabics.tsv
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
syllabic_to_sro = {
        'ᐁ': 'ê', 'ᐃ': 'i', 'ᐄ': 'î', 'ᐅ': 'o', 'ᐆ': 'ô', 'ᐊ': 'a', 'ᐋ': 'â',
        'ᐟ': 't', 'ᐠ': 'k', 'ᐢ': 's', 'ᐣ': 'n', 'ᐤ': 'w',
        'ᐦ': 'h', 'ᐨ': 'c', 'ᑊ': 'p', 'ᒼ': 'm', 'ᕀ': 'y',
        'ᓬ': 'l', 'ᕒ': 'r', 'ᕽ': 'hk',
}
sro_to_w = {
    'ê': 'ᐍ', 'i': 'ᐏ', 'î': 'ᐑ', 'o': 'ᐓ', 'ô': 'ᐕ', 'a': 'ᐘ', 'â': 'ᐚ',
    'pê': 'ᐻ', 'pi': 'ᐽ', 'pî': 'ᐿ', 'po': 'ᑁ', 'pô': 'ᑃ', 'pa': 'ᑅ', 'pâ': 'ᑇ',
    'tê': 'ᑘ', 'ti': 'ᑚ', 'tî': 'ᑜ', 'to': 'ᑞ', 'tô': 'ᑠ', 'ta': 'ᑢ', 'tâ': 'ᑤ',
    'kê': 'ᑵ', 'ki': 'ᑷ', 'kî': 'ᑹ', 'ko': 'ᑻ', 'kô': 'ᑽ', 'ka': 'ᑿ', 'kâ': 'ᒁ',
    'cê': 'ᒓ', 'ci': 'ᒕ', 'cî': 'ᒗ', 'co': 'ᒙ', 'cô': 'ᒛ', 'ca': 'ᒝ', 'câ': 'ᒟ',
    'mê': 'ᒭ', 'mi': 'ᒯ', 'mî': 'ᒱ', 'mo': 'ᒳ', 'mô': 'ᒵ', 'ma': 'ᒷ', 'mâ': 'ᒹ',
    'nê': 'ᓊ', 'na': 'ᓌ', 'nâ': 'ᓎ',
    'sê': 'ᓷ', 'si': 'ᓹ', 'sî': 'ᓻ', 'so': 'ᓽ', 'sô': 'ᓿ', 'sa': 'ᔁ', 'sâ': 'ᔃ',
    'yê': 'ᔰ', 'yi': 'ᔲ', 'yî': 'ᔴ', 'yo': 'ᔶ', 'yô': 'ᔸ', 'ya': 'ᔺ', 'yâ': 'ᔼ',
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
        assert len(header) >= len(row)
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
    global use_plains_cree_fixers
    reader = csv.reader(wolvengrey_csv, delimiter='\t')
    writer = csv.writer(output_file, delimiter='\t', lineterminator='\n',
                        quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # Special case the header.
    rows = iter(reader)
    header = fix_header(next(rows))
    writer.writerow(header)

    for row_values in rows:
        row = Row(header, row_values)

        # Fix erroneous syllabics characters.
        row = fix_cans(row)
        # Fix how CwV and wV are written
        row = fix_middle_dot_w(row)
        # Fix how /Cw-V/ is written.
        row = fix_sandhi(row)

        if use_plains_cree_fixers:
            # Omit non-nêhiyawêwin words.
            if not is_plains_cree(row):
                continue
            row = fix_dialect(row)

        # Fix entry-specific errata.
        row = fix_errata(row)

        # Do some sanity checks:
        assert row.sro == nfc(row.sro), (
            f'The SRO is not NFC normalized in: {row!r}'
        )
        if use_plains_cree_fixers:
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


def fix_sandhi(row: Row) -> Row:
    """
    Fixes the syllabic rendering of "sandhi". Occurs in Plains Cree when a
    particle or pre-verb that ends with a consonantal coda is followed by a
    vowel.

    E.g.,

        kikw-âya
            Should be: ᑭᒁᔭ
            Actually:  ᑮᐠᐧᐋᔭ

    The 'w' is represented as a standalone FINAL MIDDLE DOT, which is Not A
    Plains Cree Thing™. The solution is to combine it with the next syllabic.

    Examples:

    >>> fix_sandhi(Row(('sro', 'syl'), ['kîkw-âyi', 'ᑮᐠᐧ ᐋᔭ']))
    <Row sro='kîkw-âyi' syl='ᑮᒁᔭ'>
    >>> fix_sandhi(Row(('sro', 'syl'), ['mamôhcw-âyihtiw', 'ᒪᒨᐦᐨᐧ ᐋᔨᐦᑎᐤ']))
    <Row sro='mamôhcw-âyihtiw' syl='ᒪᒨᐦᒟᔨᐦᑎᐤ'>
    >>> fix_sandhi(Row(('sro', 'syl'), ['kîkw-âyi', 'ᑮᐠᐧ ᐋᔨ']))
    <Row sro='kîkw-âyi' syl='ᑮᒁᔨ'>
    >>> fix_sandhi(Row(('sro', 'syl'), ['mostosw-âya', 'ᒧᐢᑐᐢᐧ ᐋᔭ']))
    <Row sro='mostosw-âya' syl='ᒧᐢᑐᔃᔭ'>

    See: Wolvengrey 2001, pp. TODO: PAGE NUMBER
    """
    if CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT not in row.syl:
        return row

    pattern = re.compile(f'(.){CANADIAN_SYLLABICS_FINAL_MIDDLE_DOT}\\s(.)')

    def to_CwV_syllabic(match) -> str:
        consonant = syllabic_to_sro[match.group(1)]
        vowel = syllabic_to_sro[match.group(2)]
        return sro_to_w[consonant + vowel]

    fixed = pattern.sub(to_CwV_syllabic, row.syl)
    return row.clone_with(syl=fixed)


def fix_errata(row: Row) -> Row:
    """
    Fix any additional errata and typos I know about.
    """

    errata = (
        # (SRO, fixing function)
        ('nêwotâpânâskw',  # Typo: errnoneous 'w'; cf. Wolvengrey 2001, pp. 131
            lambda r: r.clone_with(sro='nêwotâpânâsk')),
        ('wîpicisîs',  # Alt. form of 'wîpicîsis' uses other's syllabics.
            lambda r: r.clone_with(syl='ᐑᐱᒋᓰᐢ')),
    )

    for sro, fixer in errata:
        if sro == row.sro:
            row = fixer(row)
    return row


def is_plains_cree(row: Row) -> bool:
    return 'pC' in row.dl


def nfc(text: str) -> str:
    return unicodedata.normalize('NFC', text)


def verify_integrity(filename: Path) -> None:
    """
    Checks the SHA-384 hash of the input CSV file.
    """
    short_name = filename.stem
    expected_hash = SHA384_HASH[short_name]
    if short_name not in SHA384_HASH:
        print("Expected a file called one of:", *SHA384_HASH.keys(),
              file=sys.stderr)
        sys.exit(2)

    m = hashlib.sha384()
    with open(filename, 'rb') as wolvengrey_file:
        m.update(wolvengrey_file.read())
    actual_hash = m.hexdigest()

    if actual_hash != expected_hash:
        print('Input does not have correct SHA-384 hash.',
              '\nExpected :', expected_hash,
              '\nGot      :', actual_hash,
              '\nDid you provide the correct file?',
              file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=Path)
    parser.add_argument('--plains-cree', action='store_true')
    args = parser.parse_args()

    filename = args.filename
    use_plains_cree_fixers = args.plains_cree

    # Make sure we're dealing with the file we think we are first.
    verify_integrity(filename)

    # Do the actual conversion now.
    with open(filename, 'rt', newline='') as wolvengrey_csv:
        clean_wolvengrey(wolvengrey_csv, sys.stdout)
