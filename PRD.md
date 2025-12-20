# Product Requirements Document (PRD): Prompedia AI

**Versi Dokumen:** 1.0  
**Tanggal:** 20 Desember 2025  
**Status:** Active Development

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Dalam era *Generative AI*, prompt engineering menjadi skill krusial. Namun, para engineer dan developer sering kesulitan menyimpan, mengelola, dan menggunakan kembali prompt yang telah mereka buat. Seringkali prompt tersebar di berbagai catatan, chat history, atau dokumen yang tidak terorganisir.

### 1.2 Tujuan Produk
**Prompedia AI** bertujuan menjadi "Laboratorium Prompt Engineering" terpusat. Platform ini menyediakan alat untuk menyimpan, mengedit, mengorganisir (dengan tag), dan membagikan prompt AI dalam antarmuka yang modern, cepat, dan intuitif.

---

## 2. Gambaran Produk

Prompedia AI adalah aplikasi web berbasis React yang memungkinkan pengguna mengelola perpustakaan prompt pribadi mereka. Aplikasi ini mendukung **Markdown** penuh untuk penulisan prompt yang rapi, sistem **tagging** untuk organisasi, dan **sharing** untuk kolaborasi.

### 2.1 Nilai Utama
*   **Centralized**: Satu tempat untuk semua prompt.
*   **Structured**: Organisasi dengan tag dan pencarian cepat.
*   **Shareable**: Kemudahan berbagi prompt publik dengan komunitas.
*   **Developer-First**: Mendukung markdown, syntax highlighting, dan dark mode.

---

## 3. Target Pengguna

1.  **Prompt Engineers**: Profesional yang fokus membuat dan mengoptimalkan prompt untuk LLM.
2.  **AI Developers**: Developer yang mengintegrasikan AI ke dalam aplikasi dan butuh menyimpan system prompt.
3.  **Content Creators**: Penulis yang menggunakan AI untuk membantu pembuatan konten.
4.  **Pelajar/Hobiis**: Siapapun yang bereksperimen dengan AI (ChatGPT, Claude, Gemini).

---

## 4. Fitur & Spesifikasi Fungsional

### 4.1 Otentikasi & Akun Pengguna
*   **Sign Up / Login**: Pengguna dapat mendaftar dan masuk menggunakan email (via Supabase Auth).
*   **Profil Pengguna**: Pengguna memiliki `username` unik dan `display_name`.
*   **Sesi Aman**: Manajemen sesi aman dengan auto-logout saat token kadaluarsa.

### 4.2 Manajemen Prompt (CRUD)
*   **Create**: Membuat prompt baru dengan judul, deskripsi (opsional), dan konten.
*   **Read**: Melihat daftar prompt pribadi dan detail prompt.
*   **Update**: Mengedit konten prompt, judul, dan metadata lainnya.
*   **Delete**: Menghapus prompt secara permanen.
*   **Auto-Save**: (Planned) Penyimpanan otomatis saat mengedit untuk mencegah kehilangan data.

### 4.3 Editor Prompt Canggih
*   **Rich Text / Markdown**: Editor berbasis **TipTap** mendukung bold, italic, list, headings, code blocks.
*   **Syntax Highlighting**: Highlight kode untuk berbagai bahasa pemrograman dalam blok kode.
*   **Preview**: Tampilan render markdown yang akurat.
*   **Copy to Clipboard**: Tombol satu klik untuk menyalin isi prompt (raw text) untuk ditempel ke LLM.

### 4.4 Organisasi & Pencarian
*   **Tagging System**: Menambahkan multiple tag pada satu prompt.
*   **Filter by Tag**: Mengklik tag untuk melihat semua prompt dengan tag tersebut.
*   **Search**: Pencarian teks real-time pada judul dan isi prompt.
*   **Filter Visibility**: Filter untuk melihat "All", "Public", atau "Private".

### 4.5 Sharing & Visibilitas
*   **Public/Private Toggle**: Pengguna dapat mengatur status prompt menjadi Publik atau Pribadi.
    *   *Private*: Hanya bisa dilihat pemilik.
    *   *Public*: Bisa dilihat siapa saja yang memiliki tautan atau melalui halaman publik.
