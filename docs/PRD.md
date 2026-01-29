# Product Requirements Document (PRD): Prompedia AI

Ringkasan PRD; dokumen lengkap dan terbaru ada di [PRD.md](../PRD.md) (root).

**Versi Dokumen:** 1.0  
**Tanggal:** 20 Desember 2025  
**Status:** Production  
**Last Updated:** 20 Desember 2025

---

## 1. Ringkasan Produk

Prompedia AI adalah aplikasi catatan prompt AI (AI prompt notes) berbasis React untuk manajemen prompt AI. Aplikasi ini memungkinkan pengguna menyimpan, mengorganisir, dan berbagi prompt AI melalui antarmuka yang modern dan intuitif. Aplikasi dibangun dengan React 18.3, TypeScript 5.8, dan menggunakan Supabase sebagai Backend as a Service. Positioning produk: **AI prompt notes** / **aplikasi catatan prompt AI**.

### 1.1 Value Proposition

- **Centralized Storage**: Satu tempat untuk menyimpan semua prompt AI
- **Organized Management**: Sistem tag user-specific untuk organisasi yang fleksibel
- **Community Sharing**: Berbagi prompt berkualitas dengan komunitas melalui link publik
- **Developer-First**: Editor markdown dengan syntax highlighting dan preview mode

### 1.2 Platform

- **Web Application**: Responsive design untuk desktop, tablet, dan mobile
- **Browser Support**: Chrome, Firefox, Safari, Edge (versi modern)
- **Development Server**: `http://localhost:8080` (Vite default port)

---

## 2. Problem Statement

Dalam era Generative AI, prompt engineering menjadi skill krusial. Namun, para engineer dan developer sering kesulitan:

1. **Fragmented Storage**: Prompt tersebar di berbagai catatan, chat history, atau dokumen yang tidak terorganisir
2. **Lack of Organization**: Tidak ada sistem yang efektif untuk mengorganisir dan mencari prompt
3. **No Sharing Mechanism**: Sulit berbagi prompt berkualitas dengan komunitas
4. **Poor Editing Experience**: Tidak ada editor yang optimal untuk menulis dan mengedit prompt dengan format yang rapi

Prompedia AI menyelesaikan masalah ini dengan menyediakan platform terpusat untuk manajemen prompt yang terorganisir, dapat dicari, dan dapat dibagikan.

---

## 3. Target User & Use Cases

### 3.1 Target Pengguna

1. **Prompt Engineers**: Profesional yang fokus membuat dan mengoptimalkan prompt untuk LLM
2. **AI Developers**: Developer yang mengintegrasikan AI ke aplikasi dan perlu menyimpan system prompt
3. **Content Creators**: Penulis yang menggunakan AI untuk pembuatan konten
4. **Pelajar/Hobiis**: Siapapun yang bereksperimen dengan AI (ChatGPT, Claude, Gemini)

### 3.2 Use Cases Utama

#### Use Case 1: Menyimpan Prompt Baru
- **Actor**: Authenticated user
- **Precondition**: User sudah login
- **Flow**:
  1. User klik "New Prompt" atau tekan `Ctrl+N`
  2. User mengetik konten prompt di editor markdown
  3. User menambahkan judul (opsional, auto-generated jika kosong)
  4. User menambahkan tags (opsional, comma-separated)
  5. User memilih visibility (public/private)
  6. User klik "Save" atau tekan `Ctrl+S`
- **Postcondition**: Prompt tersimpan di database dengan RLS protection

#### Use Case 2: Mencari dan Memfilter Prompt
- **Actor**: Authenticated user
- **Precondition**: User sudah login dan memiliki beberapa prompt
- **Flow**:
  1. User mengetik di search box atau tekan `Ctrl+F`
  2. Sistem melakukan server-side search di title, body, dan tags
  3. User memilih filter tag dari sidebar (desktop) atau filter button (mobile)
  4. User memilih visibility filter (all/public/private)
  5. Sistem menampilkan hasil dengan pagination
- **Postcondition**: User melihat prompt yang sesuai dengan kriteria

