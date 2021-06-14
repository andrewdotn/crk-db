/**
 * This file exports a single function `convertCW` which converts the CW source to DLx JSON format.
 */

/* eslint-disable
  class-methods-use-this,
*/

import Index                             from '../utilities/DatabaseIndex.js';
import convert                           from '@digitallinguistics/toolbox2json';
import createHomographKey                from '../utilities/createHomographKey.js';
import { stringify as createJSONStream } from 'ndjson';
import createKey                         from '../utilities/createKey.js';
import { createWriteStream }             from 'fs';
import sro2plains                        from '../utilities/sro2plains.js';

/**
 * Add a note to an object's "notes" array.
 * @param {Object} note   The Note object to add
 * @param {Object} object The object to add the note to
 */
function addNote(note, object) {
  object.notes = object.notes ?? [];
  object.notes.push(note);
}

/**
 * Accepts a single definition (not multiple definitions with semicolons) and returns an object with "definition" and "parenthetical" properties. The definition will have the text of the parenthetical stripped from it.
 * @param  {String} definition The definition to extract parentheticals from.
 * @return {Object}            Returns an object with "definition" and "parenthetical" properties. "parenthetical" may be undefined.
 */
function extractParenthetical(definition) {

  const parentheticalRegExp = /^(?<textBefore>.*)\[(?<parenthetical>.+)\](?<textAfter>.*)/u;
  const parentheticalMatch  = definition.match(parentheticalRegExp);

  if (!parentheticalMatch) return { definition };

  const { parenthetical, textBefore, textAfter } = parentheticalMatch.groups;

  return {
    definition:    [textBefore, textAfter].map(str => str.trim()).join(''),
    parenthetical: parenthetical.trim(),
  };

}

/**
 * Checks whether a string contains white space.
 * @param  {String}  str The string to check
 * @return {Boolean}
 */
function hasWhitespace(str) {
  return /\s/u.test(str);
}

/**
 * Strips the provided text from a string and returns the new string.
 * @param  {String} string The string to strip text from.
 * @param  {String} remove The text to strip from the string.
 * @return {String}        Returns the new string, with the desired text stripped from it.
 */
function stripText(string, remove) {
  return string.replace(remove, '').trim();
}

/**
 * Writes the entries Array to a JSON file.
 * @param {String} outputPath The path where the JSON data should be written.
 * @param {Array}  entries    The Array of entries to write to the file.
 */
function writeEntries(outputPath, entries) {
  return new Promise((resolve, reject) => {

    const jsonStream  = createJSONStream();
    const writeStream = createWriteStream(outputPath);

    jsonStream.on('error', reject);
    writeStream.on('finish', resolve);
    writeStream.on('close', resolve);
    writeStream.on('error', reject);

    jsonStream.pipe(writeStream);

    entries.forEach(entry => jsonStream.write(entry));

    jsonStream.end();

  });
}

/**
 * A class representing a CW database entry.
 */
class Entry {

  /**
   * Create a new Entry (a DLx Lexeme object).
   * @param {Object} data The data for the entry, returned from the toolbox2json library.
   */
  constructor({
    def = '',
    dl  = [],
    gl  = [],
    ps,
    sro  = '',
    syl  = '',
    test,
    stm
  }) {

    this.definition = def; // original definition
    this.dialects   = dl;
    this.glosses    = Array.isArray(gl) ? gl : [gl];
    this.pos        = ps;
    this.test       = test;

    this.lemma = {
      plains: sro2plains(sro), // SRO transcription specific to Plains Cree (without <ý> or <ń>)
      sro:    sro.normalize(), // original SRO (cross-dialectal) transcription, Unicode-normalized
      syll:   syl,             // original syllabic transcription
    };

    this.stm = (stm instanceof Array ? stm.join(" ") : stm);

    this.cleanDialects();
    this.splitDefinition();
    this.cleanDefinitions();

  }

  /**
   * Adds a note to the entry.
   * @param {String} note The text of the note to add
   */
  addNote(note) {
    addNote(note, this);
  }

