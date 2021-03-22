import convert from '@digitallinguistics/toolbox2json';

const accentedNRegExp = /ń/gu; // U+0144
const accentedYRegExp = /ý/gu; // U+00FD
const sroCharsRegExp  = /^(?:[-êiîoôaâptkcmnshwy]|\s)+$/u;

function isValidSRO(str) {
  return sroCharsRegExp.test(str);
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

const mappings = {
  dl:  `dialects`,
  syl: `syllabics`,
};

const transforms = {
  dl:  processDialects,
  sro: processSRO,
};

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
    transforms,
  });

}
