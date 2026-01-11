# Product Requirements Document (PRD): Prompedia AI

**Versi Dokumen:** 2.0  
**Tanggal:** 20 Desember 2025  
**Status:** Active Development  
**Last Updated:** 20 Desember 2025

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Dalam era *Generative AI*, prompt engineering menjadi skill krusial. Namun, para engineer dan developer sering kesulitan menyimpan, mengelola, dan menggunakan kembali prompt yang telah mereka buat. Seringkali prompt tersebar di berbagai catatan, chat history, atau dokumen yang tidak terorganisir.

### 1.2 Tujuan Produk
**Prompedia AI** bertujuan menjadi "Laboratorium Prompt Engineering" terpusat. Platform ini menyediakan alat untuk menyimpan, mengedit, mengorganisir (dengan tag), dan membagikan prompt AI dalam antarmuka yang modern, cepat, dan intuitif.

### 1.3 Scope Dokumen
Dokumen ini mencakup:
- Fitur yang sudah diimplementasikan (✅)
- Fitur yang sedang dalam pengembangan (🚧)
- Fitur yang direncanakan untuk masa depan (📋)

---

## 2. Gambaran Produk

Prompedia AI adalah aplikasi web berbasis React yang memungkinkan pengguna mengelola perpustakaan prompt pribadi mereka. Aplikasi ini mendukung **Markdown** penuh untuk penulisan prompt yang rapi, sistem **tagging** untuk organisasi, dan **sharing** untuk kolaborasi.

### 2.1 Nilai Utama
*   **Centralized**: Satu tempat untuk semua prompt.
*   **Structured**: Organisasi dengan tag dan pencarian cepat.
*   **Shareable**: Kemudahan berbagi prompt publik dengan komunitas.
*   **Developer-First**: Mendukung markdown, syntax highlighting, dan editor yang powerful.

### 2.2 Target Platform
- **Web Application**: Responsive design untuk desktop, tablet, dan mobile
- **Browser Support**: Chrome, Firefox, Safari, Edge (versi modern)
- **PWA Ready**: Progressive Web App capabilities (belum diimplementasikan)

---

## 3. Target Pengguna

1.  **Prompt Engineers**: Profesional yang fokus membuat dan mengoptimalkan prompt untuk LLM.
2.  **AI Developers**: Developer yang mengintegrasikan AI ke dalam aplikasi dan butuh menyimpan system prompt.
3.  **Content Creators**: Penulis yang menggunakan AI untuk membantu pembuatan konten.
4.  **Pelajar/Hobiis**: Siapapun yang bereksperimen dengan AI (ChatGPT, Claude, Gemini).

---

## 4. Fitur & Spesifikasi Fungsional

### 4.1 Otentikasi & Akun Pengguna ✅

#### 4.1.1 Sign Up / Login
- **Status**: ✅ Implemented
- Pengguna dapat mendaftar dan masuk menggunakan email/password (via Supabase Auth)
- Form validation dengan error handling
- Rate limiting handling dengan exponential backoff
- User-friendly error messages untuk berbagai skenario

#### 4.1.2 Profil Pengguna
- **Status**: ✅ Implemented
- Pengguna memiliki `username` unik (auto-generated dari email saat signup)
- `display_name` opsional untuk personalisasi
- Profil linked dengan Supabase Auth user

#### 4.1.3 Sesi Aman
- **Status**: ✅ Implemented
- Manajemen sesi aman dengan auto-refresh token
- **Auto-logout** setelah 27 menit tidak aktif (idle timeout)
- Confirmation dialog sebelum logout
- Protected routes dengan React Router

---

### 4.2 Manajemen Prompt (CRUD) ✅

#### 4.2.1 Create
- **Status**: ✅ Implemented
- Membuat prompt baru dengan:
  - Judul (auto-generated dari konten jika kosong)
  - Konten markdown (required)
  - Tags (opsional, multiple, comma-separated)
  - Visibility (public/private)
- Auto-save behavior (manual save button)

#### 4.2.2 Read
- **Status**: ✅ Implemented
- Melihat daftar prompt pribadi dengan pagination
- Detail prompt view dalam modal
- Public prompt view di halaman khusus (`/share/:id`)
- Landing page menampilkan recent public prompts

