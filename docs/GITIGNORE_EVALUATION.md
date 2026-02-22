# Evaluasi .gitignore Repository Prompedia

Evaluasi menyeluruh terhadap [.gitignore](../.gitignore) untuk memastikan konsistensi dengan best practice pengembangan perangkat lunak.

---

## 1. Ringkasan Stack & Tooling

| Kategori | Tool |
|----------|------|
| Framework | React 18, Vite 7 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database/Backend | Supabase |
| Testing | Vitest, Playwright |
| Linting/Format | ESLint, Prettier |
| Package Manager | npm (strict) |
| PWA | vite-plugin-pwa |

---

## 2. Daftar Temuan

### 2.1 Pola yang Sudah Benar

| Kategori | Rule | Status |
|----------|------|--------|
| Dependencies | `node_modules/`, `.pnp*` | OK |
| Build | `dist/`, `dist-ssr/`, `build/`, `out/` | OK |
| Environment | `.env`, `.env.*`, `!.env.example`, `!.env.template` | OK |
| Secrets | `*.key`, `*.pem`, `*.crt`, `secrets.json`, `.secrets/` | OK |
| Testing | `coverage/`, `playwright-report/`, `test-results/`, `.vitest/` | OK |
| Logs | `logs/`, `*.log`, `*-debug.log*` | OK |
| Cache | `.cache/`, `.npm/`, `.eslintcache`, `.vite/`, `*.tsbuildinfo` | OK |
| Supabase | `.supabase/`, `supabase/.temp/`, `supabase/.branches/` | OK |
| IDE | `.vscode/*` (dengan exception), `.idea/`, `.cursor/` | OK |
| OS | `.DS_Store`, `Thumbs.db`, `[Dd]esktop.ini` | OK |
| Package managers | `bun.lockb`, `.yarn/` | OK |
| Temp/Backup | `*.tmp`, `*.bak`, `*.backup`, `*.swp` | OK |

### 2.2 Temuan: Pola yang Perlu Diperbaiki atau Ditambah

| # | Temuan | Dampak | Prioritas |
|---|--------|--------|-----------|
| 1 | `*.local` di section Build Outputs — seharusnya di Environment/Local | Semantik salah; `*.local` untuk override lokal (env, config), bukan build output | Rendah |
| 2 | `yarn-error.log*` tidak di-ignore | Jika ada developer pakai Yarn, `yarn-error.log` bisa ter-commit | Rendah |
| 3 | `pnpm-lock.yaml` tidak di-ignore | Proyek strict npm; pnpm lock bisa ter-commit jika ada yang salah pakai pnpm | Rendah |
| 4 | `.stylelintcache` di-ignore tapi proyek tidak pakai Stylelint | Tidak berbahaya, hanya redundan | Sangat rendah |
| 5 | Deployment artifacts (`.vercel/`, `.netlify/`) tidak di-ignore | Jika deploy ke Vercel/Netlify, folder cache bisa ter-commit | Sedang |
| 6 | `.sentryclirc` tidak di-ignore | Proyek pakai Sentry; file ini bisa berisi auth token | Sedang |

### 2.3 Pola Berpotensi Bermasalah

| # | Pola | Risiko | Analisis |
|---|------|--------|----------|
| 1 | `*.local` | Terlalu luas | Match semua file `*.local` di mana pun. Contoh: `src/config.local.ts` akan di-ignore. Untuk override lokal biasanya diinginkan. **Rekomendasi:** Pertahankan; umum untuk env/config lokal. |
| 2 | `*.db`, `*.sqlite`, `*.sqlite3` | Luas | Match di seluruh repo. Bisa mengabaikan `docs/example.db` jika sengaja di-commit. **Rekomendasi:** Pertahankan; DB files jarang di-commit. |
| 3 | `.vscode/*` dengan exception | - | Pola benar. `!.vscode/extensions.json` dll. di-unignore untuk sharing config tim. |

### 2.4 Redundansi & Konflik

| Temuan | Analisis |
|--------|----------|
| `.env.*` vs `*.local` | `.env.local` match keduanya. Tidak konflik; overlap aman. |
| `*.local` vs `*.local.md` | Berbeda: `*.local` = `x.local`, `*.local.md` = `x.local.md`. Tidak redundan. |
| `*.bak` vs `*.backup` | Berbeda ekstensi. Tidak redundan. |

### 2.5 File yang Seharusnya Di-Ignore (Potensial)

| File/Folder | Status | Rekomendasi |
|-------------|--------|-------------|
| `.env` | Di-ignore | OK |
| `dist/` | Di-ignore | OK |
| `node_modules/` | Di-ignore | OK |
| `.sentryclirc` | Tidak di-ignore | Tambahkan |
| `.vercel/`, `.netlify/` | Tidak di-ignore | Tambahkan (jika pakai) |
| `yarn-error.log*` | Tidak di-ignore | Tambahkan |
| `pnpm-lock.yaml` | Tidak di-ignore | Pertimbangkan (strict npm) |

---

## 3. Dampak Analisis

### 3.1 Keamanan

| Aspek | Status | Catatan |
|-------|--------|---------|
| Credentials | Baik | `.env`, `*.key`, `*.pem`, `secrets.json` di-ignore |
| Sentry token | Risiko | `.sentryclirc` bisa berisi auth — tambahkan ke ignore |
| Supabase | Baik | `.supabase/` di-ignore |

