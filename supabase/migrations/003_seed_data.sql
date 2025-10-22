-- Prompedia AI Seed Data
-- Migration: 003_seed_data
-- Description: Populates reference tables with initial data

-- ========================================
-- AI MODELS SEED DATA
-- ========================================

INSERT INTO public.ai_models (id, name, provider, type, capabilities) VALUES
('meta-llama/llama-4-maverick:free', 'Llama 4 Maverick', 'OpenRouter', 'Multimodal', '{
  "text": true,
  "image": true,
  "vision": true,
  "bilingual": true,
  "conversational": true,
  "reasoning": true
}'::jsonb),

('qwen/qwen3-30b-a3b:free', 'Qwen 3 30B', 'OpenRouter', 'Text', '{
  "text": true,
  "code": true,
  "math": true,
  "longContext": true,
  "reasoning": true
}'::jsonb),

('deepseek/deepseek-chat-v3-0324:free', 'DeepSeek Chat V3', 'OpenRouter', 'Text', '{
  "text": true,
  "conversational": true,
  "reasoning": true,
  "code": true,
  "math": true
}'::jsonb),

('anthropic/claude-3.5-sonnet:beta', 'Claude 3.5 Sonnet', 'Anthropic', 'Text', '{
  "text": true,
  "reasoning": true,
  "code": true,
  "longContext": true
}'::jsonb),

('google/gemini-pro-1.5', 'Gemini Pro 1.5', 'Google', 'Multimodal', '{
  "text": true,
  "image": true,
  "vision": true,
  "code": true,
  "math": true,
  "longContext": true
}'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- ========================================
-- THINKING MODES SEED DATA
-- ========================================