#### 4.2.3 Update
- **Status**: ✅ Implemented
- Mengedit konten prompt, judul, tags, dan visibility
- Update `updated_at` timestamp otomatis
- Optimistic updates untuk UX yang lebih baik

#### 4.2.4 Delete
- **Status**: ✅ Implemented
- Menghapus prompt secara permanen
- Confirmation dialog untuk mencegah accidental deletion
- Cascade delete untuk prompt_contents dan prompt_tags

#### 4.2.5 Auto-Save
- **Status**: 🚧 Planned
- Penyimpanan otomatis saat mengedit untuk mencegah kehilangan data
- Draft management
- Conflict resolution

---

### 4.3 Editor Prompt Canggih ✅

#### 4.3.1 Rich Text / Markdown Editor
- **Status**: ✅ Implemented
- Editor berbasis **TipTap** dengan WYSIWYG experience
- Support untuk:
  - **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~
  - Headings (H1-H6)
  - Bullet lists dan ordered lists
  - Blockquotes
  - Code blocks dengan syntax highlighting
  - Horizontal rules
- Konversi otomatis antara TipTap JSON dan Markdown

#### 4.3.2 Syntax Highlighting
- **Status**: ✅ Implemented
- Highlight kode untuk berbagai bahasa pemrograman dalam blok kode
- Menggunakan Lowlight library
- Support untuk 100+ bahasa pemrograman

#### 4.3.3 Preview Mode
- **Status**: ✅ Implemented
- Toggle antara edit mode dan preview mode
- Render markdown yang akurat menggunakan react-markdown
- GitHub Flavored Markdown support

#### 4.3.4 Copy to Clipboard
- **Status**: ✅ Implemented
- Tombol satu klik untuk menyalin isi prompt (raw markdown)
- Toast notification untuk feedback
- Copy sharing link untuk public prompts

#### 4.3.5 Paste Handling
- **Status**: ✅ Implemented
- Strip external formatting pada paste
- Prefer plain text untuk konsistensi
- Preserve markdown formatting

---

### 4.4 Organisasi & Pencarian ✅

#### 4.4.1 Tagging System
- **Status**: ✅ Implemented
- Menambahkan multiple tag pada satu prompt (comma-separated)
- Tag bersifat user-specific (setiap user punya tag sendiri)
- Auto-create tags jika belum ada
- Tag management (create, reuse)

#### 4.4.2 Filter by Tag
- **Status**: ✅ Implemented
- Filter sidebar untuk desktop (menampilkan semua user tags)
- Mobile filter button untuk akses mudah
- Click tag untuk filter semua prompt dengan tag tersebut
- Real-time filtering

#### 4.4.3 Search
- **Status**: ✅ Implemented
- Pencarian teks real-time pada:
  - Judul prompt
  - Konten prompt (body)
  - Tag names
- Server-side search dengan text search index
- Client-side filtering fallback
- Highlight hasil pencarian (planned)

#### 4.4.4 Filter Visibility
- **Status**: ✅ Implemented
- Filter untuk melihat "All", "Public", atau "Private"
- Toggle buttons untuk quick filter
- Combined dengan tag filter

#### 4.4.5 Pagination
- **Status**: ✅ Implemented
- Server-side pagination untuk performa optimal
- Configurable items per page (default: 10)
- Page navigation controls
- Total count display

---

### 4.5 Sharing & Visibilitas ✅

#### 4.5.1 Public/Private Toggle
- **Status**: ✅ Implemented
- Pengguna dapat mengatur status prompt menjadi Publik atau Pribadi
- Toggle switch di editor
- *Private*: Hanya bisa dilihat pemilik
- *Public*: Bisa dilihat siapa saja yang memiliki tautan atau melalui landing page

#### 4.5.2 Public Link
- **Status**: ✅ Implemented
- Generate URL unik (`/share/:id`) untuk membagikan prompt publik
- Accessible tanpa login
- SEO-optimized dengan structured data
- Recent prompts sidebar di public view

#### 4.5.3 Public Library / Landing Page
- **Status**: ✅ Implemented
- Halaman landing menampilkan recent public prompts (10 terbaru)
- Tag cloud untuk public prompts
- Filter by tag di landing page
- Accessible tanpa authentication

#### 4.5.4 Public Prompt View
- **Status**: ✅ Implemented
- Halaman khusus untuk melihat detail prompt publik
- Copy prompt content
- Copy sharing link
- Recent prompts sidebar
- SEO optimization dengan meta tags dan structured data