#### Use Case 3: Berbagi Prompt Publik
- **Actor**: Authenticated user
- **Precondition**: User memiliki prompt yang ingin dibagikan
- **Flow**:
  1. User membuat atau mengedit prompt
  2. User toggle visibility ke "Public"
  3. User save prompt
  4. User klik "Share" untuk copy link
  5. Link dapat diakses tanpa login di `/share/:id`
- **Postcondition**: Prompt dapat diakses publik melalui link unik

#### Use Case 4: Melihat Prompt Publik
- **Actor**: Anonymous atau authenticated user
- **Precondition**: Ada prompt publik yang dibagikan
- **Flow**:
  1. User mengakses link `/share/:id` atau landing page
  2. Sistem menampilkan prompt dengan markdown rendering
  3. User dapat copy prompt content atau sharing link
  4. User dapat melihat recent prompts di sidebar
- **Postcondition**: User dapat melihat dan menggunakan prompt publik

---

## 4. Ruang Lingkup Fitur

### 4.1 In-Scope (Fitur yang Terimplementasi)

#### 4.1.1 Authentication & User Management ✅
- Email/password authentication via Supabase Auth
- User registration dengan auto-generated username
- Display name opsional
- Auto-logout setelah 27 menit idle
- Session management dengan auto-refresh
- Protected routes dengan React Router
- Rate limiting handling dengan exponential backoff

#### 4.1.2 Prompt Management (CRUD) ✅
- **Create**: Membuat prompt baru dengan title, markdown content, tags, dan visibility
- **Read**: Melihat daftar prompt dengan pagination, detail view dalam modal
- **Update**: Mengedit prompt (title, content, tags, visibility) dengan optimistic updates
- **Delete**: Menghapus prompt dengan confirmation dialog
- Auto-title generation dari konten jika kosong

#### 4.1.3 Markdown Editor ✅
- TipTap-based WYSIWYG editor
- Preview mode untuk melihat hasil render
- Syntax highlighting dengan Lowlight (100+ bahasa)
- Formatting: bold, italic, underline, strikethrough, headings, lists, blockquotes, code blocks
- Konversi otomatis antara TipTap JSON dan Markdown
- Paste handler yang membersihkan formatting eksternal

#### 4.1.4 Tag System ✅
- User-specific tags (setiap user punya tag sendiri)
- Multiple tags per prompt (comma-separated input)
- Auto-create tags jika belum ada
- Filter berdasarkan tag dengan real-time search
- Sidebar filter untuk desktop, mobile filter button
- Case-insensitive tag search

#### 4.1.5 Search & Filtering ✅
- Server-side search via RPC function (`search_prompts`)
- Search di title, body, dan tag names
- Filter berdasarkan tag (exact match)
- Filter berdasarkan visibility (all/public/private)
- Combined filters (tag + visibility)
- Server-side pagination dengan configurable page size
- Debounced search input (300ms)

#### 4.1.6 Public Sharing ✅
- Public/Private visibility toggle
- Public prompt view di `/share/:id` (accessible tanpa login)
- Landing page dengan recent public prompts (10 terbaru)
- Copy prompt content dengan satu klik
- Copy sharing link dengan satu klik
- Recent prompts sidebar di public view
- SEO optimization dengan structured data (JSON-LD)

#### 4.1.7 Internationalization ✅
- Dukungan Bahasa Indonesia (`id`) dan Inggris (`en`)
- Auto-detection bahasa browser via i18next-browser-languagedetector
- Fully localized UI dengan react-i18next
- Semua teks user-facing ter-translate
- Fallback ke bahasa Inggris jika tidak didukung

#### 4.1.8 User Experience Features ✅
- Command palette (`Ctrl+K`) untuk quick actions
- Keyboard shortcuts: `Ctrl+N` (new), `Ctrl+S` (save), `Ctrl+F` (focus search), `Ctrl+/` (shortcuts help), `Escape` (close modals)
- Toast notifications untuk feedback
- Loading states dan error handling
- Confirmation dialogs untuk destructive actions
- Responsive design (mobile-first)
- SEO optimization dengan react-helmet-async

#### 4.1.9 Information Pages ✅
- About page (`/about`): Informasi tentang aplikasi
- FAQ page (`/faq`): Frequently Asked Questions
- Use Cases page (`/use-cases`): Contoh penggunaan aplikasi

