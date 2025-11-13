# Product Requirements Document (PRD)
## Prompedia AI - Prompt Engineering Laboratory

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**Status:** Production

---

## 1. Executive Summary

### 1.1 Product Overview
Prompedia AI adalah platform rekayasa prompt (prompt engineering) yang dirancang sebagai laboratorium digital untuk eksperimen dan pengembangan prompt AI. Aplikasi ini menyediakan framework terstruktur untuk prompt engineering dengan dukungan berbagai model AI dan teknik thinking mode.

### 1.2 Problem Statement
Prompt engineering adalah keterampilan yang kompleks dan memerlukan eksperimen yang berulang. Pengembang dan peneliti AI membutuhkan alat yang:
- Menyediakan berbagai metode thinking untuk mengoptimalkan prompt
- Memungkinkan eksperimen dengan berbagai model AI
- Menyediakan library untuk menyimpan dan berbagi prompt
- Memberikan akses terbatas untuk mencegah abuse

### 1.3 Solution
Prompedia AI menyediakan:
- **AI Lab Playground**: 6 thinking modes dan 5 quick actions untuk eksperimen prompt
- **Library Management**: Private dan public library dengan sistem tag
- **Multi-Model Support**: Integrasi dengan OpenRouter untuk akses berbagai model AI
- **Usage Management**: Rate limiting berbasis harian untuk guest dan authenticated users

### 1.4 Target Users
- **Primary**: Prompt engineers, AI researchers, developers yang bekerja dengan LLM
- **Secondary**: Content creators, educators yang menggunakan AI untuk konten
- **Tertiary**: Hobbyists dan enthusiasts yang ingin belajar prompt engineering

---

## 2. Product Goals & Success Metrics

### 2.1 Business Goals
- Menyediakan platform yang mudah digunakan untuk prompt engineering
- Membangun komunitas pengguna yang aktif berbagi prompt
- Menjaga kualitas layanan dengan rate limiting yang efektif

### 2.2 Success Metrics
- **User Engagement**: 
  - Daily Active Users (DAU)
  - Average prompts created per user
  - Public prompt sharing rate
- **Technical Performance**:
  - API response time P95 < 300ms
  - Bundle size < 250KB gzipped
  - Uptime > 99.5%
- **User Satisfaction**:
  - User retention rate
  - Feature adoption rate (thinking modes, actions)

---

## 3. User Personas

### 3.1 Primary Persona: Prompt Engineer
- **Name**: Alex, 28, AI Developer
- **Goals**: 
  - Mengoptimalkan prompt untuk aplikasi produksi
  - Mengeksperimen dengan berbagai thinking modes
  - Menyimpan dan mengorganisir prompt library
- **Pain Points**:
  - Sulit tracking versi prompt yang berbeda
  - Tidak ada tool untuk membandingkan hasil berbagai model
- **Needs**:
  - Multiple thinking modes untuk eksperimen
  - Version control untuk prompt
  - Export/import functionality

### 3.2 Secondary Persona: Content Creator
- **Name**: Sarah, 35, Content Writer
- **Goals**:
  - Membuat prompt yang efektif untuk konten
  - Menemukan prompt yang sudah terbukti dari komunitas
- **Pain Points**:
  - Tidak tahu cara membuat prompt yang baik
  - Membutuhkan contoh-contoh prompt yang sukses
- **Needs**:
  - Template dan contoh prompt
  - Public library untuk discovery
  - Simple UI yang mudah dipahami

---

## 4. Core Features

### 4.1 AI Lab Playground

#### 4.1.1 Thinking Modes
Platform menyediakan 6 thinking modes yang berbeda:

| Mode | Icon | Purpose | Output Structure |
|------|------|---------|------------------|
| **Meta Prompt** | 🪄 | Generate prompts from ideas | Purpose, Instructions, Format |
| **Self-Refine** | ✏️ | Improve existing prompts | Analysis, New Version, Reasons |
| **Chain-of-Thought** | 🧠 | Show reasoning process | Thinking Steps, Answer |
| **Self-Consistency** | 🧬 | Test prompt stability | Multiple Paths, Analysis, Best Version |
| **Chain-of-Prompt** | 🔄 | Develop prompts iteratively | v1, v2, v3, Changelog |
| **Role Prompt** | 🤝 | Analyze from personas | Persona, Analysis, Recommendations |

