# Prompedia AI - Prompt Engineering Laboratory

**Prompedia AI** adalah platform prompt engineering canggih yang dirancang sebagai laboratorium digital untuk eksperimen dan pengembangan prompt AI. Aplikasi ini menyediakan framework terstruktur untuk prompt engineering dengan dukungan multiple AI models dan berbagai teknik thinking modes.

## 🚀 Core Features

### 🧠 AI Lab Playground
- **6 Thinking Modes**: Meta Prompt, Self-Refine, Chain-of-Thought, Self-Consistency, Chain-of-Prompt, Role Prompt
- **5 Quick Actions**: Refine, Expand, Reimagine, Reformat, Self-Review
- **Real-time AI Processing**: Transform content langsung dengan berbagai model AI
- **Mode-aware Actions**: Actions yang disesuaikan dengan thinking mode yang dipilih

### 📚 Library Management System
- **Private Library**: Koleksi prompt pribadi dengan pencarian dan filter canggih
- **Public Library**: Bagikan dan temukan prompt dari komunitas
- **Smart Organization**: Tag system dengan junction table dan visual indicators
- **CRUD Operations**: Create, Read, Update, Delete dengan validasi lengkap

### 🤖 AI Model Integration
- **OpenRouter API**: Akses berbagai model AI premium dengan fallback system
- **4 Model Terintegrasi**: Llama 4 Maverick, Qwen 3 30B, Qwen 2.5 72B, Llama 3.1 70B
- **Capability-based Selection**: Pilih model berdasarkan kemampuan (Text, Image, Vision, Code, Math, dll)
- **Model Fallback**: Automatic fallback jika model utama tidak tersedia

### 🔐 Authentication & Rate Limiting
- **Supabase Auth**: Industry-standard authentication dengan OAuth 2.0
- **Rate Limiting**: 7 calls untuk guest, 27 calls untuk authenticated users per hari
- **Session Management**: Tracking penggunaan AI dengan analytics
- **Guest Mode**: Akses terbatas tanpa registrasi

### 🎨 Modern UI/UX
- **Engineering-Focused**: Interface yang dioptimalkan untuk workflow prompt engineering
- **Responsive Design**: Berfungsi optimal di desktop dan mobile
- **Collapsible Sidebar**: Navigation yang intuitif dengan visual cues
- **Real-time Feedback**: Status indicators, loading states, dan toast notifications

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** dengan TypeScript strict mode
- **Vite 5.4.19** sebagai build tool dengan SWC
- **shadcn/ui** + **Tailwind CSS 3.4.17** untuk styling
- **Radix UI** untuk komponen primitif yang accessible
- **React Router DOM 6.30.1** untuk routing
- **TanStack Query 5.83.0** untuk server state management
- **React Hook Form 7.61.1** + **Zod 3.25.76** untuk form validation
- **Lucide React** untuk icon system

### Backend & Database
- **Supabase Cloud** untuk authentication dan database (production-ready)
- **PostgreSQL** dengan Row Level Security (RLS)
- **Edge Functions** untuk AI processing dan rate limiting
- **MCP Supabase** untuk semua operasi database dan migrasi
- **Local Storage** untuk persistence fallback

### AI Integration
- **OpenRouter API** untuk akses multiple AI models
- **Edge Functions** untuk AI processing dengan rate limiting
- **Model Fallback System** untuk reliability
- **Usage Analytics** untuk tracking dan optimization

### Development & Quality
- **TypeScript 5.8.3** dengan strict configuration
- **ESLint 9.32.0** + **TypeScript ESLint** untuk code quality
- **Vitest 3.2.4** untuk testing framework
- **PostCSS** + **Autoprefixer** untuk CSS processing
- **Lovable Tagger** untuk component tracking