### 4.2 Out-of-Scope (Fitur yang Tidak Terimplementasi)

#### 4.2.1 Dark Mode Toggle UI ❌
- **Status**: Infrastructure ada (next-themes) tapi UI toggle belum ada
- **Note**: Theme provider sudah di-setup tapi tidak ada UI untuk switch theme

#### 4.2.2 Auto-save & Draft Management ❌
- Tidak ada auto-save saat mengedit
- Tidak ada draft management
- Tidak ada conflict resolution
- **Note**: Save adalah manual action dengan button atau `Ctrl+S`

#### 4.2.3 Version History ❌
- Tidak ada tracking perubahan prompt
- Tidak ada diff view
- Tidak ada rollback ke versi sebelumnya
- **Note**: Hanya `updated_at` timestamp, tidak ada versioning

#### 4.2.4 Collections/Folders ❌
- Tidak ada grouping selain tag
- Tidak ada nested folders
- Tidak ada drag & drop organization
- **Note**: Organisasi hanya melalui tag system

#### 4.2.5 Forking & Collaboration ❌
- Tidak ada fitur fork prompt publik
- Tidak ada comments pada public prompts
- Tidak ada collaboration features
- Tidak ada credit attribution untuk forked prompts
- **Note**: Sharing hanya melalui public link, tidak ada fork mechanism

#### 4.2.6 Browser Extension ❌
- Tidak ada ekstensi browser
- Tidak ada quick save dari ChatGPT/Claude/Gemini
- Tidak ada one-click import
- **Note**: Semua operasi melalui web interface

#### 4.2.7 Analytics Dashboard ❌
- Tidak ada dashboard analytics
- Tidak ada total prompts count display
- Tidak ada public vs private distribution chart
- Tidak ada most used tags visualization
- Tidak ada recent activity timeline
- Tidak ada prompt creation trends
- **Note**: Ada database functions (`increment_ai_usage`, `increment_user_usage`) tapi tidak ada UI untuk menampilkan analytics

#### 4.2.8 Export/Import ❌
- Tidak ada export prompts (JSON, Markdown)
- Tidak ada import prompts dari file
- Tidak ada bulk operations (delete, tag, visibility)
- Tidak ada backup/restore functionality
- **Note**: Data hanya accessible melalui web interface

#### 4.2.9 Advanced Search Operators ❌
- Tidak ada search dengan operators (AND, OR, NOT)
- Tidak ada filter by date range
- Tidak ada filter by author
- Tidak ada saved searches
- **Note**: Search hanya menggunakan text matching (ILIKE) di title, body, dan tags

#### 4.2.10 Real-time Features ❌
- Tidak ada real-time updates
- Tidak ada live collaboration
- **Note**: Supabase real-time capabilities ready tapi belum diimplementasikan

---

## 5. Alur Pengguna Utama

### 5.1 Alur Registration & First Use

```
1. User mengakses aplikasi
2. Landing page menampilkan recent public prompts
3. User klik "Register" atau "Login"
4. User mengisi email, password, dan display name (opsional)
5. Sistem membuat user profile dengan auto-generated username
6. User di-redirect ke authenticated view
7. User melihat empty state atau prompt list
```

### 5.2 Alur Create & Organize Prompt

```
1. User klik "New Prompt" atau tekan Ctrl+N
2. User mengetik konten di markdown editor
3. User menambahkan title (opsional)
4. User menambahkan tags (comma-separated)
5. User memilih visibility (public/private)
6. User klik "Save" atau tekan Ctrl+S
7. Prompt tersimpan dan muncul di list
8. User dapat filter berdasarkan tag atau visibility
```

### 5.3 Alur Search & Filter

```
1. User mengetik di search box atau tekan Ctrl+F
2. Sistem melakukan server-side search (debounced 300ms)
3. User memilih filter tag dari sidebar (desktop) atau filter button (mobile)
4. User memilih visibility filter (all/public/private)
5. Sistem menampilkan hasil dengan pagination
6. User dapat klik prompt untuk melihat detail
```

### 5.4 Alur Share Public Prompt

