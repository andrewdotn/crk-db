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

CLEAN_WOLVENGREY := ./clean-wolvengrey.py
FIXED_CSVs = Wolvengrey.fixed.csv Wolvengrey.crk.fixed.csv
PATCHES = $(FIXED_CSVs:.csv=.csv.patch)

DIFFFLAGS = --minimal


.PHONY: all clean
all: $(FIXED_CSVs) $(PATCHES)

clean:
	rm $(FIXED_CSVs) $(PATCHES)


Wolvengrey.fixed.csv: Wolvengrey.csv $(CLEAN_WOLVENGREY)
	$(CLEAN_WOLVENGREY) > $@

Wolvengrey.crk.fixed.csv: Wolvengrey.csv $(CLEAN_WOLVENGREY)
	$(CLEAN_WOLVENGREY) --plains-cree > $@

%.csv.patch: %.csv Wolvengrey.csv
	diff --text --ed $(DIFFFLAGS) Wolvengrey.csv $< > $@



