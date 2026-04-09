/**
 * Writes frontend/public/config.json before `ng build` / `ng serve`.
 * Render (or CI): set API_URL to your backend, e.g. https://schoolvault-api.onrender.com/api/v1
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
mkdirSync(publicDir, { recursive: true });

const apiUrl =
  process.env.API_URL ||
  process.env.NG_APP_API_URL ||
  'http://localhost:8080/api/v1';
const useMocks = String(process.env.USE_MOCKS || '').toLowerCase() === 'true';

const cfg = { apiUrl: apiUrl.replace(/\/$/, ''), useMocks };
writeFileSync(join(publicDir, 'config.json'), JSON.stringify(cfg, null, 2) + '\n');
console.log('[write-frontend-config]', cfg);
