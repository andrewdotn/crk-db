import { fileURLToPath }          from 'url';
import { promises as fsPromises } from 'fs';

import {
  dirname as getDirname,
  join as joinPath,
} from 'path';

const { readFile } = fsPromises;

const __dirname = getDirname(fileURLToPath(import.meta.url));

const markerRegExp = /\\(?<marker>\S+)\s/gsu;

void async function getUniqueMarkers() {

  const data = await readFile(joinPath(__dirname, `../data/Wolvengrey.toolbox`), `utf8`);

  const matchObjects = data.matchAll(markerRegExp);
  const matches = Array.from(matchObjects).map(info => info.groups.marker);
  const uniqueMatches = new Set(matches);
  console.log(Array.from(uniqueMatches));

}();
