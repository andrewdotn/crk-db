/*
Tests that using readToolbox.js and writeToolbox.js in sequence does not change the Toolbox file.
 */

import { expect }        from 'chai';
import { fileURLToPath } from 'url';
import { readFile }      from 'fs/promises';
import readToolbox       from './readToolbox.js';
import writeToolbox      from './writeToolbox.js';

import {
  dirname as getDirname,
  join    as joinPath,
} from 'path';


const __dirname = getDirname(fileURLToPath(import.meta.url));
const dbPath    = joinPath(__dirname, `../../data/Wolvengrey.toolbox`);
const outPath   = joinPath(__dirname, `../../test/readWrite.test.toolbox`);

describe(`read + write Toolbox`, function() {

  before(async function() {
    const entries = await readToolbox(dbPath);
    await writeToolbox(outPath, entries);
  });

  it(`does not alter the database`, async function() {
    const originalDatabase = await readFile(dbPath, `utf8`);
    const compiledDatabase = await readFile(outPath, `utf8`);
    expect(compiledDatabase).to.equal(originalDatabase);
  });

});