**Requirements:**
- User dapat memilih thinking mode dari dropdown
- Setiap mode memiliki instruksi khusus yang dikirim ke AI
- Output disesuaikan dengan struktur yang ditentukan per mode
- Mode-aware actions (actions yang disesuaikan dengan mode yang dipilih)

#### 4.1.2 Quick Actions
5 quick actions untuk transformasi konten:

| Action | Icon | Function | Pattern |
|--------|------|----------|--------|
| **Refine** | ✏️ | Improve clarity and focus | Reflective thinking |
| **Expand** | 🧩 | Add context and detail | Exploratory thinking |
| **Reimagine** | 🪄 | Creative reinterpretation | Divergent thinking |
| **Reformat** | 🧾 | Change structure | Structural thinking |
| **Self-Review** | 🪞 | Quality assessment | Metacognitive thinking |

**Requirements:**
- Actions tersedia sebagai button di editor
- Actions dapat digunakan pada konten yang sudah ada
- Actions aware terhadap thinking mode yang dipilih
- Loading state saat processing
- Error handling dengan user-friendly messages

#### 4.1.3 Model Selection
**Available Models:**
- Llama 4 Maverick (Multimodal - Text, Image, Vision) - Free
- Qwen 3 30B (Text - Code, Math, Long Context) - Free

**Requirements:**
- Model selector dengan informasi capabilities
- Automatic fallback jika model utama unavailable
- Model information display (provider, type, capabilities)
- Validation untuk memastikan hanya model yang diizinkan yang digunakan

#### 4.1.4 Prompt Editor
**Features:**
- Rich text editor untuk prompt content
- Auto-save functionality
- Title dan description fields
- Tag input dengan autocomplete
- Color picker untuk visual organization
- Focus mode untuk distraction-free editing

**Requirements:**
- Real-time validation (title required, content max 50,000 chars)
- Auto-save dengan debounce (500ms)
- Local storage backup
- Undo/redo functionality
- Markdown support untuk formatting

### 4.2 Library Management

#### 4.2.1 Private Library (My Library)
**Features:**
- List semua prompt milik user
- Search dan filter by tags
- CRUD operations (Create, Read, Update, Delete)
- Copy prompt functionality
- Share to public option

**Requirements:**
- RLS (Row Level Security) untuk data isolation
- Pagination untuk performa
- Sort by date, title, usage
- Bulk operations (delete multiple)

#### 4.2.2 Public Library
**Features:**
- Browse public prompts dari komunitas
- Search dan filter
- View prompt details
- Use prompt (load ke editor)
- Copy to my library (untuk authenticated users)

**Requirements:**
- Hanya prompt dengan `is_public = true` yang ditampilkan
- Featured prompts section
- Sort by popularity, date, featured
- Pagination
- Rate limiting untuk prevent abuse

#### 4.2.3 Tag System
**Features:**
- Tag dengan color coding
- Autocomplete saat input tag
- Filter by tag
- Tag page untuk melihat semua prompt dengan tag tertentu
- Max 10 tags per prompt

**Requirements:**
- Tag validation (max 30 chars, alphanumeric + dash/underscore)
- Auto-create tag jika belum ada
- Tag color assignment (automatic atau manual)
- Tag popularity tracking

### 4.3 Authentication & User Management

#### 4.3.1 Authentication
**Methods:**
- Email/Password (Supabase Auth)
- OAuth providers (via Supabase)

**Requirements:**
- Secure JWT-based sessions
- Auto-logout pada session expiry
- Remember me functionality
- Password reset flow
- Email verification (optional)

#### 4.3.2 User Profiles
**Fields:**
- Username (required, unique)
- Display name (optional)
- Email (from auth)

**Requirements:**
- Profile update functionality
- Username validation
- Avatar support (future)

### 4.4 Usage Management & Rate Limiting

#### 4.4.1 Usage Limits
**Guest Users:**
- 7 AI calls per day
- Reset daily at 00:00 GMT+7
- Warning when 3 calls remaining
- No access to private library

**Authenticated Users:**
- 27 AI calls per day
- Reset daily at 00:00 GMT+7
- Warning when 3 calls remaining
- Full access to all features

**Requirements:**
- Server-side validation (prevent client manipulation)
- Real-time usage counter
- Usage history tracking
- Clear error messages saat limit reached
- CTA untuk sign up saat guest limit reached

#### 4.4.2 Rate Limiting Implementation
**Technical:**
- Database-based tracking (`ai_usage` table)
- Session-based tracking untuk guests
- Automatic reset via cron job (Edge Function)
- IP-based rate limiting di Edge Functions (100 requests/hour)