```
1. User membuat atau mengedit prompt
2. User toggle visibility ke "Public"
3. User save prompt
4. User klik "Share" button
5. Sistem copy link ke clipboard
6. User dapat share link ke komunitas
7. Link dapat diakses tanpa login di /share/:id
```

### 5.5 Alur View Public Prompt

```
1. User mengakses link /share/:id atau landing page
2. Sistem fetch prompt dari database (public only)
3. Sistem render markdown dengan syntax highlighting
4. User dapat copy prompt content
5. User dapat copy sharing link
6. User dapat melihat recent prompts di sidebar
```

---

## 6. Prinsip UX & Desain

### 6.1 Design Philosophy

- **Modern & Clean**: Aesthetic modern dengan whitespace yang cukup dan tipografi jelas
- **Mobile-First**: Responsive design dengan mobile-first approach
- **Consistency**: Design system dengan shadcn/ui dan Tailwind CSS tokens
- **Accessibility**: Partial support (semantic HTML, keyboard navigation partial, screen reader support partial)

### 6.2 User Experience Principles

- **Fast & Responsive**: Optimistic updates, debounced search, server-side pagination
- **Clear Feedback**: Toast notifications, loading states, error messages
- **Error Prevention**: Confirmation dialogs untuk destructive actions
- **Progressive Disclosure**: Command palette untuk advanced features, keyboard shortcuts untuk power users

### 6.3 Visual Design

- **Typography**: Inter untuk body, JetBrains Mono untuk code
- **Colors**: Tailwind CSS default palette dengan theme support (light mode only)
- **Icons**: Lucide React icon library
- **Layout**: Flexbox dan Grid untuk responsive layout

### 6.4 Responsive Breakpoints

- **Mobile**: < 768px (mobile-first)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 7. Kebutuhan Teknis Tingkat Tinggi

### 7.1 Architecture Patterns

- **Component-based Architecture**: Reusable React components dengan single responsibility
- **Custom Hooks**: Logic separation (usePrompts, useAuth, useIdleLogout, useCommandPalette, dll)
- **Type Safety**: Full TypeScript coverage dengan generated Supabase types
- **State Management**: 
  - React Query untuk server state dengan caching
  - useState untuk UI state
  - React Hook Form untuk form management

### 7.2 Security Requirements

- **Row Level Security (RLS)**: Database-level access control pada semua tabel
- **Authentication**: Supabase Auth dengan secure session management
- **Input Validation**: Client-side (Zod) dan database constraints
- **XSS Protection**: React's built-in escaping dan sanitization
- **CSP Headers**: Content Security Policy di production build
- **Rate Limiting Handling**: Exponential backoff untuk error handling

### 7.3 Performance Requirements

- **Code Splitting**: Manual chunks (vendor-react, vendor-ui, vendor-supabase, vendor-utils)
- **Server-side Pagination**: Efficient data loading dengan configurable page size
- **React Query Caching**: Intelligent caching dengan staleTime (1 minute untuk prompts, 5 minutes untuk queries)
- **Debounced Search**: 300ms debounce untuk search input
- **Lazy Loading**: Route-based code splitting untuk info pages

### 7.4 Database Requirements

- **PostgreSQL**: Relational database dengan Supabase
- **RLS Policies**: Public read untuk public prompts, owner write untuk semua resources
- **Indexes**: Optimized untuk search, filtering, dan pagination
- **RPC Functions**: Server-side search functions untuk performance
- **Migrations**: Versioned migrations dengan rollback capability

### 7.5 Browser Compatibility

- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: Latest version
- **Edge**: Latest version

---

## 8. Risiko & Asumsi

### 8.1 Technical Risks

#### 8.1.1 Dependency pada Supabase
- **Risk**: Vendor lock-in pada Supabase sebagai BaaS
- **Mitigation**: Database schema dapat di-migrate ke PostgreSQL standalone jika diperlukan
- **Impact**: Medium

#### 8.1.2 Rate Limiting dari Supabase
- **Risk**: Supabase rate limiting dapat mempengaruhi user experience
- **Mitigation**: Exponential backoff retry logic sudah diimplementasikan
- **Impact**: Low (sudah handled)

#### 8.1.3 Browser Compatibility
- **Risk**: Fitur modern mungkin tidak support di browser lama
- **Mitigation**: Target browser modern (Chrome, Firefox, Safari, Edge latest)
- **Impact**: Low

