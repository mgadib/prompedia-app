# Prompedia AI

**Platform manajemen prompt AI untuk menyimpan, mengorganisir, dan berbagi prompt dengan komunitas.**

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.76-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

---

## Tujuan Aplikasi

Prompedia AI adalah aplikasi web untuk mengelola library prompt AI secara terpusat. Aplikasi ini memungkinkan pengguna untuk menyimpan, mengedit, mengorganisir, dan berbagi prompt AI dengan antarmuka yang modern dan intuitif.

## Target Pengguna

- **Prompt Engineers**: Profesional yang fokus pada pembuatan dan optimasi prompt untuk LLM
- **AI Developers**: Developer yang mengintegrasikan AI ke aplikasi dan perlu menyimpan system prompt
- **Content Creators**: Penulis yang menggunakan AI untuk pembuatan konten
- **Pelajar/Hobiis**: Siapapun yang bereksperimen dengan AI (ChatGPT, Claude, Gemini)

## Fitur Inti

### Manajemen Prompt
- **CRUD Lengkap**: Create, Read, Update, Delete prompt dengan validasi
- **Markdown Editor**: Editor berbasis TipTap dengan WYSIWYG dan preview mode
- **Syntax Highlighting**: Code blocks dengan Lowlight untuk 100+ bahasa pemrograman
- **Auto-title Generation**: Judul otomatis dari konten jika tidak diisi

### Organisasi & Pencarian
- **Sistem Tag**: User-specific tags dengan auto-create, multiple tags per prompt
- **Pencarian Server-side**: Search di title, body, dan tags via RPC function
- **Filtering**: Filter berdasarkan tag dan visibility (all/public/private)
- **Pagination**: Server-side pagination dengan configurable page size

### Visibilitas & Sharing
- **Public/Private Toggle**: Kontrol visibilitas prompt dengan satu klik
- **Public Sharing**: Link unik (`/share/:id`) untuk akses tanpa login
- **Landing Page**: Recent public prompts untuk non-authenticated users
- **Copy Functions**: Copy prompt content dan sharing link dengan satu klik

### Authentication & Security
- **Email/Password Auth**: Authentication via Supabase Auth
- **Auto-logout**: Logout otomatis setelah 27 menit idle
- **Row Level Security**: Database-level security dengan RLS policies
- **Rate Limiting Handling**: Exponential backoff untuk error handling

### User Experience
- **Command Palette**: Quick actions dengan `Ctrl+K`
- **Keyboard Shortcuts**: Global shortcuts (Ctrl+N, Ctrl+S, Ctrl+F, Ctrl+/, Escape)
- **Multi-language**: Bahasa Indonesia & Inggris dengan auto-detection
- **Responsive Design**: Mobile-first dengan adaptive layout
- **SEO Optimization**: Structured data (JSON-LD) dan meta tags
- **Info Pages**: About, FAQ, dan Use Cases pages

## Tech Stack

### Frontend
- **React 18.3** - UI library dengan hooks dan concurrent features
- **TypeScript 5.8** - Type safety dengan strict mode
- **Vite 7.3** - Build tool dengan HMR
- **React Router 6.30** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Component library berbasis Radix UI
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Editor & Content
- **TipTap 3.13** - Rich text editor framework
- **Lowlight 3.3** - Syntax highlighting
- **React Markdown 10.1** - Markdown rendering
- **Remark GFM 4.0** - GitHub Flavored Markdown support

### State Management
- **React Query 5.83** - Server state management dengan caching
- **React Hook Form 7.61** - Form management
- **Zod 3.25** - Schema validation

### Backend
- **Supabase 2.76** - Backend as a Service
- **PostgreSQL** - Relational database dengan RLS
- **Supabase Auth** - Authentication & authorization

### Internationalization
- **i18next 25.6** - i18n framework
- **react-i18next 16.2** - React bindings
- **i18next-browser-languagedetector 8.2** - Auto language detection

## Prerequisites

- **Node.js 20.19+ atau 22.12+** (required untuk Vite 7.3.0)
- **npm 10+** (atau package manager lainnya)

