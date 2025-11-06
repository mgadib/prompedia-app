# UI/UX Improvement Tasks (Untuk Jira/Asana)

## Prioritas Tinggi (Aksesibilitas & Performa)
- Task: Jadikan card dapat diakses keyboard
  - Deskripsi: Ubah pembungkus card menjadi elemen semantik (`button`/`a`) atau tambahkan `role="button"`, `tabIndex`, dan `onKeyDown` (Enter/Space membuka modal). Tambahkan `aria-label` deskriptif.
  - Komponen: `PublicLibrary.tsx`, `MyLibrary.tsx`, `Tag.tsx`
  - Acceptance: Card fokus dengan keyboard, modal bisa dibuka via Enter/Space. Aksi terlihat saat fokus (`group-focus-within`).

- Task: Tampilkan aksi kartu pada focus
  - Deskripsi: Ganti `opacity-0 group-hover:opacity-100` menjadi `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100` untuk kontainer aksi.
  - Komponen: `PublicLibrary.tsx`, `MyLibrary.tsx`, `Tag.tsx`
  - Acceptance: Aksi terlihat saat fokus keyboard tanpa mouse.

- Task: Tambahkan label untuk input dan filter tag
  - Deskripsi: Tambahkan `<label>` atau `aria-label` ke input pencarian dan `select` filter.
  - Komponen: `PublicLibrary.tsx`, `MyLibrary.tsx`
  - Acceptance: Axe DevTools tidak menandai input tanpa label.

- Task: Hilangkan hardcode domain pada “Copy URL”
  - Deskripsi: Ambil base URL dari `window.location.origin` atau ENV melalui `api-config.ts`/config module.
  - Komponen: `PublicLibrary.tsx`, `Tag.tsx`, `PublicPromptDetail.tsx`
  - Acceptance: URL yang disalin sesuai environment (local/staging/prod). Lint & typecheck lulus.

- Task: Instrumentasi Web Vitals & waktu respon
  - Deskripsi: Tambahkan `web-vitals` untuk LCP/CLS/FID. Log ke `trackEvent` JSON dengan `request_id`. Catat waktu respon P95 untuk operasi Supabase (fetch prompts/tags).
  - Komponen: `main.tsx`/`App.tsx`, `lib/analytics.ts`, `lib/supabase-service.ts`
  - Acceptance: Metrik terkirim ke logger; dashboard analitik menampilkan tren; P95 < 300ms untuk operasi utama.

## Prioritas Menengah (Alur & Feedback)
- Task: Tambah `focus-visible` ring pada kontrol interaktif
  - Deskripsi: Pastikan tombol, link, dan input terlihat jelas saat fokus keyboard.
  - Acceptance: Audit Axe tidak menandai masalah fokus; QA keyboard lulus.

- Task: Tipografi body → sans-serif
  - Deskripsi: Gunakan `font-sans` untuk body; `font-mono` untuk elemen teknis.
  - Acceptance: Readability meningkat pada perangkat mobile; tidak ada regresi visual besar.

- Task: Token spacing & grid konsisten
  - Deskripsi: Tambahkan token spacing (S/M/L) dan audit grid di library/tag.
  - Acceptance: Lint, typecheck, dan review visual konsisten antar halaman.

## Design System Setup
- Task: Definisikan tokens (warna, tipografi, spacing, radius)
  - Deskripsi: Dokumenkan tokens di `index.css` + README/ADR; siapkan tabel mapping.
  - Acceptance: Semua komponen refer ke tokens; tidak ada warna/spacing ad-hoc.

- Task: Komponen dasar aksesibel
  - Deskripsi: Audit shadcn UI: `Button`, `Input`, `Select`, `Dialog`, `Badge` untuk label, roles, dan keyboard.
  - Acceptance: Axe AA terpenuhi untuk komponen dasar.

## Prototype Interaktif
- Task: Prototype kartu aksesibel
  - Deskripsi: Buat prototype di Figma dengan state focus/hover/active; auto layout untuk responsivitas.
  - Acceptance: Prototype disetujui; dev handoff tersedia.

## Rencana Validasi
- Task: Audit Axe DevTools (WCAG 2.1 AA)
  - Acceptance: 0 blocker; semua critical diatasi.

- Task: Lighthouse ≥ 90 (mobile/desktop)
  - Acceptance: Skor performance ≥ 90; dokumentasi rekomendasi diterapkan.

- Task: Waktu respon < 2 detik untuk operasi kritis
  - Acceptance: P95 < 2 detik untuk load prompts/tag; telemetry terbukti.

- Task: FPS stabil ≥ 60 pada interaksi utama
  - Acceptance: DevTools performance menunjukkan FPS ≥ 60 dengan minimal jank.