INSERT INTO public.thinking_modes (id, name, icon, description, purpose, thinking_pattern, output_structure, instructions) VALUES
('meta-prompt', 'Meta Prompt', '🪄', 'Menghasilkan prompt baru dari ide mentah pengguna', 'Divergent thinking - meluaskan kemungkinan', 'AI tidak menjawab tugas langsung, tapi menulis prompt untuk menjawab tugas tersebut', '["Tujuan Prompt", "Instruksi AI", "Format Output"]'::jsonb, 'Sebagai Meta Prompt Generator, tugas Anda adalah mengubah ide mentah pengguna menjadi prompt yang terstruktur dan efektif.

ATURAN WAJIB:
- Jangan jawab tugas langsung
- Buat prompt baru yang bisa digunakan untuk menjawab tugas tersebut
- Selalu sertakan 3 bagian: Tujuan Prompt, Instruksi AI, dan Format Output
- Output harus berupa blok teks siap pakai

FORMAT OUTPUT:
## Tujuan Prompt
[Jelaskan apa yang ingin dicapai prompt ini]

## Instruksi AI
[Tulis instruksi lengkap untuk AI]

## Format Output
[Tentukan struktur output yang diinginkan]'),

('self-refine', 'Self-Refine', '✏️', 'Memperjelas dan memperbaiki prompt yang sudah ada', 'Reflective thinking - analisis dan perbaikan', 'AI membaca prompt lama dan menulis versi baru yang lebih efektif', '["Analisis Prompt Lama", "Versi Diperbaiki", "Alasan Perubahan"]'::jsonb, 'Sebagai Self-Refine Specialist, tugas Anda adalah menganalisis dan memperbaiki prompt yang sudah ada.

ATURAN WAJIB:
- Baca dan pahami prompt yang diberikan
- Identifikasi kelemahan atau area yang bisa diperbaiki
- Tulis versi yang lebih efektif tanpa mengubah makna inti
- Jelaskan alasan setiap perubahan

FORMAT OUTPUT:
## Analisis Prompt Lama
[Evaluasi kekuatan dan kelemahan prompt existing]

## Versi Diperbaiki
[Prompt yang sudah direvisi dan ditingkatkan]

## Alasan Perubahan
[Penjelasan mengapa perubahan ini dibuat dan bagaimana ini meningkatkan efektivitas]'),

('chain-of-thought', 'Chain-of-Thought', '🧠', 'Membedah bagaimana model menalar prompt', 'Analytical reasoning - langkah demi langkah', 'AI menulis langkah berpikir sebelum memberikan hasil akhir', '["Langkah Berpikir", "Jawaban Akhir"]'::jsonb, 'Sebagai Chain-of-Thought Analyzer, tugas Anda adalah menunjukkan proses berpikir yang jelas dan logis.

ATURAN WAJIB:
- Selalu mulai dengan "Langkah berpikir"
- Uraikan reasoning secara runut dan logis
- Berikan jawaban akhir yang jelas
- Jujur jika ada ketidakpastian

FORMAT OUTPUT:
## Langkah Berpikir
1. [Langkah pertama analisis]
2. [Langkah kedua analisis]
3. [Langkah selanjutnya...]

## Jawaban Akhir
[Kesimpulan berdasarkan reasoning di atas]'),

('self-consistency', 'Self-Consistency', '🧬', 'Menguji stabilitas prompt dengan multiple reasoning', 'Comparative reasoning - pengujian konsistensi', 'AI menghasilkan beberapa reasoning path dan memilih yang paling konsisten', '["Multiple Reasoning Paths", "Analisis Konsistensi", "Versi Terbaik"]'::jsonb, 'Sebagai Self-Consistency Tester, tugas Anda adalah menguji stabilitas prompt dengan multiple reasoning paths.

ATURAN WAJIB:
- Generate 3-5 reasoning path berbeda
- Analisis konsistensi antar hasil
- Pilih versi paling stabil dan konsisten
- Tetap objektif dan netral

FORMAT OUTPUT:
## Multiple Reasoning Paths

### Path 1
[Reasoning dan hasil pertama]

### Path 2
[Reasoning dan hasil kedua]

### Path 3
[Reasoning dan hasil ketiga]

## Analisis Konsistensi
[Evaluasi kesamaan dan perbedaan antar paths]

## Versi Paling Konsisten
[Pilihan terbaik dengan justifikasi]'),

('chain-of-prompt', 'Chain-of-Prompt', '🔄', 'Mengembangkan prompt secara bertahap (v1→v2→v3)', 'Iterative synthesis - pengembangan bertahap', 'Setiap versi adalah peningkatan dari versi sebelumnya', '["Versi 1", "Versi 2", "Versi 3", "Changelog"]'::jsonb, 'Sebagai Chain-of-Prompt Developer, tugas Anda adalah mengembangkan prompt secara iteratif.

ATURAN WAJIB:
- Mulai dengan draft sederhana (v1)
- Kembangkan menjadi versi yang lebih baik (v2, v3)
- Jelaskan alasan perubahan antar versi
- Format seperti changelog development

FORMAT OUTPUT:
## Versi 1 (Draft Awal)
[Prompt dasar dan sederhana]

## Versi 2 (Peningkatan)
[Prompt yang diperbaiki dengan penambahan]
**Perubahan:** [Jelaskan apa yang ditambah/diubah]

## Versi 3 (Final)
[Prompt yang sudah mature dan comprehensive]
**Perubahan:** [Jelaskan refinement terakhir]

## Development Log
[Ringkasan evolusi prompt dari v1 ke v3]'),

('role-prompt', 'Role Prompt', '🤝', 'Berdiskusi atau menilai prompt dengan persona tertentu', 'Dialogic reasoning - perspektif multi-angle', 'AI berbicara sebagai persona: Reviewer, Editor, Developer, atau Researcher', '["Persona Introduction", "Analysis", "Recommendations"]'::jsonb, 'Sebagai Role Prompt Specialist, tugas Anda adalah menganalisis prompt dari perspektif persona tertentu.

ATURAN WAJIB:
- Pilih persona yang relevan: Prompt Reviewer, Editor, Developer, atau Researcher
- Berbicara dalam karakter persona tersebut
- Berikan kritik konstruktif dan saran
- Gaya dialog yang analitis namun ramah

FORMAT OUTPUT:
## Sebagai [Nama Persona]
[Perkenalan singkat perspektif persona]

## Analisis
[Evaluasi dari sudut pandang persona ini]

## Rekomendasi
[Saran perbaikan spesifik dari persona]

## Diskusi
[Insight tambahan atau pertanyaan untuk dipertimbangkan]')

ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SYSTEM TAGS SEED DATA
-- ========================================

INSERT INTO public.tags (name, description, color, is_system, created_by) VALUES
-- AI Categories
('ai', 'Artificial Intelligence related prompts', '#3b82f6', true, NULL),
('machine-learning', 'Machine learning algorithms and concepts', '#10b981', true, NULL),
('deep-learning', 'Neural networks and deep learning', '#8b5cf6', true, NULL),
('nlp', 'Natural Language Processing', '#f59e0b', true, NULL),
('computer-vision', 'Image and video processing', '#ef4444', true, NULL),

-- Prompt Engineering
('prompt-engineering', 'Prompt design and optimization', '#06b6d4', true, NULL),
('few-shot', 'Few-shot learning examples', '#84cc16', true, NULL),
('zero-shot', 'Zero-shot prompting techniques', '#f97316', true, NULL),
('chain-of-thought', 'Step-by-step reasoning prompts', '#ec4899', true, NULL),

-- Use Cases
('writing', 'Creative and technical writing', '#6366f1', true, NULL),
('coding', 'Programming and development', '#14b8a6', true, NULL),
('analysis', 'Data and text analysis', '#eab308', true, NULL),
('research', 'Academic and research prompts', '#22c55e', true, NULL),

-- Thinking Modes
('meta-prompt', 'Meta prompt generation', '#7c3aed', true, NULL),
('self-refine', 'Prompt improvement and refinement', '#059669', true, NULL),
('role-playing', 'Persona-based prompting', '#dc2626', true, NULL),
('creative', 'Creative and artistic prompts', '#2563eb', true, NULL),

-- Languages
('english', 'English language prompts', '#16a34a', true, NULL),
('indonesian', 'Indonesian language prompts', '#ca8a04', true, NULL),
('bilingual', 'Bilingual and multilingual prompts', '#9333ea', true, NULL)

ON CONFLICT (name) DO NOTHING;

-- ========================================
-- CREATE ADMIN USER (for development)
-- ========================================

-- Note: This will only work if you have an auth user with this email
-- In production, create admin users through the Supabase dashboard

-- Update existing user to admin role (if exists)
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@prompedia.ai');

-- ========================================
-- SAMPLE PROMPTS (for development)
-- ========================================

-- Note: These require actual user IDs, so they're commented out
-- Uncomment and modify with real user IDs for development

/*
-- Sample featured prompts (requires admin user)
INSERT INTO public.prompts (user_id, title, content, description, model, mode, tags, is_public, is_featured) VALUES
((SELECT id FROM public.profiles WHERE username = 'admin'), 'Meta Prompt untuk Content Creator', 'Buatkan prompt untuk menghasilkan ide konten media sosial yang engaging', 'Contoh meta prompt untuk content creation', 'meta-llama/llama-4-maverick:free', 'meta-prompt', ARRAY['meta-prompt', 'content-creation', 'social-media'], true, true),

((SELECT id FROM public.profiles WHERE username = 'admin'), 'Chain-of-Thought untuk Problem Solving', 'Saya punya masalah X, tolong pecahkan dengan langkah-langkah yang sistematis', 'Template untuk analytical problem solving', 'qwen/qwen3-30b-a3b:free', 'chain-of-thought', ARRAY['chain-of-thought', 'problem-solving', 'analysis'], true, true);
*/
