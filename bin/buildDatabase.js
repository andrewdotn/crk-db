#!/usr/bin/env node

import buildDatabase from '../lib/buildDatabase.js';
import program from "commander";

program
    .option('--no-spinners', `don’t create spinners`)
    .action(buildDatabase);

program.parse(process.argv);
