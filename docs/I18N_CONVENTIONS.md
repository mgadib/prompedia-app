# Konvensi Translasi i18n

Dokumen ini menjelaskan konvensi dan best practices untuk translasi i18n di aplikasi prompedia.app.

## Struktur File

Translasi disimpan di:
- `src/locales/en.json` - Bahasa Inggris
- `src/locales/id.json` - Bahasa Indonesia

## Konvensi Penamaan Key

### Format Key
Gunakan format `namespace.key` dengan snake_case untuk key:

```json
{
  "auth": {
    "login": "Sign In",
    "error": {
      "generic": "An error occurred"
    }
  }
}
```

### Namespace
Gunakan namespace yang sesuai dengan konteks:
- `app` - Informasi aplikasi umum
- `auth` - Autentikasi
- `prompt` - Prompt-related
- `list` - Daftar prompt
- `sidebar` - Sidebar/filter
- `actions` - Action buttons
- `toast` - Toast notifications
- `editor` - Editor tools
- `landing` - Landing page
- `footer` - Footer links
- `about`, `faq`, `use_cases` - Halaman informasi

## Kapitalisasi

### Bahasa Inggris
- **Judul/Heading**: Title Case
  - `"title": "About prompedia.app"`
  - `"delete_confirm": "Delete prompt"`
- **Deskripsi/Paragraf**: Sentence case
  - `"description": "Learn more about prompedia.app..."`
- **Placeholder**: lowercase
  - `"title_placeholder": "Prompt title..."`
- **Button labels**: Sentence case (kecuali untuk brand/CTA)
  - `"save": "Save"`
  - `"cancel": "Cancel"`

### Bahasa Indonesia
- **Judul/Heading**: Title Case (huruf pertama setiap kata penting)
  - `"title": "Tentang prompedia.app"`
- **Deskripsi**: Sentence case
  - `"description": "Pelajari lebih lanjut tentang prompedia.app..."`
- **Placeholder**: lowercase
  - `"title_placeholder": "Judul prompt..."`
- **Button labels**: Sentence case
  - `"save": "Simpan"`

## Pluralisasi

### Bahasa Inggris
Gunakan plural forms dengan suffix `_one` dan `_other`:

```json
{
  "list": {
    "title_one": "All Prompt (1)",
    "title_other": "All Prompts ({{count}})",
    "showing_one": "Showing {{start}} - {{end}} of 1 prompt",
    "showing_other": "Showing {{start}} - {{end}} of {{total}} prompts"
  }
}
```

i18next akan otomatis memilih form yang tepat berdasarkan nilai `count`:
- `count === 1` → menggunakan `_one`
- `count !== 1` → menggunakan `_other`

### Bahasa Indonesia
Bahasa Indonesia tidak memiliki bentuk plural, jadi gunakan form dasar:

```json
{
  "list": {
    "title": "Semua Prompt ({{count}})",
    "showing": "Menampilkan {{start}} - {{end}} dari {{total}} prompt"
  }
}
```

## Placeholder Variabel

### Format
Gunakan format `{{variableName}}` dengan camelCase:

```json
{
  "prompt": {
    "created_by": "Created by {{author}}",
    "by": "by {{author}}"
  },
  "list": {
    "showing": "Showing {{start}} - {{end}} of {{total}} prompts"
  }
}
```

### Penggunaan di Komponen
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Dengan count (otomatis pluralisasi)
t('list.title', { count: totalItems })

// Dengan multiple variables
t('list.showing', { 
  start: 1, 
  end: 10, 
  total: 50 
})

