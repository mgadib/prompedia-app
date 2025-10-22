# Product Requirements Document (PRD)
## Prompedia AI - Prompt Engineering Laboratory

### Versi: 1.0
### Tanggal: Januari 2025

---

## 1. Gambaran Umum Aplikasi

### 1.1 Tujuan dan Nilai Bisnis

**Prompedia AI** adalah platform prompt engineering yang dirancang untuk membantu pengguna membuat, mengelola, dan mengoptimalkan prompt AI dengan berbagai teknik thinking modes. Aplikasi ini berfungsi sebagai laboratorium digital untuk eksperimen prompt engineering dengan dukungan multiple AI models.

**Nilai Bisnis Utama:**
- **Produktivitas**: Meningkatkan efisiensi dalam pembuatan prompt berkualitas tinggi
- **Pembelajaran**: Menyediakan platform edukasi untuk teknik prompt engineering
- **Kolaborasi**: Memungkinkan sharing dan discovery prompt antar pengguna
- **Standardisasi**: Menyediakan framework terstruktur untuk prompt engineering

### 1.2 Fitur Utama dan Fungsionalitas Inti

#### **Core Features:**

1. **Prompt Editor & Playground**
   - Editor teks dengan auto-save functionality
   - Real-time preview dan testing
   - Support untuk multiple AI models (Llama 4, Qwen 3, DeepSeek, OpenAI)
   - Thinking modes integration (Meta Prompt, Self-Refine, Chain-of-Thought, dll.)

2. **Library Management System**
   - My Library: Prompt pribadi pengguna
   - Public Library: Prompt yang dibagikan secara publik
   - Tagging system untuk kategorisasi
   - Search dan filter functionality

3. **Authentication & User Management**
   - Supabase-based authentication
   - Guest mode dengan batasan (17 playground sessions)
   - User profiles dengan preferences
   - Role-based access control (user, admin, moderator)

4. **Thinking Modes Framework**
   - 6 thinking modes terintegrasi:
     - Meta Prompt: Menghasilkan prompt dari ide mentah
     - Self-Refine: Memperbaiki prompt existing
     - Chain-of-Thought: Reasoning step-by-step
     - Self-Consistency: Testing konsistensi dengan multiple paths
     - Chain-of-Prompt: Pengembangan iteratif (v1→v2→v3)
     - Role Prompt: Analisis dari perspektif persona tertentu

5. **AI Model Integration**
   - OpenRouter API integration
   - Support untuk 4+ AI models
   - Model capabilities tracking (text, image, vision, code, math)
   - Provider diversity (OpenRouter, OpenAI)

### 1.3 Teknologi Stack

#### **Frontend:**
- **Framework**: React 18.3.1 dengan TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Library**: Radix UI components dengan shadcn/ui
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Query (TanStack Query) 5.83.0
- **Routing**: React Router DOM 6.30.1
- **Form Handling**: React Hook Form 7.61.1 dengan Zod validation

#### **Backend & Database:**
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL dengan Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

#### **External APIs:**
- **AI Models**: OpenRouter API
- **Model Providers**: OpenAI, Meta, Qwen, DeepSeek

#### **Development Tools:**
- **Linting**: ESLint 9.32.0 dengan TypeScript ESLint
- **Package Manager**: npm
- **Environment**: Node.js dengan ES modules

---

## 2. Detail Teknis

### 2.1 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Sidebar   │  │ Prompt      │  │   Library Views     │  │
│  │ Navigation  │  │ Editor      │  │ (My/Public)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    State Management                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ React Query │  │ Local       │  │   Component State   │  │
│  │ (Server)    │  │ Storage     │  │   (UI State)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Supabase   │  │ OpenRouter  │  │   Local Storage     │  │
│  │ (Auth + DB) │  │    API      │  │   (Persistence)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Database Schema

#### **Core Tables:**

1. **profiles** - User profiles extending auth.users
   ```sql
   - id (UUID, FK to auth.users)
   - username (TEXT, UNIQUE)
   - display_name (TEXT)
   - avatar_url (TEXT)
   - bio (TEXT)
   - preferences (JSONB)
   - role (ENUM: user, admin, moderator)
   - created_at, updated_at (TIMESTAMP)
   ```

2. **prompts** - Main content table
   ```sql
   - id (UUID, PRIMARY KEY)
   - user_id (UUID, FK to profiles)
   - title (TEXT, NOT NULL)
   - content (TEXT, NOT NULL)
   - description (TEXT)
   - model (TEXT)
   - mode (TEXT)
   - tags (TEXT[])
   - color (TEXT)
   - is_public (BOOLEAN)
   - is_featured (BOOLEAN)
   - view_count, fork_count (INTEGER)
   - original_prompt_id (UUID, self-reference)
   - usage_stats (JSONB)
   - created_at, updated_at (TIMESTAMP)
   ```