### 8.2 Business Risks

#### 8.2.1 User Adoption
- **Risk**: User mungkin tidak mengadopsi platform karena sudah punya workflow sendiri
- **Mitigation**: Focus pada value proposition (centralized, organized, shareable)
- **Impact**: Medium

#### 8.2.2 Data Privacy Concerns
- **Risk**: User mungkin khawatir dengan data privacy
- **Mitigation**: RLS policies, private prompts by default, clear privacy policy
- **Impact**: Low (security sudah diimplementasikan)

### 8.3 Assumptions

1. **User memiliki akses internet**: Aplikasi adalah web-based, memerlukan koneksi internet
2. **User familiar dengan markdown**: Editor menggunakan markdown, user perlu familiar dengan format
3. **Supabase service availability**: Aplikasi bergantung pada Supabase untuk backend
4. **Modern browser**: User menggunakan browser modern dengan JavaScript enabled

---

## 9. Kriteria Keberhasilan

### 9.1 Functional Success Criteria

- ✅ **Authentication**: User dapat register, login, dan logout dengan sukses
- ✅ **CRUD Operations**: User dapat create, read, update, dan delete prompt
- ✅ **Search & Filter**: User dapat mencari dan memfilter prompt dengan efektif
- ✅ **Public Sharing**: User dapat share prompt publik dan accessible tanpa login
- ✅ **Multi-language**: UI fully localized dalam Bahasa Indonesia dan Inggris

### 9.2 Technical Success Criteria

- ✅ **Performance**: Initial load < 2 detik, interactions < 100ms
- ✅ **Security**: RLS enabled, no unauthorized access, rate limiting handled
- ✅ **Code Quality**: TypeScript strict mode, ESLint passing, no critical bugs
- ✅ **Browser Compatibility**: Works pada Chrome, Firefox, Safari, Edge latest

### 9.3 User Experience Success Criteria

- ✅ **Usability**: User dapat menyelesaikan core tasks tanpa confusion
- ✅ **Responsiveness**: Aplikasi responsive di mobile, tablet, dan desktop
- ✅ **Error Handling**: User-friendly error messages dan recovery
- ✅ **Accessibility**: Partial accessibility support (semantic HTML, keyboard navigation)

### 9.4 Metrics (Future)

- Number of registered users
- Active users (DAU/MAU)
- Prompts created per user
- Public vs Private ratio
- Search frequency
- Sharing frequency

---

## 10. Appendix

### 10.1 Glossary

- **Prompt**: Instruksi atau teks yang diberikan ke AI model
- **Tag**: Label untuk mengorganisir prompts (user-specific)
- **Public Prompt**: Prompt yang dapat diakses oleh semua user melalui link
- **Private Prompt**: Prompt yang hanya dapat diakses oleh owner
- **RLS**: Row Level Security - database-level access control
- **RPC**: Remote Procedure Call - database function untuk server-side operations

### 10.2 Technical References

- [Supabase Documentation](https://supabase.com/docs)
- [TipTap Documentation](https://tiptap.dev)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com)

### 10.3 Database Schema

Lihat `supabase/migrations/20250129000000_baseline.sql` untuk schema dasar; `20250129000001_search_functions.sql` dan `20250129000002_get_public_tag_counts.sql` untuk RPC. Detail lengkap di [supabase/README.md](../supabase/README.md).

**Core Tables:**
- `users`: User profiles
- `prompts`: Prompt metadata
- `prompt_contents`: Prompt body (separated for optimization)
- `tags`: User-specific tags
- `prompt_tags`: Many-to-many relation

**Database Functions:**
- `search_prompts`: Server-side search untuk authenticated users
- `search_public_prompts`: Server-side search untuk public prompts
- `increment_ai_usage`: Analytics tracking
- `increment_user_usage`: User activity tracking

### 10.4 Change Log

**v1.0 (20 Desember 2025)**
- Initial PRD document berdasarkan implementasi aktual
- Documented semua fitur yang terimplementasi
- Documented semua fitur yang tidak terimplementasi (out-of-scope)
- Based on comprehensive codebase analysis

---

**End of Document**
