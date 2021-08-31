import { createWriteStream } from 'fs';

export default async function writeToolbox(outPath, entries) {
  return new Promise((resolve, reject) => {

    const compiled = entries.map(entry => entry.compile());

    const writeStream = createWriteStream(outPath);

    writeStream.on(`finish`, resolve);
    writeStream.on(`error`, reject);

    writeStream.write(`${ entries.header }\r\n\r\n`);

    for (const entry of compiled) {
      writeStream.write(`${ entry }\r\n`);
    }

    writeStream.end();

  });
}
