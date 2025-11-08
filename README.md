# Prompedia AI - Prompt Engineering Laboratory

**Prompedia AI** is an advanced prompt engineering platform designed as a digital laboratory for AI prompt experimentation and development. This application provides a structured framework for prompt engineering with support for multiple AI models and various thinking mode techniques.

## 🚀 Main Features

### 🧠 AI Lab Playground
- **6 Thinking Modes**: Meta Prompt, Self-Refine, Chain-of-Thought, Self-Consistency, Chain-of-Prompt, Role Prompt
- **5 Quick Actions**: Refine, Expand, Reimagine, Reformat, Self-Review
- **Real-time Processing**: Transform content directly with various AI models
- **Mode-aware Actions**: Actions adapted to the selected thinking mode

### 📚 Library Management
- **Private Library**: Personal prompt collection with advanced search and filtering
- **Public Library**: Share and discover prompts from the community
- **Smart Tags**: Tag system with color coding and visual indicators
- **Full CRUD**: Create, Read, Update, Delete with complete validation

### 🤖 AI Model Integration
- **OpenRouter API**: Access to various premium AI models with fallback system
- **4 Integrated Models**: 
  - Llama 4 Maverick (Multimodal - Text, Image, Vision)
  - Qwen 3 30B (Text - Code, Math, Long Context)
  - Qwen 2.5 72B (Text - Complex Reasoning)
  - Llama 3.1 70B (Text - Conversational, General Purpose)
- **Automatic Fallback**: Automatically fallback if main model is unavailable

### 🔐 Authentication & Usage Limits
- **Supabase Auth**: Industry-standard authentication with OAuth 2.0
- **Usage Limits**: 
  - Guest: 7 calls per day
  - Authenticated: 27 calls per day
- **Auto Reset**: Resets daily at 00:00 GMT+7
- **Usage Warnings**: Notification when approaching limit

## 🛠️ Tech Stack

### Frontend
- React 18.3.1 + TypeScript 5.8.3 (strict mode)
- Vite 5.4.19 with SWC
- shadcn/ui + Tailwind CSS 3.4.17
- React Router DOM 6.30.1
- TanStack Query 5.83.0
- React Hook Form 7.61.1 + Zod 3.25.76

### Backend & Database
- Supabase Cloud (PostgreSQL + Auth)
- Row Level Security (RLS) for data isolation
- Edge Functions for AI processing and rate limiting
- MCP Supabase for database operations and migrations

### Development Tools
- ESLint 9.32.0 + TypeScript ESLint
- Vitest 3.2.4 for testing
- Prettier for code formatting

## 🔧 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm package manager
- OpenRouter API Key ([Get it here](https://openrouter.ai/))
- Supabase Project (optional for local development)

### Environment Setup di Lovable.dev

Aplikasi ini di-hosting di **Lovable.dev** dan menggunakan **Supabase Cloud**. Environment variables dikonfigurasi melalui Lovable dashboard, bukan file `.env` lokal.

#### Langkah-langkah Setup:

1. **Buka Project di Lovable Dashboard**
   - Login ke [Lovable.dev](https://lovable.dev)
   - Buka project Anda

2. **Konfigurasi Environment Variables**
   - Pergi ke **Settings** > **Environment Variables**
   - Tambahkan variabel berikut:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Mendapatkan Supabase Credentials**
   - Buka [Supabase Dashboard](https://supabase.com/dashboard)
   - Pilih project Anda
   - Pergi ke **Settings** > **API**
   - Copy **"Project URL"** untuk `VITE_SUPABASE_URL`
   - Copy **"anon public"** key untuk `VITE_SUPABASE_ANON_KEY`

4. **Catatan Penting**
   - Environment variables akan otomatis tersedia saat build di Lovable
   - Untuk development/preview, aplikasi menggunakan fallback values
   - Di production, pastikan env vars sudah diset dengan benar

#### Optional Environment Variables:

```
VITE_SITE_URL=https://your-domain.com
VITE_SITE_TITLE=Prompedia.app - Prompt Engineering Laboratory
```

**Note:** `MODE`, `DEV`, dan `PROD` diatur otomatis oleh Vite berdasarkan build mode.

### Thinking Modes

| Mode | Icon | Purpose | Output Structure |
|------|------|---------|------------------|
| **Meta Prompt** | 🪄 | Generate prompts from ideas | Purpose, Instructions, Format |
| **Self-Refine** | ✏️ | Improve existing prompts | Analysis, New Version, Reasons |
| **Chain-of-Thought** | 🧠 | Show reasoning process | Thinking Steps, Answer |
| **Self-Consistency** | 🧬 | Test prompt stability | Multiple Paths, Analysis, Best Version |
| **Chain-of-Prompt** | 🔄 | Develop prompts iteratively | v1, v2, v3, Changelog |
| **Role Prompt** | 🤝 | Analyze from personas | Persona, Analysis, Recommendations |

### Quick Actions

| Action | Icon | Function |
|--------|------|----------|
| **Refine** | ✏️ | Improve clarity and focus |
| **Expand** | 🧩 | Add context and detail |
| **Reimagine** | 🪄 | Creative reinterpretation |
| **Reformat** | 🧾 | Change structure |
| **Self-Review** | 🪞 | Quality assessment |

### Usage Limits

- **Guest Users**: 
  - 7 AI calls per day
  - Reset daily at 00:00 GMT+7
  - Warning when 3 calls remaining
  
- **Authenticated Users**: 
  - 27 AI calls per day
  - Full access to all features
  - Usage tracking in dashboard

## 🗄️ Database Architecture

### Core Tables
- `users`: User profiles with role-based access
- `prompts`: Main content table with metadata
- `tags`: Tag management with color coding
- `prompt_tags`: Junction table for many-to-many relationships
- `user_sessions`: Analytics and session tracking

### Security
- **Row Level Security (RLS)**: Data isolation per user
- **JWT Authentication**: Secure session management
- **Input Validation**: Zod schemas for data validation
- **Rate Limiting**: Built-in API abuse prevention

### MCP Supabase Integration
All database operations use **MCP Supabase**:
- ✅ Cloud-first migrations
- ✅ Production-ready with RLS enabled
- ✅ Optimized queries with indexing

## 📁 Project Structure

```
prompedia-ai/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── PromptEditor.tsx
│   │   ├── MyLibrary.tsx
│   │   ├── PublicLibrary.tsx
│   │   └── ...
│   ├── lib/                # Core logic
│   │   ├── models.ts       # AI model configs
│   │   ├── modes.ts        # Thinking modes
│   │   ├── rate-limiting.ts
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/       # Supabase client
│   └── pages/              # Route components
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── ai-processor/
│   │   └── prompt-enhancer/
│   └── config.toml
└── public/                 # Static assets
```

## 🔒 Security Features

- **JWT Tokens**: Secure session management
- **Row Level Security**: Database-level access control
- **Input Sanitization**: XSS protection
- **Rate Limiting**: API abuse prevention
- **HTTPS Only**: All communications encrypted
- **Environment Variables**: Sensitive data in ENV only

## 📊 Performance

- **Bundle Size**: < 250KB gzipped
- **API Response**: < 300ms P95 for AI calls
- **Code Splitting**: Lazy loading for routes
- **Caching**: React Query for client-side caching

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write meaningful commit messages
- Test features before submitting PR

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **shadcn/ui** for UI components
- **Supabase** for backend services
- **Lovable** for development platform

---

**Prompedia AI** - Prompt Engineering Laboratory 🎯

*Empowering prompt engineers with advanced AI tools and structured thinking frameworks.*
