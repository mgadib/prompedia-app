/**
 * Check production bundle: gzip size and absence of console/debugger.
 * Run after: npm run build
 * Usage: node scripts/check-bundle-size.mjs
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const BUDGET_KB = 250;

function getGzipSizeBytes(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf, { level: 9 }).length;
}

/** Fail if any JS asset contains console.* or debugger (production must be clean). */
function assertNoDevArtifacts(assetsDir) {
  const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  const violations = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(assetsDir, f), 'utf8');
    if (content.includes('console.') || content.includes('debugger')) {
      violations.push(f);
    }
  }
  if (violations.length > 0) {
    console.error(
      'Production bundle must not contain console.* or debugger. Found in:',
      violations.join(', ')
    );
    process.exit(1);
  }
}

function main() {
  const assetsDir = path.join(DIST, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('No dist/assets found. Run npm run build first.');
    process.exit(1);
  }

  assertNoDevArtifacts(assetsDir);

  const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += getGzipSizeBytes(path.join(assetsDir, f));
  }

  const totalKb = (totalBytes / 1024).toFixed(1);
  if (totalBytes > BUDGET_KB * 1024) {
    console.error(
      `Bundle gzip size ${totalKb} KB exceeds budget ${BUDGET_KB} KB.`
    );
    process.exit(1);
  }
  console.log(`Bundle gzip size: ${totalKb} KB (budget ${BUDGET_KB} KB).`);
}

main();
