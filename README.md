<div align="center">

<!-- Logo dengan SVG untuk kompatibilitas lebih baik -->
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
  <!-- Kotak pertama - gradient purple to teal -->
  <defs>
    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Kotak pertama -->
  <rect x="10" y="10" width="80" height="80" rx="12" fill="url(#gradient1)" transform="rotate(-5 50 50)" opacity="0.9"/>
  <!-- Kotak kedua -->
  <rect x="30" y="30" width="80" height="80" rx="12" fill="url(#gradient2)" transform="rotate(5 70 70)" opacity="0.9"/>
</svg>

# PROMPEDIA.AI

### Prompedia AI - Prompt Engineering Laboratory

**Platform Digital Terintegrasi untuk Manajemen dan Optimasi AI Prompts**

</div>

---

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-Powered-8B5CF6?style=for-the-badge&logo=openai&logoColor=white)

</div>

---

<div align="center">

*Menghadirkan teknologi AI untuk manajemen prompt yang efisien, editor markdown yang powerful, dan sistem sharing yang terintegrasi dalam pengelolaan library prompt AI.*

</div>

---

## 📑 Daftar Isi

- [✨ Tentang Prompedia AI](#-tentang-prompedia-ai)
- [🚀 Fitur Utama](#-fitur-utama)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
- [👥 Manajemen Pengguna](#-manajemen-pengguna)
- [🗄️ Struktur Database](#️-struktur-database)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📝 Development](#-development)
- [🏗️ Build & Deploy](#️-build--deploy)
- [🔒 Keamanan](#-keamanan)
- [📋 Roadmap](#-roadmap)

---

## ✨ Tentang Prompedia AI

**Prompedia AI** adalah platform modern untuk menyimpan, mengorganisir, dan menggunakan kembali AI prompts. Dibangun khusus untuk prompt engineers, AI developers, dan siapa saja yang bekerja dengan AI setiap hari.

### 🎯 Tujuan

Menyediakan solusi terintegrasi yang memungkinkan pengguna untuk:
- **Menyimpan** prompt AI dengan mudah dan cepat
- **Mengorganisir** library prompt dengan sistem tag yang fleksibel
- **Berbagi** prompt berkualitas dengan komunitas melalui link publik
- **Mengoptimalkan** workflow prompt engineering dengan editor markdown yang powerful

---

## 🚀 Fitur Utama

### 📝 **Editor Markdown Canggih**
- Editor markdown berbasis **TipTap** dengan WYSIWYG experience
- **Preview mode** untuk melihat hasil render markdown
- **Syntax highlighting** untuk code blocks menggunakan Lowlight
- Formatting lengkap: **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, headings, lists, blockquotes
- Konversi otomatis antara TipTap JSON dan Markdown
- Paste handler yang membersihkan formatting eksternal

### 🏷️ **Sistem Tag yang Fleksibel**
- Tambah multiple tag untuk mengorganisir prompt (pisahkan dengan koma)
- Tag bersifat user-specific (setiap user punya tag sendiri)
- Filter berdasarkan tag dengan real-time search
- Sidebar filter untuk navigasi cepat (desktop)
- Mobile filter button untuk akses mudah di mobile

### 🔐 **Manajemen Visibilitas**
- **Public Prompts**: Bagikan prompt dengan komunitas
- **Private Prompts**: Simpan prompt pribadi secara aman
- Toggle visibilitas dengan satu klik saat create/edit
- Filter berdasarkan visibilitas (All/Public/Private)
- Public prompts dapat diakses tanpa login melalui link sharing

### 🔍 **Pencarian & Filter Real-time**
- Pencarian instan di semua prompt (judul, konten, tag)
- Filter berdasarkan tag, visibilitas, dan tanggal
- Server-side pagination untuk performa optimal
- Client-side filtering fallback untuk kompleksitas tertentu

### 🌐 **Multi-language Support**
- Dukungan penuh **Bahasa Indonesia** dan **Inggris**
- Auto-detection bahasa browser menggunakan i18next-browser-languagedetector
- UI yang fully localized dengan react-i18next
- Semua teks user-facing ter-translate

### 🔗 **Sharing & Public Access**
- **Public Prompt View**: Halaman khusus untuk melihat prompt publik (`/share/:id`)
- Share prompt dengan link unik yang dapat diakses tanpa login
- Landing page menampilkan recent public prompts untuk non-authenticated users
- Copy prompt content dengan satu klik
- Copy sharing link dengan satu klik
- Recent prompts sidebar di public view

### 📱 **Responsive Design**
- Mobile-first design approach
- Optimized untuk semua device (desktop, tablet, mobile)
- Touch-friendly interface
- Adaptive layout dengan flexbox dan grid
- Mobile filter button untuk akses mudah

### 🔒 **Keamanan & Session Management**
- **Auto-logout** setelah 27 menit tidak aktif (idle timeout)
- Row Level Security (RLS) di database level
- Rate limiting handling dengan exponential backoff
- Secure session management via Supabase Auth
- Protected routes dengan React Router

### 📄 **Halaman Informasi**
- **About Page** (`/about`): Informasi tentang aplikasi
- **FAQ Page** (`/faq`): Frequently Asked Questions
- **Use Cases Page** (`/use-cases`): Contoh penggunaan aplikasi

### 🎨 **User Experience**
- Toast notifications untuk feedback user actions
- Loading states dan error handling
- Confirmation dialogs untuk destructive actions (delete, logout)
- Modal untuk detail prompt view
- SEO optimization dengan react-helmet-async
- Structured data (JSON-LD) untuk search engines

---

## 🏗️ Arsitektur Sistem

### **Frontend Architecture**

```
src/
├── components/          # Komponen React reusable
│   ├── auth/           # Authentication components
│   │   └── AuthScreen.tsx
│   ├── editor/         # Markdown editor components
│   │   ├── MarkdownEditor.tsx
│   │   ├── MarkdownPreview.tsx
│   │   ├── EditorToolbar.tsx
│   │   └── extensions.ts
│   ├── layout/         # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/          # Page components
│   │   ├── AboutPage.tsx
│   │   ├── FAQPage.tsx
│   │   └── UseCasesPage.tsx
│   ├── prompts/        # Prompt-related components
│   │   ├── PromptList.tsx
│   │   ├── PromptEditor.tsx
│   │   └── FilterBar.tsx
│   ├── ui/             # UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── prompt-card.tsx
│   │   ├── tag-chip.tsx
│   │   └── ...
│   ├── PromptNotes.tsx # Main application component
│   ├── PublicPromptView.tsx
│   └── SEO.tsx
├── hooks/              # Custom React hooks
│   ├── use-prompts.ts
│   └── use-idle-logout.ts
├── integrations/       # External integrations
│   └── supabase/       # Supabase client & types
│       ├── client.ts
│       └── types.ts
├── lib/                # Utility functions
│   ├── date-utils.ts
│   └── utils.ts
├── locales/            # i18n translation files
│   ├── en.json
│   └── id.json
├── App.tsx             # Root component with routing
├── main.tsx            # Entry point
└── i18n.ts             # i18n configuration
```

### **Backend Architecture**
- **Supabase** sebagai BaaS (Backend as a Service)
- **PostgreSQL** database dengan Row Level Security (RLS)
- **Supabase Auth** untuk authentication & authorization
- Real-time capabilities ready (belum diimplementasikan)
- Database functions untuk analytics (increment_ai_usage, increment_user_usage)

### **Key Design Patterns**
- **Component-based Architecture**: Reusable React components dengan single responsibility
- **Custom Hooks**: Logic separation dan reusability (usePrompts, useIdleLogout)
- **Type Safety**: Full TypeScript coverage dengan generated types dari Supabase
- **State Management**: 
  - React Query untuk server state management
  - Local state dengan useState untuk UI state
  - React Hook Form untuk form management
- **Error Handling**: Retry logic dengan exponential backoff untuk rate limiting
- **Performance**: Code splitting dengan manual chunks, lazy loading ready

---

## 👥 Manajemen Pengguna

### **Authentication**
- **Email & Password** authentication via Supabase Auth
- Secure session management dengan auto-refresh
- **Auto-logout** setelah 27 menit idle (configurable)
- Protected routes dengan React Router
- Rate limiting handling dengan user-friendly error messages

### **User Profile**
- **Username** unik untuk public identification
- **Display name** opsional untuk personalisasi
- User-specific prompt library (isolated per user)
- User-specific tags (setiap user punya tag sendiri)

### **Authorization**
- **Row Level Security (RLS)** di database level
- User hanya bisa edit/delete prompt miliknya
- Public prompts readable oleh semua authenticated users
- Public prompts accessible tanpa login melalui public view
- Private prompts hanya accessible oleh owner
- Tags bersifat user-specific dengan RLS

---

## 🗄️ Struktur Database

### **Core Tables**

#### `users`
- `id` (UUID, Primary Key) - Linked dengan Supabase Auth
- `username` (Text, Unique) - Username unik untuk identifikasi publik
- `display_name` (Text, nullable) - Nama tampilan opsional

#### `prompts`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `title` (Text, NOT NULL)
- `is_public` (Boolean, default: false)
- `created_at` (Timestamp with time zone)
- `updated_at` (Timestamp with time zone)

#### `prompt_contents`
- `prompt_id` (UUID, Primary Key/Foreign Key → prompts)
- `body` (Text, NOT NULL) - Markdown content
- `created_at` (Timestamp with time zone)

**Note**: Konten dipisah dari metadata untuk optimasi query (list view tidak perlu load konten)

#### `tags`
- `id` (UUID, Primary Key)
- `name` (Text, NOT NULL)
- `user_id` (UUID, Foreign Key → users, nullable)
- Unique constraint: `(name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))`

#### `prompt_tags`
- `prompt_id` (UUID, Foreign Key → prompts)
- `tag_id` (UUID, Foreign Key → tags)
- Composite Primary Key (prompt_id, tag_id)

### **Indexes untuk Performa**

- `users_username_key`: Unique index pada username
- `idx_tags_name_lower`: Case-insensitive tag search
- `idx_prompts_user_id`: Fast user prompt queries
- `idx_prompts_is_public`: Fast public prompt queries
- `idx_prompts_created_at`: Sorting by date
- `idx_prompts_public_id_desc`: Optimized public prompt listing
- `idx_prompt_tags_tag_prompt`: Fast tag filtering

### **Row Level Security (RLS)**

Semua tabel memiliki RLS enabled dengan policies:

- **users**: Public read, Owner write
- **prompts**: Public read (if `is_public = true`), Owner write
- **prompt_contents**: Public read (if prompt is public), Owner write
- **tags**: Public read, Owner write
- **prompt_tags**: Public read (if prompt is public), Owner write

### **Database Functions**

- `increment_ai_usage(p_is_guest, p_session_id, p_user_id)`: Track AI usage analytics
- `increment_user_usage(p_user_id)`: Track user activity

---

## 🛠️ Tech Stack

### **Frontend Core**
- **React 18.3** - UI library dengan hooks dan concurrent features
- **TypeScript 5.8** - Type safety dan developer experience
- **Vite 7.3** - Build tool yang cepat dan modern
- **React Router 6.30** - Client-side routing dengan future flags

### **UI & Styling**
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library (Radix UI based)
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **next-themes** - Theme management (light mode only currently)

### **Editor & Content**
- **TipTap 3.13** - Rich text editor framework
- **Lowlight 3.3** - Syntax highlighting untuk code blocks
- **React Markdown 10.1** - Markdown rendering
- **Remark GFM 4.0** - GitHub Flavored Markdown support

### **State Management & Forms**
- **React Query 5.83** - Server state management dengan caching
- **React Hook Form 7.61** - Form management
- **Zod 3.25** - Schema validation

### **Backend & Database**
- **Supabase 2.76** - Backend as a Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Database-level security

### **Internationalization**
- **i18next 25.6** - Internationalization framework
- **react-i18next 16.2** - React bindings untuk i18next
- **i18next-browser-languagedetector 8.2** - Auto language detection

### **Development Tools**
- **ESLint 9.32** - Code linting
- **TypeScript ESLint 8.38** - TypeScript-specific linting
- **Vitest 3.2** - Unit testing framework
- **Testing Library** - Component testing utilities
- **Lovable Tagger** - Component tagging untuk development

### **Other Libraries**
- **date-fns 3.6** - Date formatting utilities
- **sonner 1.7** - Toast notifications
- **react-helmet-async 2.0** - SEO management
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional class utilities

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js 18+** atau **Bun**
- **npm**, **yarn**, atau **bun** package manager
- **Supabase account** (untuk backend)
- **Git** (untuk clone repository)

### **Installation**

1. **Clone repository**
```bash
git clone <repository-url>
cd prompedia-ai
```

2. **Install dependencies**
```bash
npm install
# atau
yarn install
# atau
bun install
```

3. **Setup environment variables**

Buat file `.env` di root project:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Cara mendapatkan credentials:**
- Login ke [Supabase Dashboard](https://app.supabase.com)
- Pilih project Anda
- Buka Settings → API
- Copy `Project URL` dan `anon public` key

4. **Setup Supabase Database**

Jalankan migration di Supabase SQL Editor:
```bash
# Buka Supabase Dashboard → SQL Editor
# Jalankan file: supabase/migrations/20251219120000_baseline.sql
# Kemudian jalankan: supabase/migrations/20251219132432_add_search_indexes_to_prompts.sql
```

**Atau menggunakan Supabase CLI:**
```bash
# Install Supabase CLI terlebih dahulu
npm install -g supabase

# Link ke project
supabase link --project-ref your-project-ref

# Jalankan migrations
supabase db push
```

5. **Run development server**
```bash
npm run dev
# atau
yarn dev
# atau
bun run dev
```

6. **Open browser**
Buka `http://localhost:8080` di browser

**Note**: Aplikasi berjalan di port 8080 sesuai konfigurasi Vite.

---

## 📝 Development

### **Available Scripts**

```bash
# Development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development (dengan source maps)
npm run build:dev

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

### **Development Guidelines**

1. **Code Style**
   - Gunakan TypeScript strict mode
   - Ikuti ESLint rules (dijalankan otomatis)
   - Format dengan Prettier (disarankan auto-format on save)
   - Gunakan absolute imports dengan alias `@/`

2. **Component Structure**
   - Satu komponen per file
   - Export named untuk komponen utama
   - TypeScript interfaces untuk props
   - Gunakan functional components dengan hooks

3. **State Management**
   - Local state dengan `useState` untuk UI state
   - Server state dengan React Query (`useQuery`, `useMutation`)
   - Form state dengan React Hook Form
   - Custom hooks untuk logic yang reusable

4. **Styling**
   - Gunakan Tailwind CSS utility classes
   - shadcn/ui components untuk UI primitives
   - Custom CSS hanya jika diperlukan (di `index.css`)
   - Gunakan design tokens yang konsisten

5. **Internationalization**
   - Semua teks user-facing harus di-i18n
   - Tambahkan translations di `src/locales/en.json` dan `src/locales/id.json`
   - Gunakan `useTranslation` hook dari react-i18next
   - Format: `t('namespace.key', 'fallback')`

6. **Database Changes**
   - **Semua perubahan database HARUS melalui Supabase MCP**
   - Buat migration file di `supabase/migrations/`
   - Naming: `YYYYMMDDHHMMSS_description.sql`
   - Test migration di local sebelum push ke production

7. **Error Handling**
   - Handle errors dengan try-catch
   - Tampilkan user-friendly error messages
   - Log errors untuk debugging
   - Gunakan toast notifications untuk feedback

8. **Performance**
   - Gunakan React.memo untuk expensive components
   - Lazy load routes jika diperlukan
   - Optimize images dan assets
   - Monitor bundle size (target: < 250KB gzipped)

---

## 🏗️ Build & Deploy

### **Build untuk Production**

```bash
npm run build
```

Build output akan berada di folder `dist/`.

**Build Configuration:**
- Code splitting dengan manual chunks:
  - `vendor-react`: React core libraries
  - `vendor-ui`: UI component libraries
  - `vendor-supabase`: Supabase client
  - `vendor-utils`: Utility libraries
- Chunk size warning limit: 1000KB
- Source maps untuk debugging (production)

### **Deploy ke Vercel**

1. Connect repository ke Vercel
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy otomatis pada push ke main branch

### **Deploy ke Netlify**

1. Connect repository ke Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### **Deploy ke Supabase Hosting**

1. Build project: `npm run build`
2. Deploy ke Supabase:
```bash
supabase hosting deploy dist
```

### **Environment Variables untuk Production**

Pastikan set environment variables di hosting platform:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key

**Security Note**: Jangan expose service role key di frontend!

---

## 🔒 Keamanan

### **Security Features**

1. **Row Level Security (RLS)**
   - Semua tabel memiliki RLS enabled
   - User hanya bisa akses data miliknya
   - Public prompts accessible dengan policy yang tepat

2. **Authentication**
   - Secure session management via Supabase Auth
   - Auto-logout setelah idle timeout (27 menit)
   - Rate limiting handling

3. **Input Validation**
   - Client-side validation dengan Zod
   - Database constraints untuk data integrity
   - XSS protection via React's built-in escaping

4. **Content Security Policy (CSP)**
   - CSP headers di production build
   - Restricted script sources
   - Frame protection (X-Frame-Options: DENY)

5. **Secrets Management**
   - Environment variables untuk sensitive data
   - Never commit `.env` files
   - Use Supabase anon key (safe for frontend)

### **Best Practices**

- Gunakan parameterized queries (Supabase client handles this)
- Sanitize user input sebelum render
- Validate data di client dan server
- Monitor untuk suspicious activity
- Regular security audits

---

## 📋 Roadmap

### **Fitur yang Sudah Diimplementasikan** ✅

- [x] Authentication (Email/Password)
- [x] CRUD Prompts
- [x] Markdown Editor dengan Preview
- [x] Tag System
- [x] Public/Private Visibility
- [x] Public Prompt Sharing
- [x] Search & Filter
- [x] Multi-language Support (ID/EN)
- [x] Responsive Design
- [x] Auto-logout (Idle timeout)
- [x] SEO Optimization
- [x] About/FAQ/Use Cases Pages

### **Fitur yang Direncanakan** 🚧

- [ ] **AI-Powered Features**
  - [ ] Smart Tagging: Auto-generate tags dari konten prompt
  - [ ] AI Analysis: Evaluasi kualitas prompt dan saran perbaikan
  - [ ] Prompt Templates: Library template untuk berbagai use case

- [ ] **Version History**
  - [ ] Melacak perubahan pada prompt (v1, v2, dst)
  - [ ] Diff view untuk melihat perubahan
  - [ ] Rollback ke versi sebelumnya

- [ ] **Collections/Folders**
  - [ ] Grouping prompt selain menggunakan tag
  - [ ] Nested folders
  - [ ] Drag & drop organization

- [ ] **Forking & Collaboration**
  - [ ] Menyalin prompt publik orang lain ke library pribadi
  - [ ] Credit attribution untuk forked prompts
  - [ ] Comments pada public prompts

- [ ] **Browser Extension**
  - [ ] Ekstensi Chrome untuk menyimpan prompt langsung dari chat
  - [ ] Quick save dari ChatGPT/Claude/Gemini
  - [ ] One-click import

- [ ] **Analytics Dashboard**
  - [ ] Total prompts count
  - [ ] Public vs Private distribution
  - [ ] Most used tags
  - [ ] Recent activity timeline
  - [ ] Prompt creation trends

- [ ] **Advanced Features**
  - [ ] Dark mode toggle
  - [ ] Export prompts (JSON, Markdown)
  - [ ] Import prompts dari file
  - [ ] Bulk operations (delete, tag, visibility)
  - [ ] Keyboard shortcuts
  - [ ] Advanced search dengan operators

---

## 📄 License

MIT License - lihat file LICENSE untuk detail lengkap.

---

## 🤝 Contributing

Contributions are welcome! Silakan buat issue atau pull request.

**Guidelines:**
- Follow code style dan conventions
- Write tests untuk new features
- Update documentation
- Use Conventional Commits

---

## 📧 Contact & Support

Untuk pertanyaan atau dukungan:
- Buat issue di repository ini
- Email: [your-email]
- Website: [your-website]

---

<div align="center">

**Dibuat dengan ❤️ menggunakan React, TypeScript, dan Supabase**

[⭐ Star di GitHub](https://github.com) · [📖 Dokumentasi](https://github.com) · [🐛 Report Bug](https://github.com)

</div>