## 🔧 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** package manager
- **OpenRouter API Key** - [Get from OpenRouter](https://openrouter.ai/)

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd prompedia-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
```bash
# Create .env file
touch .env

# Add your OpenRouter API key
echo "VITE_OPENROUTER_API_KEY=your_api_key_here" >> .env
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:8080`

### Environment Variables
```env
# Required
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Optional (for production)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 User Guide

### 🔐 Authentication & Access
- **Guest Mode**: 7 AI calls per hari, browse public prompts tanpa login
- **Authenticated Users**: 27 AI calls per hari, full access ke semua fitur
- **Rate Limiting**: Automatic tracking dengan reset harian
- **Session Management**: Persistent login dengan Supabase Auth

### 📚 Library Management System

#### Private Library
- **Personal Collection**: Private prompts dengan full CRUD operations
- **Advanced Search**: Find prompts by title, description, atau content
- **Tag System**: Organize dengan junction table dan color coding
- **Grid View**: Visual card layout dengan metadata dan status indicators
- **Auto-save**: Changes tersimpan otomatis dengan debouncing

#### Public Library
- **Community Content**: Shared prompts dari semua users
- **Discovery**: Browse dan find useful prompts dengan filter
- **Copy Feature**: Fork public prompts ke personal library
- **Social Features**: Share prompts dengan community
- **User Attribution**: Track creator dan usage statistics

### 🧠 AI Lab Playground

#### Thinking Modes Framework
Pilih mode berpikir yang sesuai dengan tujuan Anda:

| Mode | Icon | Tujuan | Pola Berpikir | Output Structure |
|------|------|--------|--------------|------------------|
| **Meta Prompt** | 🪄 | Generate prompts from ideas | Divergent thinking | Tujuan, Instruksi, Format |
| **Self-Refine** | ✏️ | Improve existing prompts | Reflective thinking | Analisis, Versi Baru, Alasan |
| **Chain-of-Thought** | 🧠 | Show reasoning process | Analytical reasoning | Langkah Berpikir, Jawaban |
| **Self-Consistency** | 🧬 | Test prompt stability | Comparative reasoning | Multiple Paths, Analisis, Versi Terbaik |
| **Chain-of-Prompt** | 🔄 | Develop prompts iteratively | Iterative synthesis | v1, v2, v3, Changelog |
| **Role Prompt** | 🤝 | Analyze from personas | Dialogic reasoning | Persona, Analisis, Rekomendasi |

#### Quick Actions System
Transform content dengan mode-aware actions:

| Action | Icon | Fungsi | Hasil | Mode Integration |
|--------|------|--------|-------|------------------|
| **Refine** | ✏️ | Improve clarity | Content lebih fokus | Menggunakan thinking pattern mode |
| **Expand** | 🧩 | Add context | Content lebih detail | Elaborasi sesuai mode |
| **Reimagine** | 🪄 | Creative reinterpretation | Perspektif baru | Kreativitas mode-aware |
| **Reformat** | 🧾 | Change structure | Format lebih baik | Struktur sesuai mode |
| **Self-Review** | 🪞 | Quality assessment | Evaluasi objektif | Metacognitive analysis |

#### AI Models & Capabilities
Pilih model berdasarkan kemampuan dan use case:

| Model | Provider | Type | Capabilities | Best For |
|-------|----------|------|--------------|----------|
| **Llama 4 Maverick** | OpenRouter | Multimodal | Text, Image, Vision, Bilingual | Creative tasks, multimodal |
| **Qwen 3 30B** | OpenRouter | Text | Code, Math, Long Context | Technical, analytical |
| **Qwen 2.5 72B** | OpenRouter | Text | Code, Math, Long Context | Complex reasoning |
| **Llama 3.1 70B** | OpenRouter | Text | Conversational, Reasoning | General purpose |

### 🎯 Workflow & Best Practices

#### Prompt Engineering Workflow
1. **Pilih Mode**: Select thinking mode yang sesuai dengan tujuan
2. **Tulis Content**: Masukkan prompt atau idea mentah
3. **Apply Actions**: Klik action buttons untuk transform content
4. **Iterate**: Refine hasil dengan berbagai actions dan modes
5. **Save & Organize**: Simpan ke library dengan tags yang relevan
6. **Share**: Publish ke public library untuk community

#### Rate Limiting Strategy
- **Guest Users**: 7 calls per hari (reset setiap 00:00 GMT+7)
- **Authenticated Users**: 27 calls per hari dengan tracking
- **Usage Warnings**: Notifikasi saat mendekati limit
- **Fallback System**: Model fallback untuk reliability

### 💾 Data Architecture

#### Storage Strategy
- **Supabase Cloud**: Production-ready backend dengan PostgreSQL
- **Row Level Security**: Data isolation dan security
- **Local Storage**: Fallback untuk offline capability
- **Auto-sync**: Automatic sync antara local dan cloud storage

#### Database Schema
- **Minimalist Design**: 8 tabel dengan schema yang efisien
- **Junction Tables**: Many-to-many relationships untuk tags
- **RLS Policies**: 19 policies untuk security
- **Edge Functions**: AI processing dan rate limiting

## 🗄️ Database Architecture

### Database Schema Overview
Aplikasi menggunakan **PostgreSQL** dengan **Supabase** sebagai backend-as-a-service:

#### Core Tables
- **`users`**: User profiles dengan role-based access
- **`prompts`**: Main content table dengan metadata
- **`tags`**: Tag management dengan color coding
- **`prompt_tags`**: Junction table untuk many-to-many relationships
- **`ai_models`**: AI model configurations
- **`thinking_modes`**: Thinking mode definitions
- **`user_sessions`**: Analytics dan session tracking

#### Security Features
- **Row Level Security (RLS)**: Data isolation per user
- **JWT Authentication**: Secure session management
- **API Rate Limiting**: Built-in rate limiting untuk AI calls
- **Input Validation**: Zod schemas untuk data validation

#### Performance Optimizations
- **Indexed Queries**: Optimized untuk common operations
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: React Query untuk client-side caching
- **Edge Functions**: Serverless functions untuk AI processing

### MCP Supabase Integration
Aplikasi menggunakan **MCP Supabase** untuk semua operasi database:

- **✅ Cloud-First**: Semua migrasi dilakukan langsung ke Supabase Cloud
- **✅ No Local Migrations**: File migrasi lokal telah dihapus untuk mencegah konflik
- **✅ RLS Security**: Row Level Security aktif untuk perlindungan data
- **✅ Production Ready**: Database siap untuk production dengan performa optimal

### Database Operations
```typescript
// Example: Save prompt dengan automatic storage selection
await storageManager.savePrompt(prompt);

// Example: Get prompts dengan authentication check
const prompts = await storageManager.getPrompts();

// Example: Rate limiting check
const canMakeCall = await rateLimitingService.canMakeAICall(user);
```

## 🚀 Deployment

### Lovable Platform (Recommended)
1. Open [Lovable Project](https://lovable.dev/projects/2129eae4-ed2f-4bf3-9d93-1b5a515e2c54)
2. Click **Share → Publish**
3. Your app will be deployed with automatic SSL and CDN

### Manual Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your hosting platform (Vercel, Netlify, etc.)
```

### Environment Variables for Production
Set these in your hosting platform:
```env
VITE_OPENROUTER_API_KEY=your_production_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
prompedia-ai/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── ActionButtons.tsx   # Quick action buttons
│   │   ├── AuthModal.tsx       # Authentication modal
│   │   ├── ModelSelector.tsx   # AI model selection
│   │   ├── ModeSelector.tsx    # Thinking mode selection
│   │   ├── PromptEditor.tsx    # Main playground editor
│   │   ├── MyLibrary.tsx       # Private library view
│   │   ├── PublicLibrary.tsx   # Public library view
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── TagInput.tsx        # Tag input component
│   ├── lib/                    # Core logic and services
│   │   ├── actions.ts          # Quick action definitions
│   │   ├── api-config.ts       # OpenRouter API configuration
│   │   ├── constants.ts        # Application constants
│   │   ├── models.ts           # AI model configurations
│   │   ├── modes.ts            # Thinking mode definitions
│   │   ├── storage-manager.ts  # Unified storage management
│   │   ├── supabase-service.ts # Supabase operations
│   │   ├── rate-limiting.ts    # Rate limiting service
│   │   ├── tag-service.ts      # Tag management service
│   │   └── validation.ts       # Zod validation schemas
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   └── usePromptOperations.ts # Prompt operations hook
│   ├── integrations/           # External service integrations
│   │   └── supabase/           # Supabase client and types
│   ├── pages/                  # Route components
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── ai-processor/       # AI processing function
│   │   └── prompt-enhancer/    # Prompt enhancement function
│   └── config.toml             # Supabase configuration
├── public/                     # Static assets
├── dist/                       # Production build output
└── docs/                       # Documentation
```

## 🧪 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Run tests with UI

# Type Checking
npx tsc --noEmit     # Type check without emitting files
```

### Code Quality Standards
- **TypeScript Strict Mode**: Full type safety
- **ESLint Configuration**: Enforced code quality
- **Prettier Integration**: Consistent code formatting
- **Zod Validation**: Runtime type validation
- **Error Boundaries**: Graceful error handling

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Test features before submitting PR
- Follow the existing code structure and patterns
- Update documentation for new features

### Code Style
- Use functional components with hooks
- Implement proper error handling
- Add TypeScript types for all functions
- Use Zod for validation schemas
- Follow the established naming conventions

## 📊 Performance Metrics

### Bundle Size
- **Initial Bundle**: < 250KB gzipped
- **Code Splitting**: Lazy loading untuk routes
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Compressed images dan fonts

### API Performance
- **Response Time**: < 300ms P95 untuk AI calls
- **Rate Limiting**: 7 calls/guest, 27 calls/authenticated per day
- **Caching**: React Query untuk client-side caching
- **Fallback System**: Model fallback untuk reliability

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Row Level Security**: Database-level access control
- **Input Sanitization**: XSS protection
- **Rate Limiting**: API abuse prevention

### Data Protection
- **HTTPS Only**: All communications encrypted
- **Environment Variables**: Sensitive data in ENV
- **Input Validation**: Zod schemas untuk data validation
- **Error Handling**: No sensitive data in error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access dan API
- **shadcn/ui** untuk beautiful UI components
- **Radix UI** untuk accessible primitives
- **Supabase** untuk backend services dan authentication
- **Tailwind CSS** untuk styling system
- **Lovable** untuk rapid development platform
- **Vite** untuk fast build tool
- **React Query** untuk state management

## 📞 Support & Community

- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-username/prompedia-ai/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/your-username/prompedia-ai/discussions)
- **Documentation**: Check [Wiki](https://github.com/your-username/prompedia-ai/wiki) for detailed guides
- **Discord**: Join our community for real-time support

## 🚀 Roadmap

### Upcoming Features
- [ ] **Collaboration**: Real-time prompt sharing dan editing
- [ ] **Advanced Analytics**: Usage statistics dan performance metrics
- [ ] **Export/Import**: Backup dan migration tools
- [ ] **Template System**: Pre-built prompt templates
- [ ] **API Integration**: Direct integration dengan more AI providers
- [ ] **Plugin System**: Extensible thinking modes
- [ ] **Mobile App**: Native mobile application

### Performance Improvements
- [ ] **Offline Sync**: Sinkronisasi localStorage dengan database
- [ ] **Query Optimization**: Database query optimization
- [ ] **Caching Strategy**: Advanced caching mechanisms
- [ ] **Bundle Optimization**: Further bundle size reduction

---

**Prompedia AI** - Prompt Engineering Laboratory 🎯

*Empowering prompt engineers with advanced AI tools and structured thinking frameworks.*
