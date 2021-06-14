/**
 * Create a human-readable key from a lemma
 * @param  {String} lemma The lemma, including hyphens
 * @return {String}       Returns a key with no spaces
 */
export default function createKey(lemma = '') {

  return lemma
  // normalize all characters into combining characters
  .normalize('NFC')
  // lowercase
  .toLowerCase()
  // replace whitespace with underscores
  .replace(/\s+/gu, '_');

}
