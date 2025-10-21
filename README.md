# Prompedia - Prompt Engineering Lab

**Prompedia** adalah aplikasi web modern untuk prompt engineering yang dirancang sebagai AI Lab reflektif. Aplikasi ini memungkinkan pengguna untuk berkolaborasi dengan berbagai model AI melalui berbagai pola berpikir dan teknik prompt refinement.

## 🚀 Features

### 🧠 AI Lab Playground
- **6 Thinking Modes**: Meta Prompt, Self-Refine, Chain-of-Thought, Self-Consistency, Chain-of-Prompt, Role Prompt
- **5 Quick Actions**: Refine, Expand, Reimagine, Reformat, Self-Review
- **Real-time AI Processing**: Langsung transform content dengan berbagai model AI

### 📚 Library Management
- **Personal Library**: Koleksi prompt pribadi dengan pencarian dan filter
- **Public Library**: Bagikan dan temukan prompt dari komunitas
- **Smart Organization**: Tag system dan visual indicators untuk mengelola prompt

### 🤖 AI Model Integration
- **OpenRouter API**: Akses berbagai model AI premium
- **4 Model Terintegrasi**: Llama 4 Maverick, Qwen 3 30B, DeepSeek Chat V3, OpenAI OSS 20B
- **Capability-based Selection**: Pilih model berdasarkan kemampuan (Text, Image, Vision, Code, Math, dll)

### 🎨 Modern UI/UX
- **Engineering-Focused**: Interface yang dioptimalkan untuk workflow prompt engineering
- **Responsive Design**: Berfungsi optimal di desktop dan mobile
- **Intuitive Navigation**: Sidebar collapsible dengan visual cues
- **Real-time Feedback**: Status indicators dan loading states

## 🛠️ Tech Stack

### Frontend
- **React 18** dengan TypeScript
- **Vite** sebagai build tool
- **shadcn/ui** + **Tailwind CSS** untuk styling
- **Radix UI** untuk komponen primitif
- **React Router** untuk routing
- **React Query** untuk state management
- **Lucide React** untuk icons

### Backend & Storage
- **Supabase** untuk authentication (siap production)
- **Local Storage** untuk persistence (development)
- **OpenRouter API** untuk AI model access

### Development Tools
- **ESLint** + **TypeScript** untuk code quality
- **Vitest** untuk testing
- **PostCSS** + **Autoprefixer** untuk CSS processing

## 🔧 Getting Started

### Prerequisites
- **Node.js** (v16 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd prompedia
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API Key**
```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your OpenRouter API key
VITE_OPENROUTER_API_KEY=your_api_key_here
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:8080`

## 📖 User Guide

### 🔐 Authentication
- **Guest Mode**: Browse public prompts without login
- **User Account**: Login to save and manage personal prompts
- **Social Auth**: Quick login with social providers

### 📚 Library Management

#### Private Library
- **Personal Collection**: Private prompts for personal use
- **Search & Filter**: Find prompts by title, tags, or content
- **Grid View**: Visual card layout dengan metadata
- **CRUD Operations**: Create, read, update, delete prompts

#### Public Library
- **Community Content**: Shared prompts from all users
- **Discovery**: Browse and find useful prompts
- **Copy Feature**: Fork public prompts to personal library
- **Social Features**: Share your best prompts with community

### 🧠 AI Lab Playground

#### Thinking Modes
Pilih mode berpikir yang sesuai dengan tujuan Anda:

| Mode | Icon | Tujuan | Pola Berpikir |
|------|------|--------|--------------|
| **Meta Prompt** | 🪄 | Generate prompts from ideas | Divergent thinking |
| **Self-Refine** | ✏️ | Improve existing prompts | Reflective thinking |
| **Chain-of-Thought** | 🧠 | Show reasoning process | Analytical reasoning |
| **Self-Consistency** | 🧬 | Test prompt stability | Comparative reasoning |
| **Chain-of-Prompt** | 🔄 | Develop prompts iteratively | Iterative synthesis |
| **Role Prompt** | 🤝 | Analyze from personas | Dialogic reasoning |

#### Quick Actions
Transform content dengan satu klik:

| Action | Icon | Fungsi | Hasil |
|--------|------|--------|-------|
| **Refine** | ✏️ | Improve clarity | Content lebih fokus |
| **Expand** | 🧩 | Add context | Content lebih detail |
| **Reimagine** | 🪄 | Creative reinterpretation | Perspektif baru |
| **Reformat** | 🧾 | Change structure | Format lebih baik |
| **Self-Review** | 🪞 | Quality assessment | Evaluasi objektif |

#### AI Models
Pilih model berdasarkan kemampuan:

| Model | Provider | Type | Capabilities |
|-------|----------|------|--------------|
| **Llama 4 Maverick** | OpenRouter | Multimodal | Text, Image, Vision, Bilingual |
| **Qwen 3 30B** | OpenRouter | Text | Code, Math, Long Context |
| **DeepSeek Chat V3** | OpenRouter | Text | Conversational, Reasoning |
| **OpenAI OSS 20B** | OpenAI | Text | General Reasoning, Code |

### 🎯 Workflow

1. **Pilih Mode**: Select thinking mode dari dropdown
2. **Tulis Content**: Masukkan prompt atau idea
3. **Apply Actions**: Klik action buttons untuk transform
4. **Iterate**: Refine hasil dengan berbagai actions
5. **Save**: Simpan ke library untuk penggunaan selanjutnya

### 💾 Data Persistence
- **Local Storage**: Development mode persistence
- **Supabase**: Production-ready backend (siap deploy)
- **Auto-save**: Changes tersimpan otomatis saat editing

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
```

## 📁 Project Structure

```
prompedia/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── ActionButtons.tsx
│   │   ├── AuthModal.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── PromptEditor.tsx    # Main playground
│   │   ├── MyLibrary.tsx       # Personal library
│   │   ├── PublicLibrary.tsx   # Community library
│   │   ├── Sidebar.tsx
│   │   └── TagInput.tsx
│   ├── lib/                # Core logic and configurations
│   │   ├── actions.ts      # Quick action definitions
│   │   ├── api-config.ts   # OpenRouter API configuration
│   │   ├── models.ts       # AI model configurations
│   │   ├── modes.ts        # Thinking mode definitions
│   │   └── storage.ts      # Local storage management
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   └── integrations/       # External service integrations
├── public/                 # Static assets
├── dist/                   # Production build output
├── docs/                   # Documentation
└── supabase/              # Backend configuration
```

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **shadcn/ui** for beautiful UI components
- **Radix UI** for accessible primitives
- **Supabase** for backend services
- **Tailwind CSS** for styling
- **Lovable** for rapid development platform

## 📞 Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-username/prompedia/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/your-username/prompedia/discussions)
- **Documentation**: Check [Wiki](https://github.com/your-username/prompedia/wiki) for detailed guides

---

**Prompedia** - Prompt Engineering Lab 🎯
