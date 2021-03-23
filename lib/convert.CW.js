/* eslint-disable
  no-param-reassign,
*/

import convert from '@digitallinguistics/toolbox2json';

const accentedNRegExp = /ń/gu; // U+0144
const accentedYRegExp = /ý/gu; // U+00FD
const sroCharsRegExp  = /^(?:[-êiîoôaâptkcmnshwy]|\s)+$/u;

const mappings = {
  def: `definition`,
  dl:  `dialects`,
  syl: `syllabics`,
};

const transforms = {
  dl:  processDialects,
  sro: processSRO,
};

/**
 * Create a human-readable key from a lemma
 * @param  {String} lemma The lemma, including hyphens
 * @return {String}       Returns an ASCII key with no spaces or hyphens
 */
function createKey(lemma = ``) {

  // finds non-combining character followed by combining character
  const combiningRegExp = /(?<char>\P{Mark})(?<combiner>\p{Mark}+)/gu;

  return lemma
  // denormalize all characters into combining characters
  .normalize(`NFD`)
  // remove combining characters
  .replace(combiningRegExp, `$1`)
  // remove hyphens
  .replace(/-/gu, ``)
  // replace whitespace with underscores
  .replace(/\s+/gu, `_`);

}

function hasWhitespace(str) {
  return /\s/u.test(str);
}

function isValidSRO(str) {
  return sroCharsRegExp.test(str);
}

function postprocessor({
  definition,
  dialects,
  sro,
  syllabics,
  test,
}) {

  const entry = {
    definition,
    dialects,
    forms: [],
    lemma: {
      sro,
      syll: syllabics,
    },
    senses: [],
    test,
  };

  return processDefinition(entry);

}

function processDefinition(entry) {

  const sense = { definition: entry.definition };

  // extract cross-references: [see XXX …]
  const result = /^(?<textBefore>.+)\[see\s+(?<crossRefText>.+)\s*\](?<textAfter>.*)$/gu.exec(entry.definition);

  if (result) {

    const { textBefore, textAfter, crossRefText } = result.groups;

    // strip cross-reference from definition
    sense.definition = [textBefore, textAfter]
    .map(text => text.trim())
    .join(``);

    // if the cross-reference text is multiple words, we can't assume it's a headword
    // save it as a general note instead
    // otherwise treat it as a headword and save it as a cross-reference lexical relation
    if (hasWhitespace(crossRefText)) {

      entry.notes = [
        {
          noteType: `general`,
          text:     `see ${crossRefText}`,
        },
      ];

    } else {

      entry.lexicalRelations = [
        {
          key:      createKey(crossRefText),
          lemma:    { sro: crossRefText },
          relation: `crossRef`,
        },
      ];

    }

  }

  entry.senses.push(sense);

  return entry;

}

function processDialects(input) {

  const dialects = Array.isArray(input) ? input : [input];

  return dialects.map(dialect => {
    if (dialect.includes(`npC`)) return `nort2960`;
    if (dialect.includes(`pC`)) return `plai1258`;
    if (dialect.includes(`sC`)) return `swam1239`;
    if (dialect.includes(`wC`)) return `wood1236`;
    return `unknown`;
  });

}

function processSRO(string) {
  return [string]
  .map(str => str.normalize())
  .map(str => str.replace(accentedNRegExp, 'y'))
  .map(str => str.replace(accentedYRegExp, 'y'))
  .map(str => {
    validateSROChars(str);
    return str;
  })[0];
}

function validateSROChars(str) {
  if (!isValidSRO(str)) {
    Array.from(str).forEach((char, i) => {
      if (!isValidSRO(char)) {
        throw new Error(`Character <${char}> at position ${i} is invalid`);
      }
    });
  }
}

export default function convertCW(inputPath, outputPath) {

  if (!inputPath) {
    throw new Error(`Please provide the path to the CW database as the first argument.`);
  }

  if (!outputPath) {
    throw new Error(`Please provide the path where you would like the converted file generated as the second argument`);
  }

  return convert(inputPath, {
    mappings,
    out:        outputPath,
    parseError: `object`,
    postprocessor,
    transforms,
  });

}
