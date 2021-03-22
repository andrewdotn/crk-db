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

function processDialects(str) {
  // TODO:
  // note dialect information (\dl) - change to ISO 639-3
  // 7 \dl Cree: npC = Northern Plains Cree
  // 21681 \dl Cree: pC = Plains Cree
  // 20 \dl Cree: sC = Swampy Cree
  // 19 \dl Cree: wC = Woods Cree
  return str;
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
  dl: 'usages',
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