---

### 4.6 Internasionalisasi (i18n) ✅

#### 4.6.1 Multi-bahasa
- **Status**: ✅ Implemented
- Dukungan penuh Bahasa Indonesia (`id`) dan Inggris (`en`)
- Semua teks user-facing ter-translate
- Translation files di `src/locales/`

#### 4.6.2 Auto-detect
- **Status**: ✅ Implemented
- Deteksi bahasa otomatis berdasarkan preferensi browser
- Menggunakan i18next-browser-languagedetector
- Fallback ke bahasa Inggris jika tidak didukung

#### 4.6.3 Language Switching
- **Status**: 🚧 Planned
- Manual language switcher di UI
- Persist language preference
- Update document language attribute

---

### 4.7 Halaman Informasi ✅

#### 4.7.1 About Page
- **Status**: ✅ Implemented
- Route: `/about`
- Informasi tentang aplikasi
- Value proposition
- Tech stack overview

#### 4.7.2 FAQ Page
- **Status**: ✅ Implemented
- Route: `/faq`
- Frequently Asked Questions
- Common issues dan solutions

#### 4.7.3 Use Cases Page
- **Status**: ✅ Implemented
- Route: `/use-cases`
- Contoh penggunaan aplikasi
- Best practices
- Use case scenarios

---

## 5. Spesifikasi Non-Fungsional

### 5.1 Performa ✅

#### 5.1.1 Load Time
- **Target**: Initial load aplikasi di bawah 2 detik
- **Status**: ✅ Optimized
- Code splitting dengan manual chunks
- Lazy loading ready
- Optimized bundle size

#### 5.1.2 Responsiveness
- **Target**: Interaksi UI (ketik, klik) harus instan (< 100ms)
- **Status**: ✅ Implemented
- Optimistic updates
- Debounced search
- Efficient re-renders

#### 5.1.3 Optimized Build
- **Status**: ✅ Implemented
- Bundle size diminimalkan dengan code splitting (Vite)
- Manual chunks untuk vendor libraries
- Chunk size warning limit: 1000KB
- Target: < 250KB gzipped per chunk

#### 5.1.4 Database Performance
- **Status**: ✅ Implemented
- Indexes pada kolom yang sering di-query
- Server-side pagination
- Efficient joins dengan Supabase
- Text search index untuk full-text search

---

### 5.2 Keamanan ✅

#### 5.2.1 Row Level Security (RLS)
- **Status**: ✅ Implemented
- Database PostgreSQL wajib menggunakan RLS untuk memastikan isolasi data pengguna
- Pengguna TIDAK BOLEH bisa mengakses prompt private pengguna lain
- Policies untuk semua tabel:
  - Public read untuk public prompts
  - Owner-only write untuk semua resources
  - User-specific tags

#### 5.2.2 Data Validation
- **Status**: ✅ Implemented
- Semua input divalidasi di sisi klien (Zod ready)
- Database constraints untuk data integrity
- Type safety dengan TypeScript

#### 5.2.3 XSS Protection
- **Status**: ✅ Implemented
- Sanitasi konten markdown untuk mencegah serangan XSS
- React's built-in XSS protection
- Content Security Policy headers di production

#### 5.2.4 Rate Limiting
- **Status**: ✅ Implemented
- Handling rate limit errors dari Supabase
- Exponential backoff retry logic
- User-friendly error messages

#### 5.2.5 Session Security
- **Status**: ✅ Implemented
- Secure session management via Supabase Auth
- Auto-logout setelah idle timeout
- Token refresh handling

---

### 5.3 Kompatibilitas ✅

#### 5.3.1 Browser
- **Status**: ✅ Tested
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

#### 5.3.2 Device
- **Status**: ✅ Implemented
- Responsive di Desktop, Tablet, dan Mobile
- Mobile-first design approach
- Touch-friendly interface

#### 5.3.3 Accessibility
- **Status**: 🚧 Partial
- Semantic HTML
- Keyboard navigation (partial)
- Screen reader support (partial)
- ARIA labels (partial)

---

## 6. Desain & UX

### 6.1 Filosofi Desain ✅

