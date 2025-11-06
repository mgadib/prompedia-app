# Rencana Design System (Prompedia)

## Prinsip
- Single source of truth: semua warna, tipografi, spacing, radius, shadow didefinisikan sebagai tokens.
- Aksesibilitas default: kontras warna ≥ 4.5:1; kontrol interaktif memiliki `focus-visible` yang jelas; ukuran target sentuh minimal 44px.
- Skalabilitas: komponen dasar (Button, Input, Select, Badge, Dialog, Card) terstandarisasi dengan varian yang terbatas dan jelas.

## Tokens
- Warna (HSL via CSS variables)
  - `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--ring`
  - Sidebar tokens: `--sidebar-*`
  - Brand: `--prompedia-green`, `--prompedia-green-hover`, `--prompedia-green-muted`
- Tipografi
  - Body: `font-sans` (mis. `system-ui`, `Inter`) untuk keterbacaan
  - UI teknis / kode: `font-mono`
  - Skala: `xs, sm, base, lg`
- Spacing
  - `space-s`: 0.5rem
  - `space-m`: 1rem
  - `space-l`: 1.5rem
- Radius
  - `--radius`: default; gunakan `sm/md/lg` dari Tailwind extend

## Komponen Dasar
- Button
  - Varian: `primary`, `secondary`, `ghost`, `destructive`
  - States: `hover`, `active`, `focus-visible`, `disabled`
- Input/Select/Textarea
  - Wajib `<label>` atau `aria-label`; ukuran teks ≥ 16px
  - Ring fokus: `focus-visible:ring-2 focus-visible:ring-ring`
- Dialog/Modal
  - Gunakan radix/shadcn untuk aksesibilitas built-in; trap fokus; ESC menutup; ARIA titles/descriptions
- Card
  - Semantik interaktif jika clickable: gunakan `<button>`/`<a>`; aksi terlihat pada `focus-within`

## Dokumentasi & Implementasi
- Lokasi tokens: `src/index.css` (CSS variables HSL)
- Pedoman komponen: buat README atau ADR per komponen dalam folder `src/components/ui/`
- Linting aksesibilitas: pertimbangkan `eslint-plugin-jsx-a11y` untuk deteksi dini

## Roadmap Adopsi
- Minggu 1: Audit komponen dasar dan terapkan tokens + aksesibilitas
- Minggu 2: Migrasi tipografi body ke sans-serif, tambahkan ring fokus global
- Minggu 3: Konsolidasi card & action patterns (Library/Tag)