  /**
   * Extracts any parentheticals and other notes from the sense definitions and moves them to other fields as appropriate.
   */
  cleanDefinitions() {

    // Structure of Definitions
    // ====
    // Definitions may contain multiple parentheticals, in [brackets].
    // Parentheticals may themselves contain multiple notes, separated by semicolons.
    // Some notes are associated with the entire entry.
    // Other notes are associated with the particular definition they're in.

    this.senses.forEach(sense => {

      // extract any parentheticals from the definitions
      const { definition, parenthetical } = extractParenthetical(sense.definition);

      // use the new, cleaned definition for the sense
      sense.definition = definition;

      // divide any parentheticals into separate notes and process each note
      if (parenthetical) {
        const notes = parenthetical.split(';').map(str => str.trim());
        notes.forEach(note => this.processNote(note, sense));
      }

      // also extract any definitions that are actually unbracketed parentheticals
      this.processNote(sense.definition, sense);

    });

    // remove any senses with empty definitions,
    this.senses = this.senses.filter(({ definition }) => definition);

    // remove any senses whose definition match the text of a note
    this.senses = this.senses.filter(({ definition, notes = [] }) => {
      const matchedNote = notes.find(({ text }) => text === definition);
      return !matchedNote;
    });

  }

  /**
   * Reformats the "dialects" property.
   */
  cleanDialects() {

    let { dialects } = this;
    if (!dialects) return;
    dialects = Array.isArray(dialects) ? dialects : [dialects];

    this.dialects = dialects.map(dialect => {
      if (dialect.includes('npC')) return 'nort2960';
      if (dialect.includes('pC')) return 'plai1258';
      if (dialect.includes('sC')) return 'swam1239';
      if (dialect.includes('wC')) return 'wood1236';
      return 'unknown';
    });

  }

  /**
   * Extract the cross-reference from a note if present and save it to the entry / sense as appropriate.
   * @param {String} noteText The text of the note.
   * @param {Object} sense    The Sense associated with this note.
   */
  extractCrossReference(noteText, sense) {

    const crossRefRegExp = /(?<relationType>see|cf\.)\s(?<crossRefText>.+)\s*$/u;
    const match          = noteText.match(crossRefRegExp);

    if (!match) return;

    const { crossRefText, relationType } = match.groups;

    // strip cross-reference from the definition
    const [parenthetical] = match;
    sense.definition = stripText(sense.definition, parenthetical);

    // if the cross-reference text is multiple words, we can't assume it's a headword
    // save it as a general note instead
    // otherwise treat it as a headword and save it as a cross-reference lexical relation
    if (hasWhitespace(crossRefText)) {

      const note = {
        noteType: 'general',
        text:     noteText,
      };

      this.addNote(note);

    } else {

      const crossReference = {
        key:      createKey(crossRefText), // NOTE: this is not homograph-aware
        lemma:    { sro: crossRefText },
        relation: relationType === 'see' ? 'crossReference' : 'compare',
      };

      // NOTE: Cross-references are saved to the entry rather than the sense,
      // even though Arok's intention may sometimes have been to associate
      // cross-references with specific senses.
      this.lexicalRelations = this.lexicalRelations ?? [];
      this.lexicalRelations.push(crossReference);

    }

  }

  /**
   * Extract the note and save it to the sense
   * @param  {String} noteText
   * @param  {Object} sense
   */
  extractGeneralNote(noteText, sense) {

    // if you're looking at a plain definition, do nothing
    if (noteText === sense.definition) return;

    // otherwise, add a general note
    const note = {
      noteType: 'general',
      text:     noteText,
    };

    // if definition is empty, add note to entry
    // otherwise add it to the sense
    addNote(note, sense.definition ? sense : this);

  }

  /**
   * Extract the Latin term and save it to the sense
   * @param  {String} noteText
   * @param  {Object} sense
   */
  extractLatinTerm(noteText, sense) {

    const latinTermRegExp = /^(?:Lt[:.]|Latin:?)\s+(?<scientificName>.+)\s*$/u;
    const match           = noteText.match(latinTermRegExp);

    if (!match) return;

    // strip scientific term from the definition
    const [parenthetical] = match;
    sense.definition = stripText(sense.definition, parenthetical);

    sense.scientificName = match.groups.scientificName;

  }