3. **tags** - Tag management
   ```sql
   - id (UUID, PRIMARY KEY)
   - name (TEXT, UNIQUE)
   - description (TEXT)
   - color (TEXT)
   - usage_count (INTEGER)
   - created_by (UUID, FK to profiles)
   - is_system (BOOLEAN)
   - created_at (TIMESTAMP)
   ```

### 2.3 Deskripsi Modul Utama

#### **Frontend Modules:**

1. **App.tsx** - Root application dengan routing
   - React Query provider setup
   - Toast notifications (Sonner)
   - Tooltip provider
   - Route configuration

2. **pages/App.tsx** - Main application logic
   - Authentication state management
   - Playground limit enforcement (17 untuk guest users)
   - View state management (my-library vs public-library)
   - Prompt CRUD operations

3. **components/PromptEditor.tsx** - Core editing interface
   - Auto-save functionality (2 detik debounce)
   - Model dan mode selection
   - Tag management
   - Action buttons integration

4. **lib/storage.ts** - Local storage abstraction
   - User session management
   - Prompt persistence
   - Current prompt tracking

5. **lib/models.ts** - AI model definitions
   - Model capabilities mapping
   - Provider information
   - Model selection utilities

6. **lib/modes.ts** - Thinking modes framework
   - 6 thinking modes dengan instructions
   - Output structure definitions
   - Mode-specific formatting

### 2.4 Ketergantungan Eksternal

#### **Critical Dependencies:**
- **@supabase/supabase-js**: Database dan authentication
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **react-hook-form + zod**: Form validation
- **lucide-react**: Icon library

#### **API Dependencies:**
- **OpenRouter API**: AI model access
- **Supabase API**: Database operations
- **Browser APIs**: LocalStorage, Crypto (UUID generation)

---

## 3. Logika Bisnis

### 3.1 Aturan dan Proses Bisnis Inti

#### **User Access Control:**
1. **Guest Users:**
   - Maksimal 17 playground sessions
   - Tidak bisa menyimpan prompt secara permanen
   - Akses terbatas ke public library
   - Warning notification saat mendekati limit

2. **Authenticated Users:**
   - Unlimited playground access
   - Full CRUD operations pada prompt pribadi
   - Dapat membuat prompt public
   - Access ke semua thinking modes

3. **Content Visibility:**
   - Private prompts: Hanya visible untuk owner
   - Public prompts: Visible untuk semua users
   - Featured prompts: Curated content untuk authenticated users

#### **Prompt Management Rules:**
1. **Auto-save Logic:**
   - Trigger setelah 2 detik inactivity
   - Hanya save jika ada perubahan (hasUnsavedChanges flag)
   - Visual indicator saat auto-saving

2. **Tagging System:**
   - Free-form tags dengan auto-completion
   - System tags (read-only, managed by admins)
   - User-created tags (editable by creator)

3. **Model Selection:**
   - Default ke model index 2 (DeepSeek Chat V3)
   - Model capabilities influence UI options
   - Free models prioritized untuk guest users

### 3.2 Alur Kerja Pengguna (User Flow) Utama

#### **Flow 1: Guest User Journey**
```
Landing → Playground (New Prompt) → Editor → Model Selection → 
Thinking Mode → Content Creation → Auto-save (Local) → 
Limit Warning → Auth Prompt → Registration/Login
```

#### **Flow 2: Authenticated User Journey**
```
Login → Dashboard (My Library) → 
├─ Create New Prompt → Editor → Save to Database
├─ Browse Public Library → Copy/Use Prompt → Modify → Save
└─ Manage Existing Prompts → Edit → Update → Publish (Optional)
```

#### **Flow 3: Prompt Engineering Workflow**
```
Idea → Meta Prompt Mode → Generate Initial Prompt → 
Self-Refine Mode → Improve Prompt → Chain-of-Thought → 
Test Reasoning → Self-Consistency → Validate → 
Chain-of-Prompt → Iterate Versions → Final Prompt
```

### 3.3 Business Rules dan Validasi

#### **Data Validation Rules:**
1. **Prompt Validation:**
   - Title: Required, max 200 characters
   - Content: Required, max 10,000 characters
   - Tags: Max 10 tags per prompt
   - Model: Must be from AVAILABLE_MODELS list

2. **User Validation:**
   - Username: Unique, 3-30 characters, alphanumeric + underscore
   - Email: Valid email format, unique
   - Password: Min 8 characters (Supabase default)

3. **Access Control Rules:**
   - Users can only modify their own prompts
   - Public prompts are read-only for non-owners
   - System tags cannot be modified by regular users

#### **Business Logic Constraints:**
1. **Playground Limits:**
   - Guest users: 17 sessions max
   - Counter stored in localStorage
   - Reset after successful authentication

2. **Content Moderation:**
   - RLS policies enforce data isolation
   - Public prompts subject to community guidelines
   - Featured prompts require admin approval

