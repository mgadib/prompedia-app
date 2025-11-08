/**
 * Build script to generate sitemap.xml
 * Run with: tsx scripts/generate-sitemap.ts
 * Or: npm run generate:sitemap
 */

import { generateAndSaveSitemap } from '../src/lib/sitemap-generator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    console.log('🚀 Generating sitemap...');
    const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
    await generateAndSaveSitemap(outputPath);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

main();

