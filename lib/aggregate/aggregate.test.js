import aggregateEntries  from './index.js';
import { expect }        from 'chai';
import { fileURLToPath } from 'url';
import fs                from 'fs-extra';
import getTestEntry      from '../../test/getTestEntry.js';

import {
  dirname as getDirname,
  join    as joinPath,
} from 'path';

const { remove } = fs;

describe(`aggregate entries`, function() {

  const currentDir = getDirname(fileURLToPath(import.meta.url));
  const dbPath     = joinPath(currentDir, `./aggregate.test.ndjson`);
  const outPath    = joinPath(currentDir, `./out.test.ndjson`);

  before(async function() {
    this.entries = await aggregateEntries(dbPath, outPath);
  });

  after(async function() {
    await remove(outPath);
  });

  it(`head`, function() {
    const entry = getTestEntry(this.entries, this.test.title);
    expect(entry.lemma.sro).to.equal(`awahêk`);
    expect(entry.head.sro).to.equal(`awahêk!`);
  });

  it(`lemma`, function() {
    const entry = getTestEntry(this.entries, this.test.title);
    expect(entry.lemma.proto).to.equal(`amiskwâýow`);
    expect(entry.lemma.sro).to.equal(`amiskwâyow`);
    expect(entry.lemma.syll).to.equal(`ᐊᒥᐢᑳᐧᔪᐤ`);
  });

  it(`POS`, function() {
    const entry = getTestEntry(this.entries, this.test.title);
    expect(entry.pos).to.equal(`NA-1`);
  });

  describe(`senses`, function() {

    it(`matchType: broad`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(3);

      const sense1 = senses.find(sense => sense.definition === `s/he pulls s.o. from the water`);
      const sense2 = senses.find(sense => sense.definition === `s/he drags s.o. out of the water`);
      const sense3 = senses.find(sense => sense.definition === `He pulls him out of the fire or water.`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`CW`);
      expect(sense3.source).to.equal(`MD`);

    });

    it(`matchType: conjugation`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(2);

      const sense1 = senses.find(sense => sense.definition === `s/he has a misconception`);
      const sense2 = senses.find(sense => sense.definition === `s/he is mistaken`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`CW`);

    });

    it(`matchType: dialect`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(2);

      const sense1 = senses.find(sense => sense.definition === `squirrel`);
      const sense2 = senses.find(sense => sense.definition === `gopher`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`CW`);

    });

    it(`matchType: different`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(1);

      const [sense] = senses;

      expect(sense.definition).to.equal(`s/he thinks more of s.t., s/he prefers s.t., s/he regards s.t. more highly, s/he favours s.t.`);
      expect(sense.source).to.equal(`CW`);

    });

    it(`matchType: equivalent`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(2);

      const sense1 = senses.find(sense => sense.definition === `s/he puts s.o. (s.w.), s/he places s.o.`);
      const sense2 = senses.find(sense => sense.definition === `s/he sets s.o. down`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`CW`);

    });

    it(`matchType: Err/Orth`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(1);

      const [sense] = senses;

      expect(sense.definition).to.equal(`s/he tells on s.o., s/he tattle on s.o., s/he rats on s.o.`);
      expect(sense.source).to.equal(`CW`);

    });

    // NOTE: There are currently no entries with matchType: lemma

    it(`matchType: narrow`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(2);

      const sense1 = senses.find(sense => sense.definition === `arrow, little arrow`);
      const sense2 = senses.find(sense => sense.definition === `An arrow.`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`MD`);

    });

    // NOTE: There are currently no entries with matchType: PV

    it(`matchType: same`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(1);

      const [sense] = senses;

      expect(sense.definition).to.equal(`star, little star`);
      expect(sense.source).to.equal(`CW`);

    });

    it(`matchType: similar`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(2);

      const sense1 = senses.find(sense => sense.definition === `even, possibly`);
      const sense2 = senses.find(sense => sense.definition === `or, or else`);

      expect(sense1.source).to.equal(`CW`);
      expect(sense2.source).to.equal(`CW`);

    });

    it(`programmatic match`, function() {

      const { senses } = getTestEntry(this.entries, this.test.title);

      expect(senses).to.have.lengthOf(1);

      const [sense] = senses;

      expect(sense.definition).to.equal(`s/he pastes s.t. on (the wall)`);
      expect(sense.source).to.equal(`CW`);

    });

  });


});
