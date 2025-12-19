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

# PROMEDIA.AI

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
- [🤖 Integrasi AI](#-integrasi-ai)
- [📊 Dashboard & Analytics](#-dashboard--analytics)
- [🗄️ Struktur Database](#️-struktur-database)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📝 Development](#-development)
- [🏗️ Build & Deploy](#️-build--deploy)

---

## ✨ Tentang Prompedia AI

**Prompedia AI** adalah platform modern untuk menyimpan, mengorganisir, dan menggunakan kembali AI prompts. Dibangun khusus untuk prompt engineers, AI developers, dan siapa saja yang bekerja dengan AI setiap hari.

### 🎯 Tujuan

Menyediakan solusi terintegrasi yang memungkinkan pengguna untuk:
- **Menyimpan** prompt AI dengan mudah dan cepat
- **Mengorganisir** library prompt dengan sistem tag yang fleksibel
- **Berbagi** prompt berkualitas dengan komunitas
- **Mengoptimalkan** workflow prompt engineering

---

## 🚀 Fitur Utama

### 📝 **Editor Markdown Canggih**
- Editor markdown berbasis TipTap dengan syntax highlighting
- Preview real-time saat mengetik
- Support untuk code blocks dengan syntax highlighting
- Formatting lengkap: bold, italic, underline, strikethrough, headings, lists, blockquotes

### 🏷️ **Sistem Tag yang Fleksibel**
- Tambah tag untuk mengorganisir prompt
- Filter berdasarkan tag dengan real-time search
- Tag cloud untuk navigasi cepat
- Tag otomatis berdasarkan konten

### 🔐 **Manajemen Visibilitas**
- **Public Prompts**: Bagikan prompt dengan komunitas
- **Private Prompts**: Simpan prompt pribadi secara aman
- Toggle visibilitas dengan satu klik
- Filter berdasarkan visibilitas (All/Public/Private)

### 🔍 **Pencarian & Filter Real-time**
- Pencarian instan di semua prompt
- Filter berdasarkan tag, visibilitas, dan tanggal
- Highlight hasil pencarian
- Pagination yang efisien

### 🌐 **Multi-language Support**
- Dukungan Bahasa Indonesia dan Inggris
- Auto-detection bahasa browser
- UI yang fully localized

### 🔗 **Sharing & Collaboration**
- Share prompt dengan link unik
- Public prompt library untuk browsing
- View prompt tanpa login (untuk public prompts)
- Copy prompt dengan satu klik

### 📱 **Responsive Design**
- Mobile-first design
- Optimized untuk semua device
- Touch-friendly interface
- PWA ready

---

## 🏗️ Arsitektur Sistem

### **Frontend Architecture**
```
src/
├── components/          # Komponen React reusable
│   ├── editor/         # Markdown editor components
│   ├── pages/          # Page components
│   └── ui/             # UI components (shadcn/ui)
├── integrations/        # External integrations
│   └── supabase/       # Supabase client & types
├── lib/                 # Utility functions
├── locales/            # i18n translation files
└── types/              # TypeScript type definitions
```

### **Backend Architecture**
- **Supabase** sebagai BaaS (Backend as a Service)
- PostgreSQL database dengan Row Level Security (RLS)
- Real-time subscriptions untuk live updates
- Authentication & Authorization terintegrasi

### **Key Design Patterns**
- **Component-based Architecture**: Reusable React components
- **Custom Hooks**: Logic separation dan reusability
- **Type Safety**: Full TypeScript coverage
- **State Management**: React Query untuk server state
- **Form Management**: React Hook Form dengan Zod validation

---

## 👥 Manajemen Pengguna

### **Authentication**
- Email & Password authentication via Supabase Auth
- Secure session management
- Auto-logout pada token expiry
- Protected routes dengan React Router

### **User Profile**
- Display name customization
- Username untuk public identification
- User-specific prompt library
- Activity tracking

### **Authorization**
- Row Level Security (RLS) di database level
- User hanya bisa edit/delete prompt miliknya
- Public prompts readable oleh semua user
- Private prompts hanya accessible oleh owner

---

## 🤖 Integrasi AI

### **AI-Powered Features**
- **Smart Tagging**: Auto-generate tags dari konten prompt
- **Content Analysis**: Analisis prompt untuk optimasi
- **Prompt Templates**: Library template untuk berbagai use case
- **Best Practices**: Rekomendasi berdasarkan prompt engineering best practices

### **Supported AI Models**
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- Custom model integration ready

---

## 📊 Dashboard & Analytics

### **Personal Dashboard**
- Total prompts count
- Public vs Private distribution
- Most used tags
- Recent activity timeline

### **Public Library**
- Browse public prompts
- Filter by tags
- Search functionality
- Pagination support

### **Statistics**
- Prompt creation trends
- Tag popularity
- Community contributions

---

## 🗄️ Struktur Database

### **Core Tables**

#### `prompts`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `title` (Text)
- `description` (Text, nullable)
- `is_public` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `prompt_contents`
- `id` (UUID, Primary Key)
- `prompt_id` (UUID, Foreign Key → prompts)
- `body` (Text, Markdown content)

#### `tags`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `name` (Text, unique per user)

#### `prompt_tags`
- `prompt_id` (UUID, Foreign Key → prompts)
- `tag_id` (UUID, Foreign Key → tags)
- Composite Primary Key (prompt_id, tag_id)

#### `users`
- `id` (UUID, Primary Key)
- `username` (Text, unique)
- `display_name` (Text, nullable)
- `email` (Text, from Supabase Auth)

### **Relationships**
- One-to-Many: User → Prompts
- One-to-Many: User → Tags
- Many-to-Many: Prompts ↔ Tags (via prompt_tags)
- One-to-One: Prompt → Prompt Content

### **Security**
- Row Level Security (RLS) enabled
- Users can only access their own private prompts
- Public prompts accessible to all authenticated users
- Unauthenticated users can view public prompts only

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.3** - UI library dengan hooks dan concurrent features
- **TypeScript 5.8** - Type safety dan developer experience
- **Vite 5.4** - Build tool yang cepat dan modern
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **React Router 6.30** - Client-side routing dengan future flags
- **React Query 5.83** - Server state management
- **React Hook Form 7.61** - Form management
- **Zod 3.25** - Schema validation

### **Editor & Content**
- **TipTap 3.13** - Rich text editor framework
- **Lowlight 3.3** - Syntax highlighting untuk code blocks
- **React Markdown 10.1** - Markdown rendering
- **Remark GFM 4.0** - GitHub Flavored Markdown support

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

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ atau Bun
- npm, yarn, atau bun package manager
- Supabase account (untuk backend)

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
bun install
```

3. **Setup environment variables**
Buat file `.env` di root project:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Setup Supabase Database**
Jalankan migration di Supabase:
```bash
# Lihat file di supabase/migrations/20251219120000_baseline.sql
# Jalankan SQL migration di Supabase SQL Editor
```

5. **Run development server**
```bash
npm run dev
# atau
bun run dev
```

6. **Open browser**
Buka `http://localhost:8080` di browser

---

## 📝 Development

### **Available Scripts**

```bash
# Development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
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
   - Ikuti ESLint rules
   - Format dengan Prettier (auto-format on save)

2. **Component Structure**
   - Satu komponen per file
   - Export named untuk komponen utama
   - TypeScript interfaces untuk props

3. **State Management**
   - Local state dengan `useState` untuk UI state
   - Server state dengan React Query
   - Form state dengan React Hook Form

4. **Styling**
   - Gunakan Tailwind CSS utility classes
   - shadcn/ui components untuk UI primitives
   - Custom CSS hanya jika diperlukan

5. **Internationalization**
   - Semua teks user-facing harus di-i18n
   - Tambahkan translations di `src/locales/`
   - Gunakan `useTranslation` hook

---

## 🏗️ Build & Deploy

### **Build untuk Production**

```bash
npm run build
```

Build output akan berada di folder `dist/`.

### **Deploy ke Vercel**

1. Connect repository ke Vercel
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy otomatis pada push ke main branch

### **Deploy ke Netlify**

1. Connect repository ke Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables
5. Deploy

### **Deploy ke Supabase Hosting**

1. Build project: `npm run build`
2. Deploy ke Supabase:
```bash
supabase hosting deploy dist
```

---

## 📄 License

MIT License - lihat file LICENSE untuk detail lengkap.

---

## 🤝 Contributing

Contributions are welcome! Silakan buat issue atau pull request.

---

## 📧 Contact

Untuk pertanyaan atau dukungan, silakan buat issue di repository ini.

---

<div align="center">

**Dibuat dengan ❤️ menggunakan React, TypeScript, dan Supabase**

[⭐ Star di GitHub](https://github.com) · [📖 Dokumentasi](https://github.com) · [🐛 Report Bug](https://github.com)

</div>