#### 6.1.1 Modern & Bersih
- **Status**: ✅ Implemented
- Menggunakan aesthetic modern, banyak whitespace, dan tipografi yang jelas
- Font: Inter untuk body, JetBrains Mono untuk code

#### 6.1.2 Tema
- **Status**: 🚧 Partial
- Mendukung **Light Mode** (default)
- Dark Mode infrastructure ready (next-themes) tapi belum diimplementasikan
- Toggle manual (planned)

#### 6.1.3 Konsistensi
- **Status**: ✅ Implemented
- Menggunakan design system (shadcn/ui) dan Tailwind CSS tokens untuk warna/spacing
- Consistent component patterns
- Reusable UI components

### 6.2 Struktur Halaman Utama ✅

#### 6.2.1 Layout
- **Status**: ✅ Implemented
- **Header**: Navigation, user info, logout
- **Main Content**: Prompt list, editor
- **Sidebar**: Filter tags (desktop)
- **Footer**: Links, copyright

#### 6.2.2 Navigation
- **Status**: ✅ Implemented
- Routes:
  - `/` - Main app (PromptNotes)
  - `/about` - About page
  - `/faq` - FAQ page
  - `/use-cases` - Use cases page
  - `/share/:id` - Public prompt view
- Header navigation untuk authenticated users
- Footer links untuk all users

---

## 7. Arsitektur Teknis

### 7.1 Tech Stack ✅

#### 7.1.1 Frontend
- **React 18.3** - UI library dengan hooks dan concurrent features
- **TypeScript 5.8** - Type safety dan developer experience
- **Vite 7.3** - Build tool yang cepat dan modern
- **React Router 6.30** - Client-side routing

#### 7.1.2 Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives

#### 7.1.3 State Management
- **React Query 5.83** - Server state management
- **React Hook Form 7.61** - Form management
- **Zod 3.25** - Schema validation

#### 7.1.4 Backend (BaaS)
- **Supabase 2.76** - Backend as a Service
  - Auth, Database, Realtime, Storage
- **PostgreSQL** - Relational database

#### 7.1.5 Editor
- **TipTap 3.13** - Rich text editor framework
- **Lowlight 3.3** - Syntax highlighting
- **React Markdown 10.1** - Markdown rendering

### 7.2 Struktur Database (Schema) ✅

Lihat `supabase/migrations/20251219120000_baseline.sql` untuk detail teknis. Entitas utama:

#### 7.2.1 Core Tables
- `users`: Data profil pengguna
- `prompts`: Metadata prompt (judul, visibility, owner)
- `prompt_contents`: Isi prompt (dipisah untuk optimasi list view)
- `tags`: Definisi tag user-specific
- `prompt_tags`: Many-to-many relation antara prompt dan tag

#### 7.2.2 Indexes
- Indexes untuk performa query yang optimal
- Text search index untuk full-text search
- Composite indexes untuk complex queries

#### 7.2.3 Row Level Security
- RLS enabled untuk semua tabel
- Policies untuk public read dan owner write
- Secure by default

### 7.3 Design Patterns ✅

#### 7.3.1 Component Architecture
- Component-based dengan single responsibility
- Reusable components
- Composition over inheritance

#### 7.3.2 Custom Hooks
- `usePrompts`: Prompt data fetching dengan React Query
- `useIdleLogout`: Auto-logout logic
- Separation of concerns

#### 7.3.3 Error Handling
- Retry logic dengan exponential backoff
- User-friendly error messages
- Toast notifications untuk feedback

---

## 8. Roadmap Masa Depan (Future Scope)

Fitur berikut direncanakan untuk pengembangan selanjutnya:

### 8.1 AI Integration 🚧

#### 8.1.1 Smart Tagging
- **Status**: 📋 Planned
- AI otomatis menyarankan tag berdasarkan konten prompt
- Integration dengan LLM API (OpenAI, Anthropic, dll)
- Configurable AI provider

#### 8.1.2 AI Analysis
- **Status**: 📋 Planned
- Evaluasi kualitas prompt dan saran perbaikan
- Prompt engineering best practices checker
- Score/rating untuk prompt quality

#### 8.1.3 Prompt Templates
- **Status**: 📋 Planned
- Library template untuk berbagai use case
- Pre-built templates untuk common scenarios
- Community-contributed templates

### 8.2 Version History 🚧

