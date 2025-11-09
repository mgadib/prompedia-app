import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Test missing key fallback behavior
 */
function testMissingKeyFallback(): {
  hasReturnEmptyString: boolean;
  hasReturnNull: boolean;
  hasFallbackLng: boolean;
  fallbackLng: string | null;
} {
  const i18nFile = path.join(projectRoot, 'src', 'lib', 'i18n.ts');
  const content = fs.readFileSync(i18nFile, 'utf-8');
  
  return {
    hasReturnEmptyString: content.includes('returnEmptyString'),
    hasReturnNull: content.includes('returnNull'),
    hasFallbackLng: content.includes('fallbackLng'),
    fallbackLng: content.match(/fallbackLng:\s*['"]([^'"]+)['"]/)?.[1] || null,
  };
}

/**
 * Check if language switch reloads page
 */
function checkLanguageSwitch(): {
  usesChangeLanguage: boolean;
  hasPageReload: boolean;
  persistsToLocalStorage: boolean;
} {
  const useLanguageFile = path.join(projectRoot, 'src', 'shared', 'hooks', 'useLanguage.ts');
  const content = fs.readFileSync(useLanguageFile, 'utf-8');
  
  return {
    usesChangeLanguage: content.includes('changeLanguage'),
    hasPageReload: content.includes('window.location') || content.includes('location.reload'),
    persistsToLocalStorage: content.includes('localStorage.setItem'),
  };
}

/**
 * Check bundle configuration for i18n
 */
function checkBundleConfig(): {
  hasI18nChunk: boolean;
  chunkName: string | null;
} {
  const viteConfigFile = path.join(projectRoot, 'vite.config.ts');
  const content = fs.readFileSync(viteConfigFile, 'utf-8');
  
  const i18nChunkMatch = content.match(/i18next.*?return\s+['"]([^'"]+)['"]/s);
  
  return {
    hasI18nChunk: content.includes('i18next') && content.includes('i18n-vendor'),
    chunkName: i18nChunkMatch?.[1] || 'i18n-vendor',
  };
}

/**
 * Check for TypeScript types for translation keys
 */
function checkTypeSafety(): {
  hasTranslationTypes: boolean;
  hasKeyConstants: boolean;
  typeFiles: string[];
} {
  const srcDir = path.join(projectRoot, 'src');
  const typeFiles: string[] = [];
  
  function scanForTypes(dir: string): void {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        scanForTypes(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (
          content.includes('TranslationKey') ||
          content.includes('TranslationKeys') ||
          content.includes('type.*translation') ||
          (content.includes('namespace:') && content.includes('key:'))
        ) {
          typeFiles.push(path.relative(projectRoot, filePath));
        }
      }
    });
  }
  
  scanForTypes(srcDir);
  
  const constantsFile = path.join(projectRoot, 'src', 'lib', 'constants.ts');
  const hasKeyConstants = fs.existsSync(constantsFile) && 
    fs.readFileSync(constantsFile, 'utf-8').includes('ERROR_MESSAGE_KEYS');
  
  return {
    hasTranslationTypes: typeFiles.length > 0,
    hasKeyConstants,
    typeFiles,
  };
}

// Run tests
console.log('🧪 Running i18n Tests...\n');

const missingKeyTest = testMissingKeyFallback();
console.log('Missing Key Fallback:');
console.log(`  fallbackLng: ${missingKeyTest.fallbackLng || 'not found'}`);
console.log(`  returnEmptyString: ${missingKeyTest.hasReturnEmptyString}`);
console.log(`  returnNull: ${missingKeyTest.hasReturnNull}`);
console.log(`  ⚠️  Note: i18next returns key string by default if not configured\n`);

const languageSwitchTest = checkLanguageSwitch();
console.log('Language Switch:');
console.log(`  uses changeLanguage: ${languageSwitchTest.usesChangeLanguage}`);
console.log(`  page reload: ${languageSwitchTest.hasPageReload}`);
console.log(`  persists to localStorage: ${languageSwitchTest.persistsToLocalStorage}\n`);

const bundleTest = checkBundleConfig();
console.log('Bundle Configuration:');
console.log(`  i18n chunk separated: ${bundleTest.hasI18nChunk}`);
console.log(`  chunk name: ${bundleTest.chunkName}\n`);

const typeSafetyTest = checkTypeSafety();
console.log('Type Safety:');
console.log(`  has translation types: ${typeSafetyTest.hasTranslationTypes}`);
console.log(`  has key constants: ${typeSafetyTest.hasKeyConstants}`);
if (typeSafetyTest.typeFiles.length > 0) {
  console.log(`  type files: ${typeSafetyTest.typeFiles.join(', ')}`);
} else {
  console.log(`  ⚠️  No TypeScript types found for translation keys`);
}

// Save test results
const testResults = {
  missingKeyFallback: missingKeyTest,
  languageSwitch: languageSwitchTest,
  bundleConfig: bundleTest,
  typeSafety: typeSafetyTest,
};

const resultsPath = path.join(projectRoot, 'i18n-test-results.json');
fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
console.log(`\n📊 Test results saved to: ${resultsPath}`);

