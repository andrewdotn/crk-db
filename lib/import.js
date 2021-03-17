import convert           from '@digitallinguistics/toolbox2json';
import { fileURLToPath } from 'url';
import path              from 'path';

const currentDir  = path.dirname(fileURLToPath(import.meta.url));
const toolboxPath = path.join(currentDir, `../Wolvengrey.toolbox.sample`);

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
  return str;
}

function processSRO(string) {
  return [string]
  .map(str => str.normalize())
  .map(str => str.replace(accentedNRegExp, `y`))
  .map(str => str.replace(accentedYRegExp, `y`))
  .map(str => {
    validateSROChars(str);
    return str;
  });
}

// TODO:
// note dialect information (\dl) - change to ISO 639-3

const mappings = {
  dl: `usages`,
};

const transforms = {
  dl:  processDialects,
  sro: processSRO,
};

async function convertToolbox() {

  convert(toolboxPath, {
    out: `sample.json`,
    mappings,
    transforms,
  });

}

convertToolbox()
.catch(e => { throw e; });
