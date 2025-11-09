import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface HardcodedString {
  file: string;
  line: number;
  text: string;
  context: string;
}

interface TranslationKey {
  namespace: string;
  key: string;
  path: string[];
}

interface NamespaceCoverage {
  namespace: string;
  enKeys: Set<string>;
  idKeys: Set<string>;
  missingInId: string[];
  missingInEn: string[];
  coverage: number;
}

/**
 * Scan for hardcoded strings in TypeScript/TSX files
 */
function scanHardcodedStrings(): HardcodedString[] {
  const hardcodedStrings: HardcodedString[] = [];
  const srcDir = path.join(projectRoot, 'src');
  
  // Files to exclude (including AI instruction files)
  const excludeFiles = [
    /node_modules/,
    /\.test\./,
    /\.spec\./,
    /dist/,
    /build/,
    /\.d\.ts$/,
    /actions\.ts$/,  // AI instructions
    /modes\.ts$/,    // AI instructions
  ];
  
  // Patterns to match user-facing strings
  const stringPatterns = [
    // JSX text content: >Text< or >Text with spaces<
    /(?:>|\{)([A-Z][a-z]+(?:\s+[a-z]+){1,10})(?:<|\})/g,
    // String literals in JSX props: placeholder="...", title="...", aria-label="..."
    /(?:placeholder|title|aria-label|alt|label|description|text|content|message|error|success|warning|info)\s*=\s*["']([A-Z][^"']{3,})["']/gi,
    // String literals in JSX props (single quotes)
    /(?:placeholder|title|aria-label|alt|label|description|text|content|message|error|success|warning|info)\s*=\s*['"]([A-Z][^'"]{3,})['"]/gi,
    // Button text, labels in JSX: <Button>Text</Button>, <Label>Text</Label>
    /<(?:Button|Label|span|p|div|h[1-6]|a|li|td|th)[^>]*>([A-Z][a-z]+(?:\s+[a-z]+){1,10})<\/(?:Button|Label|span|p|div|h[1-6]|a|li|td|th)>/gi,
    // Error messages in throw/return
    /(?:throw\s+new\s+Error\(|return\s+['"])([A-Z][^'"]{5,})/g,
    // Validation messages
    /\.(?:min|max|email|refine)\([^,]+,\s*['"]([^'"]{5,})['"]/g,
    // Template literals with text (excluding t() calls)
    /`([A-Z][^`]{5,})`/g,
  ];
  
  function scanFile(filePath: string): void {
    // Skip excluded files
    if (excludeFiles.some(pattern => pattern.test(filePath))) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip comments, console.log, and translation function calls
      if (
        line.trim().startsWith('//') || 
        line.includes('console.') ||
        line.includes("t('") ||
        line.includes('t("') ||
        line.includes("getErrorMessage") ||
        line.includes("getValidationMessage") ||
        line.includes("getCommonMessage") ||
        line.includes("getSuccessMessage")
      ) {
        return;
      }
      
      // Check for hardcoded strings
      stringPatterns.forEach(pattern => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const text = match[1] || match[0];
          // Filter out common false positives
          if (
            text &&
            text.length > 3 &&
            !text.includes('http') &&
            !text.includes('https') &&
            !text.includes('@') &&
            !text.match(/^[A-Z_]+$/) && // Constants
            !text.includes('node_modules') &&
            !text.includes('import') &&
            !text.includes('export') &&
            !text.includes('className') &&
            !text.includes('className=') &&
            !text.includes('src=') &&
            !text.includes('href=') &&
            !text.includes('id=') &&
            !text.includes('key=') &&
            !text.match(/^[a-z]+:\/\//) && // URLs
            !text.match(/^#[0-9a-fA-F]{3,6}$/) && // Hex colors
            !text.match(/^\d+$/) && // Numbers only
            !text.match(/^[A-Z][a-z]+$/) && // Single word (likely variable)
            !text.includes('${') // Template literal with interpolation
          ) {
            hardcodedStrings.push({
              file: path.relative(projectRoot, filePath),
              line: index + 1,
              text: text.substring(0, 80),
              context: line.trim().substring(0, 120),
            });
          }
        }
      });
    });
  }
  
  function walkDir(dir: string): void {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!excludeFiles.some(pattern => pattern.test(filePath))) {
          walkDir(filePath);
        }
      } else if (
        (file.endsWith('.ts') || file.endsWith('.tsx')) &&
        !excludeFiles.some(pattern => pattern.test(filePath))
      ) {
        scanFile(filePath);
      }
    });
  }
  
  walkDir(srcDir);
  
  return hardcodedStrings;
}

/**
 * Load translation JSON file
 */
function loadTranslationFile(filePath: string): Record<string, any> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
}

/**
 * Extract all keys from a nested object
 */
function extractKeys(obj: Record<string, unknown>, prefix: string[] = []): Set<string> {
  const keys = new Set<string>();
  
  function traverse(current: unknown, path: string[]): void {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      Object.keys(current).forEach(key => {
        const newPath = [...path, key];
        const fullKey = newPath.join('.');
        keys.add(fullKey);
        traverse((current as Record<string, unknown>)[key], newPath);
      });
    }
  }
  
  traverse(obj, prefix);
  return keys;
}

/**
 * Analyze translation coverage
 */
function analyzeTranslationCoverage(): NamespaceCoverage[] {
  const localesDir = path.join(projectRoot, 'src', 'locales');
  const namespaces = ['common', 'errors', 'success', 'auth', 'prompt', 'library', 'modes', 'actions', 'validation'];
  const languages = ['en', 'id'];
  
  const coverage: NamespaceCoverage[] = [];
  
  namespaces.forEach(namespace => {
    const enFile = path.join(localesDir, 'en', `${namespace}.json`);
    const idFile = path.join(localesDir, 'id', `${namespace}.json`);
    
    const enExists = fs.existsSync(enFile);
    const idExists = fs.existsSync(idFile);
    
    if (!enExists && !idExists) {
      return; // Skip if namespace doesn't exist in either language
    }
    
    const enData = enExists ? loadTranslationFile(enFile) : {};
    const idData = idExists ? loadTranslationFile(idFile) : {};
    
    const enKeys = extractKeys(enData);
    const idKeys = extractKeys(idData);
    
    const missingInId = Array.from(enKeys).filter(key => !idKeys.has(key));
    const missingInEn = Array.from(idKeys).filter(key => !enKeys.has(key));
    
    const totalKeys = Math.max(enKeys.size, idKeys.size);
    const coveredKeys = Math.min(enKeys.size, idKeys.size);
    const coveragePercent = totalKeys > 0 ? (coveredKeys / totalKeys) * 100 : 0;
    
    coverage.push({
      namespace,
      enKeys,
      idKeys,
      missingInId,
      missingInEn,
      coverage: coveragePercent,
    });
  });
  
  return coverage;
}

/**
 * Main audit function
 */
function runAudit(): void {
  console.log('🔍 Starting i18n Audit...\n');
  
  // 1. Scan for hardcoded strings
  console.log('1. Scanning for hardcoded strings...');
  const hardcodedStrings = scanHardcodedStrings();
  console.log(`   Found ${hardcodedStrings.length} potential hardcoded strings\n`);
  
  // 2. Analyze translation coverage
  console.log('2. Analyzing translation coverage...');
  const coverage = analyzeTranslationCoverage();
  
  let totalKeys = 0;
  let totalCovered = 0;
  
  coverage.forEach(ns => {
    const nsTotal = Math.max(ns.enKeys.size, ns.idKeys.size);
    const nsCovered = Math.min(ns.enKeys.size, ns.idKeys.size);
    totalKeys += nsTotal;
    totalCovered += nsCovered;
    
    console.log(`   ${ns.namespace}: ${nsCovered}/${nsTotal} keys (${ns.coverage.toFixed(1)}%)`);
    if (ns.missingInId.length > 0) {
      console.log(`     Missing in ID: ${ns.missingInId.length} keys`);
    }
    if (ns.missingInEn.length > 0) {
      console.log(`     Missing in EN: ${ns.missingInEn.length} keys`);
    }
  });
  
  const overallCoverage = totalKeys > 0 ? (totalCovered / totalKeys) * 100 : 0;
  console.log(`\n   Overall coverage: ${totalCovered}/${totalKeys} keys (${overallCoverage.toFixed(1)}%)\n`);
  
  // Group by file for better organization
  const byFile: Record<string, HardcodedString[]> = {};
  hardcodedStrings.forEach(str => {
    if (!byFile[str.file]) {
      byFile[str.file] = [];
    }
    byFile[str.file].push(str);
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    hardcodedStrings: {
      count: hardcodedStrings.length,
      samples: hardcodedStrings.slice(0, 50), // First 50 samples
      byFile: Object.keys(byFile).map(file => ({
        file,
        count: byFile[file].length,
        strings: byFile[file].slice(0, 10) // First 10 per file
      }))
    },
    translationCoverage: {
      overall: overallCoverage,
      byNamespace: coverage.map(ns => ({
        namespace: ns.namespace,
        coverage: ns.coverage,
        enKeys: ns.enKeys.size,
        idKeys: ns.idKeys.size,
        missingInId: ns.missingInId.length,
        missingInEn: ns.missingInEn.length,
      })),
    },
  };
  
  const reportPath = path.join(projectRoot, 'i18n-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Report saved to: ${reportPath}`);
  
  // Print summary
  console.log('\n📋 Summary:');
  console.log(`   Hardcoded strings: ${hardcodedStrings.length}`);
  console.log(`   Translation coverage: ${overallCoverage.toFixed(1)}%`);
  console.log(`   Namespaces analyzed: ${coverage.length}`);
}

// Run audit
runAudit();