**Requirements:**
- Accurate usage counting
- Timezone-aware reset (GMT+7)
- Graceful degradation saat tracking fails
- Audit trail untuk debugging

---

## 5. Technical Architecture

### 5.1 Frontend Stack
- **Framework**: React 18.3.1 + TypeScript 5.8.3 (strict mode)
- **Build Tool**: Vite 5.4.19 with SWC
- **UI Library**: shadcn/ui + Tailwind CSS 3.4.17
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query 5.83.0
- **Forms**: React Hook Form 7.61.1 + Zod 3.25.76
- **i18n**: i18next + react-i18next (English & Indonesian)

### 5.2 Backend Stack
- **Database**: Supabase Cloud (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Supabase Edge Functions (Deno)
- **AI Integration**: OpenRouter API
- **Database Operations**: MCP Supabase

### 5.3 Database Schema

#### 5.3.1 Core Tables
1. **users**
   - id (UUID, PK)
   - username (VARCHAR, UNIQUE, NOT NULL)
   - display_name (VARCHAR, NULLABLE)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **prompts**
   - id (UUID, PK)
   - user_id (UUID, FK → users.id)
   - title (VARCHAR, NOT NULL)
   - content (TEXT, NOT NULL)
   - description (TEXT, NULLABLE)
   - model_id (VARCHAR, FK → ai_models.id)
   - mode_id (VARCHAR, FK → thinking_modes.id)
   - color (VARCHAR, DEFAULT '#3b82f6')
   - is_public (BOOLEAN, DEFAULT false)
   - is_featured (BOOLEAN, DEFAULT false)
   - original_prompt_id (UUID, FK → prompts.id, NULLABLE)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. **tags**
   - id (UUID, PK)
   - name (VARCHAR, UNIQUE, NOT NULL)
   - color (VARCHAR, DEFAULT '#3b82f6')
   - created_at (TIMESTAMP)

4. **prompt_tags** (Junction Table)
   - prompt_id (UUID, FK → prompts.id)
   - tag_id (UUID, FK → tags.id)
   - PRIMARY KEY (prompt_id, tag_id)

5. **ai_models**
   - id (VARCHAR, PK)
   - name (VARCHAR, NOT NULL)
   - provider (VARCHAR, NOT NULL)
   - type (VARCHAR, NOT NULL)
   - description (TEXT, NULLABLE)
   - icon (VARCHAR, NULLABLE)
   - free (BOOLEAN, DEFAULT false)
   - is_active (BOOLEAN, DEFAULT true)

6. **thinking_modes**
   - id (VARCHAR, PK)
   - name (VARCHAR, NOT NULL)
   - description (TEXT, NOT NULL)
   - icon (VARCHAR, NOT NULL)
   - instructions (TEXT, NOT NULL)
   - purpose (VARCHAR, NULLABLE)
   - thinking_pattern (VARCHAR, NULLABLE)
   - output_structure (JSONB, NULLABLE)

7. **ai_usage**
   - id (UUID, PK)
   - user_id (UUID, FK → users.id, NULLABLE)
   - session_id (VARCHAR, NULLABLE)
   - is_guest (BOOLEAN, DEFAULT false)
   - usage_date (DATE, NOT NULL)
   - usage_count (INTEGER, DEFAULT 0)
   - last_used_at (TIMESTAMP, NULLABLE)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

8. **user_sessions**
   - id (UUID, PK)
   - user_id (UUID, FK → users.id, NULLABLE)
   - started_at (TIMESTAMP)
   - ended_at (TIMESTAMP, NULLABLE)

#### 5.3.2 Security
- **Row Level Security (RLS)**: Enabled pada semua tables
- **Policies**: 
  - Users hanya bisa read/update data mereka sendiri
  - Public prompts readable oleh semua
  - Private prompts hanya readable oleh owner
- **Functions**: SECURITY DEFINER dengan `SET search_path = public`

### 5.4 Edge Functions

#### 5.4.1 ai-processor
**Purpose**: Memproses request AI ke OpenRouter API

**Features:**
- Input validation (Zod schema)
- Model whitelist validation
- Rate limiting (IP-based, 100 req/hour)
- CORS handling
- Error handling dengan retry logic
- Request logging untuk audit

**Input:**
```typescript
{
  model: string; // Must be in ALLOWED_MODELS
  prompt: string; // Min 1, Max 50,000 chars
  mode?: string; // Optional
  options?: {
    temperature?: number; // 0-2
    max_tokens?: number; // 1-16384
    top_p?: number; // 0-1
  }
}
```

**Output:**
```typescript
{
  success: boolean;
  content?: string;
  error?: string;
  model_used?: string;
}
```

#### 5.4.2 prompt-enhancer
**Purpose**: Enhance prompt dengan mode-aware instructions

**Features:**
- Combine mode instructions dengan user prompt
- Apply action transformations
- Format output sesuai mode structure

#### 5.4.3 reset-daily-usage
**Purpose**: Reset daily usage counter (cron job)

**Schedule**: Daily at 00:00 GMT+7 (17:00 UTC)

**Features:**
- Delete old usage records
- Reset counters
- Log reset operations

### 5.5 API Integration

#### 5.5.1 OpenRouter API
**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Configuration:**
- API Key stored in Supabase Edge Function secrets
- Model whitelist: Only free models
- Fallback mechanism jika model utama unavailable

**Request Format:**
```json
{
  "model": "meta-llama/llama-4-maverick:free",
  "messages": [
    {
      "role": "user",
      "content": "prompt content here"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

---

## 6. User Flows

### 6.1 New User Flow (Guest)
1. User mengakses aplikasi
2. Default view: Public Library
3. User dapat browse public prompts
4. User dapat click "Use" untuk load prompt ke editor
5. User dapat mencoba AI processing (7 calls/day limit)
6. System menunjukkan warning saat limit approaching
7. CTA untuk sign up saat limit reached

### 6.2 Authenticated User Flow
1. User sign up / sign in
2. Default view: Playground (empty prompt)
3. User dapat:
   - Create new prompt
   - Select thinking mode
   - Select AI model
   - Use quick actions
   - Save prompt to library
   - Make prompt public
   - Access private library
4. Usage tracking: 27 calls/day
5. Warning saat limit approaching

### 6.3 Prompt Creation Flow
1. User click "New Prompt" atau load existing
2. User input title dan content
3. User select thinking mode
4. User select AI model
5. User dapat:
   - Process dengan AI (thinking mode)
   - Apply quick actions
   - Add tags
   - Set color
   - Add description
6. User save prompt
7. Option untuk make public

### 6.4 Prompt Sharing Flow
1. User create/edit prompt
2. User toggle "Make Public"
3. Prompt muncul di Public Library
4. Other users dapat:
   - View prompt details
   - Use prompt (load ke editor)
   - Copy to their library (authenticated only)

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **Bundle Size**: < 250KB gzipped (initial load)
- **API Response Time**: P95 < 300ms untuk AI calls
- **Page Load Time**: < 2s untuk initial load
- **Time to Interactive**: < 3s

**Optimization Strategies:**
- Code splitting dengan lazy loading
- React Query untuk client-side caching
- Image optimization
- CDN untuk static assets

### 7.2 Security
- **Authentication**: JWT-based dengan Supabase Auth
- **Data Isolation**: RLS policies untuk multi-tenant
- **Input Validation**: Zod schemas di frontend dan backend
- **XSS Protection**: Input sanitization
- **CSRF Protection**: SameSite cookies
- **Rate Limiting**: Multi-layer (IP, user, session)
- **Secrets Management**: Environment variables di Supabase

### 7.3 Scalability
- **Database**: PostgreSQL dengan proper indexing
- **Caching**: React Query untuk client-side, Redis untuk server-side (future)
- **CDN**: Static assets via Supabase Storage (future)
- **Edge Functions**: Auto-scaling dengan Deno Deploy

### 7.4 Reliability
- **Uptime Target**: 99.5%
- **Error Handling**: Graceful degradation
- **Monitoring**: Supabase logs + custom analytics
- **Backup**: Daily database backups (Supabase managed)

### 7.5 Accessibility
- **WCAG 2.1**: Level AA compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML, ARIA labels
- **Color Contrast**: Minimum 4.5:1 ratio
- **Responsive Design**: Mobile-first approach

### 7.6 Internationalization
- **Supported Languages**: English, Indonesian
- **i18n Library**: i18next + react-i18next
- **Language Detection**: Browser-based dengan manual override
- **RTL Support**: Future consideration

---

## 8. Constraints & Assumptions

### 8.1 Technical Constraints
- **Free Tier Limits**: Hanya model free dari OpenRouter
- **Rate Limiting**: 7 calls/day (guest), 27 calls/day (authenticated)
- **Database**: Supabase free tier limits (500MB database, 2GB bandwidth)
- **Edge Functions**: 500K invocations/month (free tier)

### 8.2 Business Constraints
- **Monetization**: Currently free, future premium tiers
- **Model Selection**: Limited to free models only
- **Storage**: Limited prompt storage per user (future limit)

### 8.3 Assumptions
- Users memiliki internet connection yang stabil
- Users familiar dengan basic prompt engineering concepts
- OpenRouter API availability > 99%
- Supabase service availability > 99.5%

---

## 9. Future Enhancements

### 9.1 Short-term (3-6 months)
- **Export/Import**: JSON export untuk backup
- **Prompt Templates**: Pre-built templates untuk common use cases
- **Version History**: Track changes pada prompt
- **Collaboration**: Share prompt dengan specific users
- **Analytics Dashboard**: Usage statistics per user

### 9.2 Medium-term (6-12 months)
- **Premium Models**: Access to paid models via subscription
- **API Access**: REST API untuk programmatic access
- **Webhooks**: Notifications untuk prompt updates
- **Advanced Search**: Semantic search dengan embeddings
- **Prompt Testing**: A/B testing untuk prompt variations

### 9.3 Long-term (12+ months)
- **AI Agent Mode**: Autonomous prompt optimization
- **Community Features**: Comments, ratings, discussions
- **Marketplace**: Paid prompt marketplace
- **Enterprise Features**: Team collaboration, SSO, advanced analytics
- **Mobile Apps**: Native iOS/Android apps

---

## 10. Success Criteria

### 10.1 Launch Criteria
- ✅ All core features implemented
- ✅ Security audit passed
- ✅ Performance benchmarks met
- ✅ Accessibility compliance verified
- ✅ Documentation complete

### 10.2 Post-Launch Metrics
- **Week 1**: 100+ registered users
- **Month 1**: 1,000+ prompts created
- **Month 3**: 10,000+ prompts in public library
- **Month 6**: 50%+ user retention rate

---

## 11. Risk Assessment

### 11.1 Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenRouter API downtime | High | Low | Fallback models, error handling |
| Database performance issues | Medium | Medium | Proper indexing, query optimization |
| Rate limiting bypass | High | Low | Server-side validation, IP tracking |
| Data loss | High | Low | Regular backups, transaction safety |

### 11.2 Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Marketing, community building |
| High infrastructure costs | Medium | Medium | Usage monitoring, cost optimization |
| Competitor features | Medium | High | Continuous innovation, user feedback |

---

## 12. Dependencies

### 12.1 External Services
- **Supabase**: Database, Auth, Edge Functions
- **OpenRouter**: AI model access
- **Vercel/Netlify**: Hosting (if applicable)

### 12.2 Third-party Libraries
- React ecosystem (React, React Router, React Query)
- UI libraries (shadcn/ui, Radix UI, Tailwind CSS)
- Form handling (React Hook Form, Zod)
- i18n (i18next)

---

## 13. Glossary

- **Prompt Engineering**: Teknik untuk mengoptimalkan input ke AI model untuk mendapatkan output yang diinginkan
- **Thinking Mode**: Metode berpikir yang diterapkan AI saat memproses prompt
- **Quick Action**: Transformasi cepat pada konten prompt
- **RLS**: Row Level Security - mekanisme database untuk data isolation
- **Edge Function**: Serverless function yang berjalan di edge network
- **Rate Limiting**: Pembatasan jumlah request per waktu tertentu

---

## 14. Appendix

### 14.1 API Endpoints Reference
- Supabase REST API: `https://[project].supabase.co/rest/v1/`
- Edge Functions: `https://[project].supabase.co/functions/v1/`
- OpenRouter API: `https://openrouter.ai/api/v1/chat/completions`

### 14.2 Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENROUTER_API_KEY= (stored in Edge Function secrets)
VITE_SITE_URL=
```

### 14.3 Database Functions
- `get_current_usage(p_user_id, p_is_guest, p_session_id)`
- `increment_ai_usage(p_user_id, p_is_guest, p_session_id)`
- `reset_daily_usage()`
- `handle_new_user()` (trigger)
- `handle_updated_at()` (trigger)

---

**Document Owner**: Product Team  
**Reviewers**: Engineering, Design, QA  
**Approval Date**: TBD

---

*This PRD is a living document and will be updated as the product evolves.*

