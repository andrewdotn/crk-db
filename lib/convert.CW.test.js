/*
Tests for the CW conversion / cleaning script.
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

describe(`CW conversion script`, function() {

  before(async function convertTestData() {
    await convert(testDataPath, outPath);
    const json = await readFile(outPath, `utf8`);
    this.data = JSON.parse(json);
  });

  context(`SRO`, function() {

    // NOTE: Each entry in the test data contains data for one test, in order.

    it(`NFC normalizes`, function() {
      // Cannot test this with <ý> because it gets converted to <y>.
      // test data: <ê> (non-normalized)
      const entry = this.data[0];
      expect(entry.sro).to.equal(`ê`);
    });

    it(`converts <ý> to <y>`, function() {
      const entry = this.data[1];
      expect(entry.sro).to.equal(`y`);
    });

    it(`converts <ń> to <y>`, function() {
      const entry = this.data[2];
      expect(entry.sro).to.equal(`y`);
    });

    it(`prodcues an error object for invalid SRO characters`, function() {
      const entry = this.data[3];
      expect(entry.name).to.equal(`ParseError`);
      expect(entry.message).to.contain(`invalid`);
    });

  });

});