// Dengan author
t('prompt.created_by', { author: 'John Doe' })
```

### Validasi
Pastikan semua placeholder yang digunakan di translation string juga disediakan saat memanggil `t()`:
- `{{author}}` → harus ada `{ author: ... }`
- `{{count}}` → harus ada `{ count: ... }`
- `{{start}}`, `{{end}}`, `{{total}}` → harus ada semua

## Konsistensi Istilah

### Bahasa Inggris
- **Prompt**: Gunakan "prompt" (lowercase) untuk deskripsi, "Prompt" (capitalized) untuk judul
- **Tag**: Gunakan "tag" (lowercase) untuk deskripsi, "Tag" (capitalized) untuk judul
- **Public/Private**: Konsisten menggunakan "Public" dan "Private"

### Bahasa Indonesia
- **Prompt**: Tetap "prompt" (tidak diterjemahkan, istilah teknis)
- **Tag**: Tetap "tag" (tidak diterjemahkan, istilah teknis)
- **Public/Private**: Gunakan "Publik" dan "Pribadi" (bukan "Privat")
- **Preview**: Gunakan "Pratinjau" (konsisten, bukan "Pratampilan")

## Naturalitas Bahasa

### Bahasa Indonesia
- Hindari terjemahan literal yang kaku
- Gunakan frasa yang natural dalam bahasa Indonesia
- Contoh perbaikan:
  - ❌ "Dicintai komunitas" 
  - ✅ "Dibuat untuk komunitas"
  - ❌ "Catatan prompt sederhana"
  - ✅ "Aplikasi catatan prompt yang sederhana"

## Menambahkan Translasi Baru

### Langkah-langkah:

1. **Tentukan namespace yang sesuai**
   ```json
   {
     "namespace": {
       "new_key": "Translation text"
     }
   }
   ```

2. **Tambahkan ke kedua file** (`en.json` dan `id.json`)
   ```json
   // en.json
   {
     "namespace": {
       "new_key": "New translation"
     }
   }
   
   // id.json
   {
     "namespace": {
       "new_key": "Terjemahan baru"
     }
   }
   ```

3. **Gunakan di komponen**
   ```typescript
   const { t } = useTranslation();
   <p>{t('namespace.new_key')}</p>
   ```

4. **Jika menggunakan placeholder atau pluralisasi**
   - Tambahkan placeholder: `{{variableName}}`
   - Untuk pluralisasi (English): tambahkan `_one` dan `_other` forms

## Testing

### Utility Functions
Gunakan utility functions di `src/lib/i18n-utils.ts` untuk testing:

```typescript
import { testPluralization, testInterpolation, validatePlaceholders } from '@/lib/i18n-utils';

// Test pluralization
const results = testPluralization('list.title', [0, 1, 2, 100]);

// Test interpolation
const interpolationResults = testInterpolation('list.showing', [
  { start: 1, end: 10, total: 50 }
]);

// Validate placeholders
const missing = validatePlaceholders(
  "Showing {{start}} - {{end}} of {{total}} prompts",
  { start: 1, end: 10, total: 50 }
);
```

### Manual Testing
1. Test dengan berbagai nilai count (0, 1, 2, 100)
2. Test interpolasi dengan berbagai nilai
3. Test dengan kedua bahasa (en dan id)
4. Verifikasi UI terlihat natural di kedua bahasa

## Best Practices

1. **Konsistensi**: Gunakan istilah yang sama di seluruh aplikasi
2. **Konteks**: Pertimbangkan konteks penggunaan (button vs label vs placeholder)
3. **Naturalitas**: Prioritaskan naturalitas bahasa daripada terjemahan literal
4. **Validasi**: Pastikan semua placeholder terisi saat digunakan
5. **Testing**: Test pluralisasi dan interpolasi sebelum commit

## Troubleshooting

### Pluralisasi tidak bekerja
- Pastikan konfigurasi pluralisasi di `src/i18n.ts` sudah benar
- Pastikan menggunakan `_one` dan `_other` suffix untuk English
- Pastikan memanggil `t()` dengan `{ count: ... }`

### Placeholder tidak terisi
- Pastikan format placeholder benar: `{{variableName}}`
- Pastikan memanggil `t()` dengan object yang berisi semua variable
- Check console untuk error messages

### Key tidak ditemukan
- Pastikan key ada di kedua file (`en.json` dan `id.json`)
- Pastikan format key benar: `namespace.key`
- Check untuk typo atau case sensitivity