*   **Public Link**: Generate URL unik (`/share/:id`) untuk membagikan prompt publik.
*   **Public Library**: Halaman khusus (`/public-prompts`) untuk menjelajahi prompt publik dari seluruh komunitas.

### 4.6 Internasionalisasi (i18n)
*   **Multi-bahasa**: Dukungan penuh Bahasa Indonesia (`id`) dan Inggris (`en`).
*   **Auto-detect**: Deteksi bahasa otomatis berdasarkan preferensi browser.

---

## 5. Spesifikasi Non-Fungsional

### 5.1 Performa
*   **Load Time**: Initial load aplikasi di bawah 2 detik.
*   **Responsiveness**: Interaksi UI (ketik, klik) harus instan (< 100ms).
*   **Optimized Build**: Bundle size diminimalkan dengan code splitting (Vite).

### 5.2 Keamanan
*   **Row Level Security (RLS)**: Database PostgreSQL wajib menggunakan RLS untuk memastikan isolasi data pengguna. Pengguna TIDAK BOLEH bisa mengakses prompt private pengguna lain.
*   **Data Validation**: Semua input divalidasi di sisi klien (Zod) dan database (Constraints).
*   **XSS Protection**: Sanitasi konten markdown untuk mencegah serangan XSS.

### 5.3 Kompatibilitas
*   **Browser**: Chrome, Firefox, Safari, Edge (versi modern).
*   **Device**: Responsive di Desktop, Tablet, dan Mobile (Responsive Design).

---

## 6. Desain & UX

### 6.1 Filosofi Desain
*   **Modern & Bersih**: Menggunakan aesthetic modern, banyak whitespace, dan tipografi yang jelas (Inter/System UI).
*   **Tema**: Mendukung **Light Mode** dan **Dark Mode** (mengikuti preferensi sistem atau toggle manual).
*   **Konsistensi**: Menggunakan design system (shadcn/ui) dan Tailwind CSS tokens untuk warna/spacing.

### 6.2 Struktur Halaman Utama
*   **Sidebar**: Navigasi (Home, Public Prompts, About, FAQ), Filter Tag, User Profile.
*   **Main Content**: Daftar Prompt (Grid/List), Editor Area.

---

## 7. Arsitektur Teknis

### 7.1 Tech Stack
*   **Frontend**: React 18, TypeScript, Vite.
*   **Styling**: Tailwind CSS, shadcn/ui.
*   **State Management**: React Query (Server State), React Hook Form (Forms).
*   **Backend (BaaS)**: Supabase (Auth, Database, Realtime, Storage).
*   **Database**: PostgreSQL.

### 7.2 Struktur Database (Schema)
Lihat `supabase/migrations` untuk detail teknis. Entitas utama:
*   `users`: Data profil pengguna.
*   `prompts`: Metadata prompt (judul, visibility, owner).
*   `prompt_contents`: Isi prompt (dipisah untuk optimasi list view).
*   `tags`: Definisi tag user-specific.
*   `prompt_tags`: Many-to-many relation antara prompt dan tag.

---

## 8. Roadmap Masa Depan (Future Scope)

Fitur berikut direncanakan untuk pengembangan selanjutnya:

*   **AI Integration**:
    *   *Smart Tagging*: AI otomatis menyarankan tag berdasarkan konten prompt.
    *   *AI Analysis*: Evaluasi kualitas prompt dan saran perbaikan.
*   **Version History**: Melacak perubahan pada prompt (v1, v2, dst).
*   **Collections/Folders**: Grouping prompt selain menggunakan tag.
*   **Forking**: Menyalin prompt publik orang lain ke library pribadi untuk dimodifikasi.
*   **Browser Extension**: Ekstensi Chrome untuk menyimpan prompt langsung dari chat ChatGPT/Claude.

---

## 9. Analitik (Planned)

*   Jumlah prompt dibuat pengguna.
*   Tag yang paling sering digunakan.
*   Jumlah view pada prompt publik.