### 3.2 Kebersihan Repository

| Aspek | Status |
|-------|--------|
| Build output | Baik — `dist/`, `build/` di-ignore |
| Cache | Baik — `.vite/`, `.cache/`, `.eslintcache` di-ignore |
| Dependencies | Baik — `node_modules/` di-ignore |
| Logs/Debug | Baik — `*.log`, `*-debug.log*` di-ignore |

### 3.3 Kolaborasi Tim

| Aspek | Status |
|-------|--------|
| .vscode shared | Baik — extensions.json, settings.json di-unignore |
| Env template | Baik — `.env.example` di-commit |
| Package manager | Baik — bun/yarn di-ignore, npm dipaksakan |

### 3.4 Determinisme Build

| Aspek | Status |
|-------|--------|
| node_modules | Baik — di-ignore, install via `npm ci` |
| package-lock.json | Baik — di-commit (wajib untuk npm) |
| dist/ | Baik — di-ignore, build fresh |

---

## 4. Rekomendasi Perbaikan

### 4.1 Tambahan Rule (Prioritas Sedang)

Tambahkan ke [.gitignore](../.gitignore):

```
# Deployment platforms (jika digunakan)
.vercel/
.netlify/
.firebase/

# Sentry CLI (dapat berisi auth token)
.sentryclirc
```

### 4.2 Tambahan Rule (Prioritas Rendah)

```
# Logs - lengkapi pattern
yarn-error.log*
pnpm-error.log*

# Strict npm - hindari lock file lain ter-commit
pnpm-lock.yaml
```

### 4.3 Reorganisasi (Opsional)

Pindahkan `*.local` dari section "Build Outputs" ke section baru atau gabung dengan Environment:

```
# ============================================
# Local Overrides & Build Outputs
# ============================================
dist/
...
*.local          # Local overrides (config, env) - pindah dari Build
```

### 4.4 Rule yang Tidak Perlu Diubah

- Jangan hapus `.stylelintcache` — tidak mengganggu meski Stylelint tidak dipakai
- Pertahankan `*.local` — standar untuk override lokal
- Pertahankan struktur .vscode dengan exception

---

## 5. Checklist Verifikasi

Gunakan checklist ini setelah mengubah .gitignore:

### 5.1 Status Git

- [ ] `git status` — tidak ada file sensitif (`.env`, `dist/`, `node_modules/`) yang tracked
- [ ] `git check-ignore -v .env` — mengembalikan rule .gitignore yang match
- [ ] `git check-ignore -v dist/` — mengembalikan rule yang match

### 5.2 Clean Clone

- [ ] Clone repo ke folder baru
- [ ] `npm ci` berhasil
- [ ] `npm run build` berhasil
- [ ] `npm run test` berhasil
- [ ] `npm run test:e2e` berhasil (jika Playwright terkonfigurasi)

### 5.3 File yang Harus Di-Commit

- [ ] `.env.example` — tracked
- [ ] `package.json`, `package-lock.json` — tracked
- [ ] `.vscode/extensions.json`, `settings.json` — tracked (jika ada)
- [ ] `vite.config.ts`, `tsconfig.json` — tracked

### 5.4 File yang Tidak Boleh Di-Commit

- [ ] `.env` — ignored
- [ ] `dist/` — ignored
- [ ] `node_modules/` — ignored
- [ ] `coverage/`, `playwright-report/`, `test-results/` — ignored

---

## 6. Kebijakan Pengelolaan .gitignore Jangka Panjang

### 6.1 Prinsip

1. **Satu sumber kebenaran** — .gitignore adalah satu-satunya referensi untuk file yang di-ignore
2. **Dokumentasi** — Setiap section punya komentar; rule tidak jelas diberi penjelasan
3. **Review berkala** — Saat menambah tool/stack baru, periksa apakah perlu rule baru
4. **Jangan over-ignore** — Hindari pola seperti `**/dist/**` yang redundan dengan `dist/`

### 6.2 Proses Saat Menambah Tool Baru

1. Cek dokumentasi resmi tool untuk file/cache yang harus di-ignore
2. Tambahkan rule di section yang sesuai
3. Jalankan checklist verifikasi
4. Update dokumen ini jika perlu

### 6.3 Template untuk Rule Baru

```gitignore
# ============================================
# [Nama Tool/Platform]
# ============================================
# Alasan: [mengapa di-ignore]
[pattern]
```

### 6.4 Referensi

- [Git ignore documentation](https://git-scm.com/docs/gitignore)
- [Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub .gitignore templates](https://github.com/github/gitignore)

---

## 7. Kesimpulan

**.gitignore** repository Prompedia secara umum **sudah baik** dan mengikuti praktik standar. Rekomendasi utama:

1. **Tambahkan** `.sentryclirc` (keamanan)
2. **Tambahkan** `.vercel/`, `.netlify/` jika memakai platform tersebut
3. **Tambahkan** `yarn-error.log*`, `pnpm-error.log*` untuk kelengkapan
4. **Pertimbangkan** `pnpm-lock.yaml` jika strict npm
5. **Opsional:** Pindahkan `*.local` ke section yang lebih tepat secara semantik

Tidak ada pola berbahaya atau konflik yang memerlukan perbaikan segera.
