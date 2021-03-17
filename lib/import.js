import convert           from '@digitallinguistics/toolbox2json';
import { fileURLToPath } from 'url';
import path              from 'path';

const currentDir  = path.dirname(fileURLToPath(import.meta.url));
const toolboxPath = path.join(currentDir, `../data/Wolvengrey.toolbox.sample`);

function processSRO(input) {
  return input.normalize();
}

// TODO:
// NFC normalize
// validate characters in SRO
// note dialect information (\dl) - change to ISO 639-3
// Converts 'ý' and 'ń' in the Standard Roman Orthography with their Plains Cree appropriate letters.
// Add code comments for each referenced unicode point
// Errata (separate JSON file) - might not need to do this if we don't see any errata!

const transforms = {
  sro: processSRO,
};

async function convertToolbox() {

  convert(toolboxPath, { out: `data/Wolvengrey.json`, transforms });

}

convertToolbox()
.catch(e => { throw e; });
