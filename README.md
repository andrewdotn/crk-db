# Plains Cree Dictionary Database Management

The repository contains scripts and documentation for managing the multiple data sources for [ALTLab's][ALTLab] [Plains Cree][Cree] dictionary, which can be viewed online [here][Itwewina]. This repository does _not_ contain the actual data.

_This repository is a work in progress._

## Contents
<!-- TOC -->

- [Sources](#sources)
- [Process](#process)
- [Project Requirements](#project-requirements)

<!-- /TOC -->

## Sources

ALTLab's dictionary database is / will be aggregated from the following sources:

* [Arok Wolvengrey][Arok]'s _Cree Words_ (`CW`)
* _[Maskwacîs][Maskwacis] Dictionary of Cree Words_ (`MD`)
* _Alberta Elder's Cree Dictionary_ (`AECD`)
* [Albert Lacombe][Lacombe]'s _Dictionnaire de la langue des Cris_ (`DLC`)

## Process

The process for aggregating the sources is as follows:

1. **convert** dictionary from original format to a standard one (CSV, TSV, JSON)
2. **clean** and normalize the data, while retaining the original data
3. **import** the data into ALTLab's database using an aggregation algorithm
4. create the **sqlite3** database
5. create the **FST** LEXC files

## Project Requirements

* The field data from the original dictionaries should be retained in its original form, and preferably even incorporated into ALTLab's database in an unobtrusive way.

* The order that sources are imported should commutative (i.e. irrelevant; the script should output the same result regardless of the order the databases are imported).

* Manual input should not be required for aggregating entries. Entries can however be flagged for manual inspection.

<!-- Links -->
[ALTLab]:    https://github.com/UAlbertaALTLab
[Arok]:      https://www.fnuniv.ca/academic/faculty/dr-arok-wolvengrey/
[Cree]:      https://en.wikipedia.org/wiki/Plains_Cree
[Itwewina]:  https://sapir.artsrn.ualberta.ca/cree-dictionary/
[Lacombe]:   https://en.wikipedia.org/wiki/Albert_Lacombe
[Maskwacis]: https://en.wikipedia.org/wiki/Maskwacis
