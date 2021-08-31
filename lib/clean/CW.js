#!/usr/bin/env node

import program      from 'commander';
import readToolbox  from '../utilities/readToolbox.js';
import writeToolbox from '../utilities/writeToolbox.js';

async function cleanCW(dbPath, outputPath) {
  const entries = await readToolbox(dbPath);
  entries.forEach(orderLines);
  await writeToolbox(outputPath, entries);
}

function orderLines(entry) {

  // preserve the existing order of these bunches of lines
  // - ps + def
  // - mrp + mrp2
  // - alt-s + altsp

  const senses = entry.lines
  .filter(line => line.type === `ps` || line.type === `def`);

  const morphemes = entry.lines
  .filter(line => line.type === `mrp` || line.type === `mrp2`);

  const altSp = entry.lines
  .filter(line => line.type === `alt-s` || line.type === `altsp`);

  const sources = entry.getLines(`src`);
  if (!sources.length) sources.push({ type: `src`, text: `` });

  // order the lines here
  // with few exceptions, always use getLines()
  // just in case there are extra, unintended lines
  entry.lines = [
    ...entry.getLines(`sro`),
    ...entry.getLines(`syl`),
    ...senses,
    ...entry.getLines(`dl`),
    ...entry.getLines(`gr1`),
    ...entry.getLines(`stm`),
    ...entry.getLines(`drv`),
    ...morphemes,
    ...entry.getLines(`alt`),
    ...altSp,
    ...entry.getLines(`rel`),
    ...entry.getLines(`sem`),
    ...entry.getLines(`gl`),
    ...entry.getLines(`cat`),
    ...entry.getLines(`his`),
    ...entry.getLines(`gr2`),
    ...entry.getLines(`??`),
    ...sources,
    entry.getLine(`new`),
    entry.getLine(`dt`),
  ]
  .filter(Boolean);

}

program
.arguments(`<dbPath> <outputPath>`)
.usage(`<dbPath> <outputPath>`)
.action(cleanCW);

program.parseAsync(process.argv);
