import createSpinner from 'ora';
import DatabaseIndex from '../utilities/DatabaseIndex.js';
import readNDJSON    from '../utilities/readNDJSON.js';
import writeNDJSON   from '../utilities/writeNDJSON.js';

function createKey(entry) {
  return `${ entry.lemma.proto }@${ entry.pos }`;
}

function getCombinedDefinition(senses) {
  return senses
  .map(({ definition }) => definition)
  .join(`; `);
}

function isMatchingDefinition(a, b) {

  const defA = getCombinedDefinition(a.senses);
  const defB = getCombinedDefinition(b.senses);

  return defA === defB;

}

/**
 * Updates an ALTLab entry with data from a CW entry.
 * @param  {Object} dbEntry
 * @param  {Object} cwEntry
 * @return {Object} Returns the updated ALTLab entry.
 */
function updateEntry(dbEntry, cwEntry) {

  dbEntry.dataSources  ??= {};
  dbEntry.dataSources.CW = cwEntry;

  dbEntry.head  = Object.assign({}, cwEntry.head);
  dbEntry.lemma = Object.assign({}, cwEntry.lemma);
  dbEntry.pos   = cwEntry.pos;

  cwEntry.matched = true;

  return dbEntry;

}

/**
 * A class representing an ALTLab database entry.
 */
class DatabaseEntry {

  /**
   * Create a new database entry from a CW Toolbox entry.
   * @param {Object} cwEntry
   */
  constructor(cwEntry) {
    updateEntry(this, cwEntry);
  }

}

/**
 * Imports the CW database into the ALTLab database.
 * @param  {String}         cwPath       The path to the CW database in NDJSON format.
 * @param  {String}         databasePath The path to the ALTLab database file.
 * @return {Promise<Array>}              Returns a Promise that resolves to the Array of ALTLab database entries after they have been written to the database.
 */
export default async function importCW(cwPath, dbPath) {

  const loadDataSpinner = createSpinner(`Loading databases.`).start();
  const cwEntries       = await readNDJSON(cwPath);
  const dbEntries       = await readNDJSON(dbPath);
  const originalDBSize  = dbEntries.length;
  let   entriesUpdated  = 0;
  let   entriesAdded    = 0;
  let   entriesRemoved  = 0;

  loadDataSpinner.succeed(`Databases loaded.`);

  const indexSpinner = createSpinner(`Indexing database.`).start();
  const dbIndex      = new DatabaseIndex(dbEntries, createKey);

  indexSpinner.succeed(`Database indexed.`);

  const importSpinner = createSpinner(`Importing CW entries.`).start();

  for (const cwEntry of cwEntries) {

    const key     = createKey(cwEntry);
    let   dbEntry = dbIndex.get(key);

    if (Array.isArray(dbEntry)) {
      dbEntry = dbEntry.find(e => isMatchingDefinition(e.dataSources.CW, cwEntry));
    }

    if (dbEntry && isMatchingDefinition(dbEntry.dataSources.CW, cwEntry)) {
      updateEntry(dbEntry, cwEntry);
      entriesUpdated++;
      continue;
    }

    const newEntry = new DatabaseEntry(cwEntry);
    dbIndex.add(newEntry);
    entriesAdded++;
    continue;

  }

  importSpinner.succeed(`CW entries imported.`);

  const cleanupSpinner = createSpinner(`Removing outdated entries.`).start();

  for (const dbEntry of dbEntries) {

    const cwEntry = dbEntry.dataSources.CW;

    if (!cwEntry) continue;

    if (typeof cwEntry.matched !== `undefined`) {
      delete cwEntry.matched;
      continue;
    }

    const key = createKey(cwEntry);

    dbIndex.remove(key);
    entriesRemoved++;

  }

  cleanupSpinner.succeed(`Outdated entries removed.`);

  const writeSpinner = createSpinner(`Writing entries to database file.`).start();
  const entries      = Array.from(dbIndex.values()).flat();
  await writeNDJSON(dbPath, entries);
  writeSpinner.succeed(`Entries written to database file.`);

  console.info(`\n`);
  console.table({
    'Size of database prior to import:': originalDBSize,
    'Entries to import':                 cwEntries.length,
    'Entries updated:':                  entriesUpdated,
    'Entries added:':                    entriesAdded,
    'Entries removed:':                  entriesRemoved,
    'Net change in database size:':      entries.length - originalDBSize,
    'Size of database after import:':    entries.length,
  });

}
