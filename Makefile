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
FIXED_CSVs = Wolvengrey.fixed.csv Wolvengrey.crk.fixed.csv \
			 Wolvengrey_eng2crk.fixed.csv Wolvengrey_eng2crk.crk.fixed.csv


.PHONY: all clean
all: $(FIXED_CSVs)

clean:
	rm -f $(FIXED_CSVs)


.DELETE_ON_ERROR:
%.fixed.csv: %.csv $(CLEAN_WOLVENGREY)
	$(CLEAN_WOLVENGREY) $< > $@

%.crk.fixed.csv: %.csv $(CLEAN_WOLVENGREY)
	$(CLEAN_WOLVENGREY) --plains-cree $< > $@
