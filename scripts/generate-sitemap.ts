/**
 * Build script to generate sitemap.xml
 * Build-safe: never fails the build process, always creates a valid sitemap
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
    
    // generateAndSaveSitemap never throws - it always creates a valid sitemap
    // (either from database or fallback minimal sitemap)
    await generateAndSaveSitemap(outputPath);
    
    // Always exit successfully to not block the build process
    console.log('✅ Sitemap generation completed (build will continue)');
    process.exit(0);
  } catch (error) {
    // This should rarely happen since generateAndSaveSitemap handles errors internally
    // But if it does, log and continue build anyway
    console.error('⚠️  Unexpected error during sitemap generation:', error);
    console.warn('⚠️  Build will continue without sitemap');
    
    // Exit successfully to not block the build process
    // The build should continue even if sitemap generation fails
    process.exit(0);
  }
}

main();

