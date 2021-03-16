# Plains Cree Dictionary Database Management

The repository contains scripts and documentation for managing the multiple data sources for [ALTLab's][ALTLab] [Plains Cree][Cree] dictionary, which can be viewed online [here][itwewina]. This repository does _not_ (and should not) contain the actual data.

The database uses the [Data Format for Digital Linguistics][DaFoDiL] (<abbr title='Data Format for Digital Linguistics'>DaFoDiL</abbr>) as its underlying data format, a set of recommendations for storing linguistic data in JSON.

_This repository is a work in progress._

## Contents
<!-- TOC -->

- [Sources](#sources)
- [Project Requirements](#project-requirements)
- [Process](#process)
- [Style Guide](#style-guide)

<!-- /TOC -->

## Sources

ALTLab's dictionary database is / will be aggregated from the following sources:

* [Arok Wolvengrey][Arok]'s [_nêhiyawêwin: itwêwina / Cree: Words_][CW] (`CW`)
  - This is a living source.
* [Maskwacîs][Maskwacis] [_Nehiyawêwina Pîkiskwewinisa / Dictionary of Cree Words_][MD] (`MD`)
  - This a living source.
* _Alberta Elders' Cree Dictionary_ (`AECD` or `AE` or `ED`)
  - This is a static source.
* [Albert Lacombe][Lacombe]'s _Dictionnaire de la langue des Cris_ (`DLC`)
  - This will be a static source.
* _The Student's Dictionary of Literary Plains Cree, Based on Contemporary Texts_
  - This source has already been integrated into _Cree: Words_.

## Project Requirements

* The field data from the original dictionaries should be retained in its original form, and preferably even incorporated into ALTLab's database in an unobtrusive way.

* The order that sources are imported should commutative (i.e. irrelevant; the script should output the same result regardless of the order the databases are imported).

* Manual input should not be required for aggregating entries. Entries can however be flagged for manual inspection.

* An earlier, still relevant overall background document can be found here: https://docs.google.com/document/d/1uBJtG8WxRbUIBSdeNBynksKQoRImXJoCbEVFcW9HIJw/edit

## Process

At a high level, the process for aggregating the sources is as follows:

1. **convert** dictionary from original format to a standard one (CSV, TSV, JSON)
2. **clean** and normalize the data, while retaining the original data
3. **import** the data into ALTLab's database using an aggregation algorithm
4. create the **sqlite3** database
5. create the **FST** LEXC files

## Style Guide

Please see the [style guide](./style guide.md) (with glossary) for documentation of the lexicographical conventions used in this database.

<!-- Links -->
[ALTLab]:     https://github.com/UAlbertaALTLab
[Arok]:       https://www.fnuniv.ca/academic/faculty/dr-arok-wolvengrey/
[Cree]:       https://en.wikipedia.org/wiki/Plains_Cree
[CW]:         https://uofrpress.ca/Books/C/Cree-Words
[DaFoDiL]:    https://format.digitallinguistics.io/
[itwewina]:   https://sapir.artsrn.ualberta.ca/cree-dictionary/
[Lacombe]:    https://en.wikipedia.org/wiki/Albert_Lacombe
[Maskwacis]:  https://en.wikipedia.org/wiki/Maskwacis
[MD]:         https://www.altlab.dev/maskwacis/dictionary.html
