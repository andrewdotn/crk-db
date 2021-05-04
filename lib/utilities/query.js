import loadEntries from '../lib/utilities/loadEntries.js';

const entries = await loadEntries('data/database.ndjson')

const parseErrors = entries.filter(entry => entry.name === `ParseError`)

console.log(parseErrors);