#### 8.2.1 Change Tracking
- **Status**: 📋 Planned
- Melacak perubahan pada prompt (v1, v2, dst)
- Timestamp untuk setiap versi
- Author tracking

#### 8.2.2 Diff View
- **Status**: 📋 Planned
- Visual diff untuk melihat perubahan antar versi
- Highlight additions dan deletions
- Side-by-side comparison

#### 8.2.3 Rollback
- **Status**: 📋 Planned
- Rollback ke versi sebelumnya
- Restore deleted prompts
- Version comparison

### 8.3 Collections/Folders 🚧

#### 8.3.1 Folder Organization
- **Status**: 📋 Planned
- Grouping prompt selain menggunakan tag
- Nested folders
- Folder-specific permissions

#### 8.3.2 Drag & Drop
- **Status**: 📋 Planned
- Drag & drop untuk organize prompts
- Move prompts between folders
- Reorder prompts

### 8.4 Forking & Collaboration 🚧

#### 8.4.1 Forking
- **Status**: 📋 Planned
- Menyalin prompt publik orang lain ke library pribadi
- Credit attribution untuk forked prompts
- Fork history tracking

#### 8.4.2 Comments
- **Status**: 📋 Planned
- Comments pada public prompts
- Discussion threads
- Moderation tools

#### 8.4.3 Collaboration
- **Status**: 📋 Planned
- Shared prompts dengan multiple owners
- Team workspaces
- Permission management

### 8.5 Browser Extension 🚧

#### 8.5.1 Chrome Extension
- **Status**: 📋 Planned
- Ekstensi Chrome untuk menyimpan prompt langsung dari chat
- Quick save dari ChatGPT/Claude/Gemini
- One-click import

#### 8.5.2 Integration
- **Status**: 📋 Planned
- Direct integration dengan AI chat interfaces
- Context-aware saving
- Auto-tagging dari context

### 8.6 Analytics Dashboard 🚧

#### 8.6.1 Personal Analytics
- **Status**: 📋 Planned
- Total prompts count
- Public vs Private distribution
- Most used tags
- Recent activity timeline

#### 8.6.2 Statistics
- **Status**: 📋 Planned
- Prompt creation trends
- Tag popularity
- Community contributions
- Usage patterns

### 8.7 Advanced Features 🚧

#### 8.7.1 Dark Mode
- **Status**: 🚧 Infrastructure Ready
- Toggle dark mode (infrastructure ada, UI belum)
- System preference detection
- Persistent theme preference

#### 8.7.2 Export/Import
- **Status**: 📋 Planned
- Export prompts (JSON, Markdown)
- Import prompts dari file
- Bulk operations
- Backup/restore

#### 8.7.3 Keyboard Shortcuts
- **Status**: 📋 Planned
- Keyboard shortcuts untuk common actions
- Command palette
- Power user features

#### 8.7.4 Advanced Search
- **Status**: 📋 Planned
- Search dengan operators (AND, OR, NOT)
- Filter by date range
- Filter by author
- Saved searches

---

## 9. Success Metrics

### 9.1 User Metrics
- Number of registered users
- Active users (DAU/MAU)
- Prompts created per user
- Public vs Private ratio

### 9.2 Engagement Metrics
- Average prompts per user
- Tag usage patterns
- Search frequency
- Sharing frequency

### 9.3 Technical Metrics
- Page load time (< 2s target)
- API response time (P95 < 300ms target)
- Error rate (< 1% target)
- Uptime (99.9% target)

---

## 10. Appendix

### 10.1 Glossary
- **Prompt**: Instruksi atau teks yang diberikan ke AI model
- **Tag**: Label untuk mengorganisir prompts
- **Public Prompt**: Prompt yang dapat diakses oleh semua user
- **Private Prompt**: Prompt yang hanya dapat diakses oleh owner
- **RLS**: Row Level Security - database-level access control

### 10.2 References
- [Supabase Documentation](https://supabase.com/docs)
- [TipTap Documentation](https://tiptap.dev)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 10.3 Change Log

**v2.0 (20 Desember 2025)**
- Updated PRD untuk mencerminkan implementasi saat ini
- Added status indicators (✅ Implemented, 🚧 Planned, 📋 Future)
- Detailed feature breakdown
- Updated roadmap

**v1.0 (20 Desember 2025)**
- Initial PRD document

---

**End of Document**
