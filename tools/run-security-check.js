import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  console.log('🔒 .env found — running security checks...');
  const res = spawnSync(process.execPath, [path.join(__dirname, 'security-check.js')], { stdio: 'inherit' });
  process.exit(res.status);
} else {
  console.log('⚠️  .env not found — skipping security checks.');
  process.exit(0);
}
