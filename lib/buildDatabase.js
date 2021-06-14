/**
 * Builds the entire ALTLab database from scratch. Converts each data source, imports them into the database, and aggregates the entries.
 */

/* eslint-disable
  max-statements,
*/

import clearDatabase     from './utilities/clearDatabase.js';
import convertCW         from './convert/CW.js';
import convertMD         from './convert/MD.js';
import createSpinner     from 'ora';
import { fileURLToPath } from 'url';
import importCW          from './import/CW.js';
import importMD          from './import/MD.js';

import {
  dirname as getDirname,
  join    as joinPath,
} from 'path';

const __dirname  = getDirname(fileURLToPath(import.meta.url));

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.substring(1);
}

export default async function buildDatabase({spinners = true} = {}) {
  const dataDir      = joinPath(__dirname, '../data');
  const cwInputPath  = joinPath(dataDir, 'Wolvengrey.toolbox');
  const mdInputPath  = joinPath(dataDir, 'Maskwacis.tsv');
  const cwDataPath   = joinPath(dataDir, 'Wolvengrey.ndjson');
  const mdDataPath   = joinPath(dataDir, 'Maskwacis.ndjson');
  const mappingsPath = joinPath(dataDir, 'MD-CW-mappings.tsv');
  const databasePath = joinPath(dataDir, 'database.ndjson');

  async function withSpinner(name, action) {
    let spinner;
    if (spinners) {
      spinner = createSpinner(`Starting ${name}.`).start();
    }
    await action();
    if (spinners) {
      spinner.succeed(`${capitalizeFirstLetter(name)}: done.`);
    }
  }

  await withSpinner('database clear', clearDatabase);
  await withSpinner('CW database conversion', () =>
 convertCW(cwInputPath, cwDataPath));
  await withSpinner('MD database conversion', () =>  convertMD(mdInputPath, mdDataPath, mappingsPath));
  await withSpinner('CW database import', () =>  importCW(cwDataPath, databasePath));
  await withSpinner('MD database import', () =>  importMD(mdDataPath, databasePath))
}
