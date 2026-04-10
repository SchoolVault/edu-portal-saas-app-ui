/**
 * Writes `public/config.json` for **production/static hosting** so the API base URL
 * can differ per deploy without rebuilding (set API_URL in CI).
 *
 * Not used for local mock vs backend — that is `src/environments/environment.ts` only.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
mkdirSync(publicDir, { recursive: true });

const apiUrl = (
  process.env.API_URL ||
  process.env.NG_APP_API_URL ||
  'http://localhost:8080/api/v1'
).replace(/\/$/, '');

const cfg = { apiUrl };
writeFileSync(join(publicDir, 'config.json'), JSON.stringify(cfg, null, 2) + '\n');
console.log('[write-frontend-config]', cfg);