  /**
   * Extract the literal definition from a note and save it to the entry
   * @param {String} noteText The text of the note
   * @param {Object} sense    The Sense associated with this note
   */
  extractLiteralDefinition(noteText, sense) {

    const literalDefinitionRegExp = /^(?:lit[:.]{1,2}|literally:?)\s+(?<literalDefinition>.+)\s*$/u;
    const match                   = noteText.match(literalDefinitionRegExp);

    if (!match) return;

    // strip literal definition from the definition
    const [parenthetical] = match;
    sense.definition = stripText(sense.definition, parenthetical);

    let { literalDefinition } = match.groups;

    // remove leading and trailing quotes
    literalDefinition = literalDefinition
    .replace(/^['"]/u, '')
    .replace(/['"]$/u, '');

    this.literalMeaning = literalDefinition;

  }

  /**
   * Extract the usage note and save it to the sense
   * @param  {String} noteText
   * @param  {Object} sense
   */
  extractUsageNote(noteText, sense) {

    const usageRegExp = /^(?<usage>.+):$/u;
    const match       = noteText.match(usageRegExp);

    if (!match) return;

    // strip usage note from the definition
    const [parenthetical] = match;
    sense.definition = stripText(sense.definition, parenthetical);

    const { usage } = match.groups;

    sense.usages = sense.usages ?? [];
    sense.usages.push(usage.trim());

  }

  /**
   * Determines the type of note, and adds the information to either the entry or the sense as appropriate.
   * @param  {String} noteText The text of the note (parenthetical)
   * @param  {Object} sense    The Sense object associated with this note
   */
  processNote(...args) {
    this.extractCrossReference(...args);
    this.extractLiteralDefinition(...args);
    this.extractLatinTerm(...args);
    this.extractUsageNote(...args);
    this.extractGeneralNote(...args);
  }

  /**
   * Splits the original definition into multiple definitions based on semicolons, while taking into account that parentheticals may contain semicolons as well.
   * @param  {String} [input=''] The original definition from the Toolbox file
   * @return {Array}             Returns an Array of definitions.
   */
  splitDefinition() {

    let { definition } = this;

    if (!definition) {
      this.senses = [];
      return;
    }

    if (Array.isArray(definition)) {
      definition = definition.join('; ');
    }

    const chunks            = definition.split(';').map(str => str.trim());
    let   currentDefinition = [];
    let   inParenthetical   = false;

    this.senses = chunks.reduce((defs, chunk) => {

      const hasOpeningBracket = chunk.includes('[');
      const hasClosingBracket = chunk.includes(']');

      currentDefinition.push(chunk);

      // in the middle of a parenthetical
      if (hasOpeningBracket && !hasClosingBracket) inParenthetical = true;

      // parenthetical is complete
      if (!hasOpeningBracket && hasClosingBracket) inParenthetical = false;

      // unless in the middle of a parenthetical,
      // push the current definition to the definitions array
      if (!inParenthetical) {
        defs.push(currentDefinition.join('; '));
        currentDefinition = [];
      }

      return defs;

    }, [])
    .map(def => ({ definition: def }));

  }

}

export default async function convertCW(inputPath, outputPath, { silent = false } = {}) {

  if (!inputPath) {
    throw new Error('Please provide the path to the *Cree: Words* Toolbox database as the first argument.');
  }

  const rawEntries  = await convert(inputPath, { parseError: 'object', silent });
  const parseErrors = rawEntries.filter(entry => entry.name === 'ParseError');

  const entries = rawEntries
  .filter(entry => entry.name !== 'ParseError')
  .map(entry => new Entry(entry));

  const primaryIndex     = new Index(entries, (entry, index) => createHomographKey(entry.lemma.sro, index));
  const duplicateRecords = entries.length - primaryIndex.size;

  for (const [key, entry] of primaryIndex) {
    entry.key = key;
  }

  const dbEntries = Array.from(primaryIndex.values());
  dbEntries.push(...parseErrors);

  if (outputPath) await writeEntries(outputPath, dbEntries);

  if (!silent) {
    console.info('\n');
    /* eslint-disable sort-keys */
    console.table({
      'Records converted': rawEntries.length,
      'Parsing errors':    parseErrors.length,
      'Duplicate records': duplicateRecords,
      'Total entries':     dbEntries.length,
    });
  }

  return entries;

}
