/**
 * Merges `src/assets/i18n/_rollout_add_{locale}_*.json` into `{locale}.json` (sorted by filename), then deletes the part files.
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(__dirname, '../src/assets/i18n');

function mergeLocale(code) {
  const targetPath = join(i18nDir, `${code}.json`);
  const parts = readdirSync(i18nDir)
    .filter(f => f.startsWith(`_rollout_add_${code}_`) && f.endsWith('.json'))
    .sort();
  if (!parts.length) {
    console.warn(`skip ${code}: no _rollout_add_${code}_*.json`);
    return;
  }
  const base = JSON.parse(readFileSync(targetPath, 'utf8'));
  for (const name of parts) {
    const add = JSON.parse(readFileSync(join(i18nDir, name), 'utf8'));
    for (const [k, v] of Object.entries(add)) {
      if (k in base) {
        console.warn(`warning: overwriting top-level key "${k}" in ${code}.json (${name})`);
      }
      base[k] = v;
    }
    unlinkSync(join(i18nDir, name));
  }
  writeFileSync(targetPath, JSON.stringify(base, null, 2) + '\n', 'utf8');
  console.log(`Merged ${parts.length} part(s) into ${code}.json`);
}

mergeLocale('en');
mergeLocale('hi');
