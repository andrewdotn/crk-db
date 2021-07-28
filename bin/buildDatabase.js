#!/usr/bin/env node

import buildDatabase from '../lib/buildDatabase.js';
import program from "commander";

program
    .action(buildDatabase);

program.parseAsync(process.argv);
