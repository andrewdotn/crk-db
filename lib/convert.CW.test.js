/*
 Tests for the CW conversion / cleaning script.
 NOTE: Each entry in the test data contains data for one test, in order.
 */

/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  prefer-arrow-callback,
*/

import convert                    from './convert.CW.js';
import expect                     from 'expect.js';
import { fileURLToPath }          from 'url';
import { promises as fsPromises } from 'fs';

import {
  dirname as getDirname,
  join    as joinPaths,
} from 'path';

const __dirname    = getDirname(fileURLToPath(import.meta.url));
const { readFile } = fsPromises;

const testDataPath = joinPaths(__dirname, `../test/CW.test.db`);
const outPath      = joinPaths(__dirname, `../test/CW.test.json`);

/**
 * Finds the first entry in the test database whose \test field matches the test description
 * @param  {Object} ctx The Mocha test context
 * @return {Object}     Returns the relevant test entry
 */
function getTestEntry(ctx) {
  return ctx.data.filter(entry => entry.test === ctx.test.title).shift();
}

describe(`CW conversion script`, function() {

  before(async function convertTestData() {
    await convert(testDataPath, outPath);
    const json = await readFile(outPath, `utf8`);
    this.data = JSON.parse(json);
  });

  context(`\\dl`, function() {

    it(`converts dialects to Glottocodes`, function() {
      const { dialects } = getTestEntry(this);
      expect(dialects).to.eql([`nort2960`]);
    });

    it(`combines multiple dialect codes`, function() {
      const { dialects } = getTestEntry(this);
      expect(dialects).to.eql([`plai1258`, `swam1239`]);
    });

  });

  context(`\\sro`, function() {

    it(`NFC normalizes`, function() {
      // Cannot test this with <ý> because it gets converted to <y>.
      // test data: <ê> (non-normalized)
      const { sro } = getTestEntry(this);
      expect(sro).to.equal(`ê`);
    });

    it(`converts <ý> to <y>`, function() {
      const { sro } = getTestEntry(this);
      expect(sro).to.equal(`y`);
    });

    it(`converts <ń> to <y>`, function() {
      const { sro } = getTestEntry(this);
      expect(sro).to.equal(`y`);
    });

    it(`produces an error object for invalid SRO characters`, function() {

      const { name, message } = this.data.filter(item => {
        return item.name === `ParseError`
        && item.lines.some(line => line.includes(this.test.title));
      }).shift();

      expect(name).to.equal(`ParseError`);
      expect(message).to.contain(`invalid`);

    });

  });

  context(`\\syl`, function() {

    it(`copies the Syllabics field verbatim`, function() {
      const { syllabics } = getTestEntry(this);
      expect(syllabics).to.equal(`ᐊᒑᐦᑯᐢ  ᐁᑳ  ᑳ ᐋᐦᒌᐟ`);
    });

  });

});