### 3.4 Model Data dan Hubungan Antar Entitas

#### **Entity Relationship Model:**

```
Users (auth.users) ←→ Profiles (1:1)
    ↓
Profiles ←→ Prompts (1:N)
    ↓
Prompts ←→ Tags (N:M via array field)
    ↓
Prompts ←→ Prompts (1:N, self-reference for forks)

AI Models ←→ Prompts (N:1, via model field)
Thinking Modes ←→ Prompts (N:1, via mode field)
```

#### **Data Flow Patterns:**

1. **Create Prompt:**
   ```
   User Input → Validation → Local State → Auto-save → 
   Database (if authenticated) → UI Update
   ```

2. **Load Library:**
   ```
   Database Query → RLS Filter → Local Cache → 
   UI Render → User Interaction
   ```

3. **AI Model Interaction:**
   ```
   Prompt + Model Selection → API Config → OpenRouter → 
   Response → Display → Optional Save
   ```

---

## 4. Persyaratan Non-Fungsional

### 4.1 Kebutuhan Performa dan Skalabilitas

#### **Performance Requirements:**
- **Page Load Time**: < 2 detik untuk initial load
- **Auto-save Response**: < 500ms untuk local operations
- **API Response Time**: < 5 detik untuk AI model calls
- **Database Queries**: < 1 detik untuk CRUD operations

#### **Scalability Considerations:**
- **Concurrent Users**: Designed untuk 1000+ concurrent users
- **Data Growth**: Database schema mendukung millions of prompts
- **API Rate Limits**: OpenRouter rate limiting handled gracefully
- **Storage Optimization**: JSONB fields untuk flexible data

#### **Optimization Strategies:**
- React Query caching untuk server state
- Local storage untuk offline capability
- Debounced auto-save untuk mengurangi API calls
- Lazy loading untuk large prompt libraries

### 4.2 Pertimbangan Keamanan

#### **Authentication Security:**
- **Supabase Auth**: Industry-standard OAuth 2.0
- **JWT Tokens**: Secure session management
- **Email Verification**: Required untuk new accounts
- **Password Policy**: Minimum 8 characters (configurable)

#### **Data Security:**
- **Row Level Security (RLS)**: Database-level access control
- **API Key Management**: Environment variables untuk sensitive data
- **HTTPS Only**: All communications encrypted
- **Input Sanitization**: XSS protection via React's built-in escaping

#### **Privacy Protection:**
- **Data Isolation**: Users can only access their own private data
- **Public Content**: Explicit opt-in untuk sharing prompts
- **Analytics**: Minimal user tracking, focus on usage patterns
- **GDPR Compliance**: User data deletion capabilities

### 4.3 Batasan Teknis yang Ada

#### **Current Limitations:**

1. **Guest User Restrictions:**
   - 17 playground limit (hardcoded)
   - No persistent storage untuk guest sessions
   - Limited access ke advanced features

2. **AI Model Dependencies:**
   - Tergantung pada OpenRouter API availability
   - Rate limiting dari external providers
   - Model availability dapat berubah

3. **Browser Compatibility:**
   - Modern browsers only (ES2020+ features)
   - LocalStorage dependency untuk offline functionality
   - No mobile app (web-only)

4. **Database Constraints:**
   - Supabase free tier limitations
   - PostgreSQL-specific features
   - RLS policy complexity

#### **Technical Debt:**
- Mixed storage strategy (localStorage + Supabase)
- Hardcoded constants (playground limits, model defaults)
- Limited error handling untuk network failures
- No offline sync mechanism

#### **Future Scalability Concerns:**
- LocalStorage size limits untuk heavy users
- OpenRouter API costs dengan increased usage
- Database query optimization untuk large datasets
- Real-time collaboration features not implemented

---

## 5. Roadmap dan Pengembangan Selanjutnya

### 5.1 Prioritas Pengembangan

#### **High Priority:**
1. **Offline Sync**: Sinkronisasi localStorage dengan database
2. **Error Handling**: Comprehensive error recovery mechanisms
3. **Performance Optimization**: Query optimization dan caching improvements
4. **Mobile Responsiveness**: Enhanced mobile experience

#### **Medium Priority:**
1. **Collaboration Features**: Real-time prompt sharing dan editing
2. **Advanced Analytics**: Usage statistics dan prompt performance metrics
3. **Export/Import**: Backup dan migration tools
4. **Template System**: Pre-built prompt templates

#### **Low Priority:**
1. **API Integration**: Direct integration dengan more AI providers
2. **Plugin System**: Extensible thinking modes
3. **Community Features**: Rating, comments, dan social features
4. **Enterprise Features**: Team management dan advanced permissions

---

**Dokumen ini mencerminkan analisis mendalam terhadap codebase Prompedia AI dan menyediakan blueprint komprehensif untuk pengembangan dan pemeliharaan aplikasi.**