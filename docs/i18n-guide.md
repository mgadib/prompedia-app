# Internationalization (i18n) Guide

## Overview

Prompedia AI menggunakan `i18next` dan `react-i18next` untuk mendukung multiple bahasa. Saat ini aplikasi mendukung:
- English (en) - Default
- Bahasa Indonesia (id)

## Struktur i18n

### Namespaces

Aplikasi menggunakan namespace-based organization untuk mengelompokkan translations:

- **common**: Teks umum yang digunakan di seluruh aplikasi (buttons, labels, placeholders, dll)
- **auth**: Authentication-related strings (sign in, sign out, login, dll)
- **library**: Library-related strings (my library, public library, playground, dll)
- **prompt**: Prompt-related strings
- **errors**: Error messages
- **success**: Success messages
- **validation**: Validation messages
- **modes**: Thinking modes descriptions
- **actions**: AI actions descriptions

### File Structure

```
src/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── library.json
│   ├── prompt.json
│   ├── errors.json
│   ├── success.json
│   ├── validation.json
│   ├── modes.json
│   └── actions.json
└── id/
    ├── common.json
    ├── auth.json
    ├── library.json
    ├── prompt.json
    ├── errors.json
    ├── success.json
    ├── validation.json
    ├── modes.json
    └── actions.json
```

## Implementasi

### Lazy Loading Strategy

Aplikasi menggunakan hybrid loading strategy:

1. **Eager Loading** (Critical Namespaces):
   - `common`: Digunakan di semua halaman
   - `errors`: Error messages yang mungkin muncul kapan saja
   - Loaded saat aplikasi start untuk menghindari flicker

2. **Lazy Loading** (Non-Critical Namespaces):
   - Semua namespace lainnya (`auth`, `library`, `prompt`, `modes`, `actions`, `validation`, `success`)
   - Loaded on-demand saat pertama kali digunakan
   - Mengurangi initial bundle size

### Konfigurasi

File konfigurasi: `src/lib/i18n.ts`

Key features:
- Language detection: localStorage → navigator → htmlTag
- Fallback language: `en`
- Default namespace: `common`
- HTML lang attribute auto-update
- Number formatting dengan Intl.NumberFormat

## Usage

### Di React Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common:app.name')}</h1>
      <button>{t('auth:signIn')}</button>
    </div>
  );
}
```

### Di Non-React Contexts

Gunakan helper functions dari `src/lib/i18n-helpers.ts`:

```typescript
import { getErrorMessage, getSuccessMessage, getCommonMessage } from '@/lib/i18n-helpers';

// Error messages
const errorMsg = getErrorMessage('auth.loginFailed');

// Success messages
const successMsg = getSuccessMessage('auth.loginSuccess');

// Common messages
const commonMsg = getCommonMessage('buttons.save');
```

### Translation Key Format

Format: `namespace:key` atau `namespace:path.to.nested.key`

Contoh:
- `common:app.name`
- `auth:signIn`
- `library:privateLibrary`
- `common:buttons.save`
- `errors:auth.loginFailed`

## Menambah Translation Baru

### 1. Identifikasi Namespace yang Tepat

Pilih namespace yang sesuai dengan konteks:
- UI umum → `common`
- Authentication → `auth`
- Library features → `library`
- Prompt features → `prompt`
- Error messages → `errors`
- Success messages → `success`

### 2. Tambahkan Key ke File Locale

**English** (`src/locales/en/{namespace}.json`):
```json
{
  "myNewKey": "My New Text"
}
```

**Indonesian** (`src/locales/id/{namespace}.json`):
```json
{
  "myNewKey": "Teks Baru Saya"
}
```

### 3. Gunakan di Code

```tsx
const { t } = useTranslation();
return <div>{t('namespace:myNewKey')}</div>;
```

### 4. Nested Keys

Untuk struktur yang lebih kompleks:

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

Usage: `t('common:buttons.save')`

### 5. Interpolation

Untuk dynamic values:

```json
{
  "welcomeMessage": "Welcome, {{userName}}!"
}
```

Usage: `t('common:welcomeMessage', { userName: 'John' })`

## Best Practices

### 1. Konsistensi Naming

- Gunakan camelCase untuk keys
- Group related keys dengan nested objects
- Gunakan namespace yang sesuai dengan konteks

### 2. Jangan Hardcode Strings

❌ **Bad:**
```tsx
<button>Sign In</button>
```

✅ **Good:**
```tsx
<button>{t('auth:signIn')}</button>
```

### 3. Gunakan Namespace yang Tepat

❌ **Bad:**
```tsx
t('common:signIn') // Should be in auth namespace
```

✅ **Good:**
```tsx
t('auth:signIn')
```

### 4. Fallback Values

Untuk development, gunakan defaultValue:

```tsx
t('namespace:key', { defaultValue: 'Fallback text' })
```

### 5. Pluralization

i18next mendukung pluralization:

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

## Language Switching

Aplikasi menyediakan `LanguageSwitcher` component dan `useLanguage` hook:

```tsx
import { useLanguage } from '@/shared/hooks/useLanguage';

function MyComponent() {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <button onClick={() => changeLanguage('id')}>
      Switch to Indonesian
    </button>
  );
}
```

## PWA Manifest

File `public/manifest.json` adalah static file sesuai PWA specification. Shortcuts menggunakan bahasa Inggris sebagai default. Translations untuk shortcuts tersedia di locale files:

- `library.json` → `shortcuts.myLibrary` dan `shortcuts.publicLibrary`
- `prompt.json` → `shortcuts.newPrompt`

Untuk future implementation, manifest.json dapat di-generate secara dinamis berdasarkan user's language preference.

## Testing Translations

### Run i18n Audit

```bash
tsx scripts/i18n-audit.ts
```

Script ini akan:
- Scan untuk hardcoded strings
- Analyze translation coverage
- Generate report di `i18n-audit-report.json`

### Manual Testing

1. Switch language menggunakan LanguageSwitcher
2. Verify semua teks ter-translate dengan benar
3. Check untuk missing translations (akan muncul sebagai key path)
4. Test interpolation dengan berbagai values

## Troubleshooting

### Translation Key Tidak Ditemukan

Jika melihat key path sebagai output (e.g., `namespace:missingKey`):

1. Check apakah key ada di file locale yang sesuai
2. Verify namespace sudah di-load (untuk lazy-loaded namespaces)
3. Check spelling dan case sensitivity

### Namespace Tidak Ter-load

Untuk lazy-loaded namespaces, pastikan:
1. Namespace sudah digunakan di component (akan trigger loading)
2. Atau preload secara manual: `i18n.loadNamespaces(['namespace'])`

### Language Tidak Berubah

1. Check localStorage untuk key `prompedia_language`
2. Verify `useLanguage` hook digunakan dengan benar
3. Check browser console untuk errors

## Maintenance

### Regular Tasks

1. **Run i18n audit** setelah menambah features baru
2. **Verify coverage** untuk semua namespace (harus 100%)
3. **Update translations** saat menambah bahasa baru
4. **Review hardcoded strings** secara berkala

### Adding New Language

1. Create folder baru di `src/locales/{lang}/`
2. Copy semua namespace files dari `en/`
3. Translate semua strings
4. Update `LANGUAGES` constant di `src/lib/i18n.ts`
5. Update `LanguageSwitcher` component untuk menampilkan bahasa baru

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Best Practices](https://www.i18next.com/principles/fallback)