> **Catatan untuk Deployment**: Aplikasi ini menggunakan Nixpacks untuk build di Dokploy. Versi Node.js akan otomatis terdeteksi dari field `engines` di `package.json`.

## Cara Menjalankan

### Development

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**

Buat file `.env` di root project:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Setup database**

Jalankan migrations di Supabase SQL Editor:
- `supabase/migrations/20251219120000_baseline.sql`
- `supabase/migrations/20251219132432_add_search_indexes_to_prompts.sql`
- `supabase/migrations/20251219140000_add_search_prompts_function.sql`
- `supabase/migrations/20251220000000_add_search_public_prompts_function.sql`

4. **Run development server**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

### Build

```bash
# Production build
npm run build

# Development build (dengan source maps)
npm run build:dev

# Preview production build
npm run preview
```

Build output berada di folder `dist/`.

**Build Configuration:**
- Code splitting dengan manual chunks (vendor-react, vendor-ui, vendor-supabase, vendor-utils)
- Chunk size warning limit: 1000KB
- Source maps untuk debugging

## Prinsip Desain

### Arsitektur
- **Component-based**: Reusable React components dengan single responsibility
- **Custom Hooks**: Logic separation (usePrompts, useAuth, useIdleLogout, dll)
- **Type Safety**: Full TypeScript coverage dengan generated Supabase types
- **State Management**: React Query untuk server state, useState untuk UI state

### Security
- **Row Level Security (RLS)**: Database-level access control pada semua tabel
- **Input Validation**: Client-side (Zod) dan database constraints
- **XSS Protection**: React's built-in escaping dan sanitization
- **CSP Headers**: Content Security Policy di production build

### Performance
- **Code Splitting**: Manual chunks untuk optimal bundle size
- **Server-side Pagination**: Efficient data loading
- **React Query Caching**: Intelligent caching dengan staleTime
- **Lazy Loading**: Route-based code splitting ready

### Error Handling
- **Exponential Backoff**: Retry logic untuk rate limiting
- **User-friendly Messages**: Localized error messages
- **Structured Logging**: Error logging untuk debugging

## Batasan Aplikasi

Fitur berikut **tidak terimplementasi** dalam versi saat ini:

- **Dark Mode Toggle UI**: Infrastructure ada (next-themes) tapi UI toggle belum ada
- **Auto-save**: Tidak ada draft management atau auto-save
- **Version History**: Tidak ada tracking perubahan prompt
- **Collections/Folders**: Tidak ada grouping selain tag
- **Forking & Collaboration**: Tidak ada fitur fork atau comments
- **Browser Extension**: Tidak ada ekstensi browser
- **Analytics Dashboard**: Tidak ada dashboard analytics
- **Export/Import**: Tidak ada fitur export/import prompts
- **Advanced Search Operators**: Search hanya menggunakan text matching, tidak ada operators (AND, OR, NOT)

## Struktur Database

### Core Tables
- `users`: User profiles (id, username, display_name)
- `prompts`: Prompt metadata (id, user_id, title, is_public, timestamps)
- `prompt_contents`: Prompt body (prompt_id, body) - separated for optimization
- `tags`: User-specific tags (id, name, user_id)
- `prompt_tags`: Many-to-many relation (prompt_id, tag_id)

### Database Functions
- `search_prompts`: Server-side search untuk authenticated users
- `search_public_prompts`: Server-side search untuk public prompts
- `increment_ai_usage`: Analytics tracking
- `increment_user_usage`: User activity tracking

### Indexes
- Optimized untuk search, filtering, dan pagination
- Case-insensitive tag search
- Composite indexes untuk complex queries

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint rules (auto-run)
- Absolute imports dengan alias `@/`
- Functional components dengan hooks

### Database Changes
- **Semua perubahan database HARUS melalui Supabase MCP**
- Migration files di `supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.sql`

### Internationalization
- Semua teks user-facing harus di-i18n
- Translation files: `src/locales/en.json` dan `src/locales/id.json`
- Format: `t('namespace.key', 'fallback')`

## License

MIT License

---

**Dibuat dengan React, TypeScript, dan Supabase**
