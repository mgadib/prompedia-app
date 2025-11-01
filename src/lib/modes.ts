export interface ThinkingMode {
  id: string;
  label: string;
  name: string; // Add name for DB compatibility
  icon: string;
  description: string;
  purpose: string;
  thinkingPattern: string;
  outputStructure: string[];
  instructions: string;
  example?: string;
}

export const THINKING_MODES: ThinkingMode[] = [
  {
    id: 'meta-prompt',
    label: 'Meta Prompt',
    name: 'Meta Prompt', // Add name for DB compatibility
    icon: '🪄',
    description: 'Menghasilkan prompt baru dari ide mentah pengguna',
    purpose: 'Divergent thinking - meluaskan kemungkinan',
    thinkingPattern: 'AI tidak menjawab tugas langsung, tapi menulis prompt untuk menjawab tugas tersebut',
    outputStructure: ['Tujuan Prompt', 'Instruksi AI', 'Format Output'],
    instructions: `Sebagai Meta Prompt Generator, tugas Anda adalah mengubah ide mentah pengguna menjadi prompt yang terstruktur dan efektif.

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
[Tentukan struktur output yang diinginkan]`
  },
  {
    id: 'self-refine',
    label: 'Self-Refine',
    name: 'Self-Refine', // Add name for DB compatibility
    icon: '✏️',
    description: 'Memperjelas dan memperbaiki prompt yang sudah ada',
    purpose: 'Reflective thinking - analisis dan perbaikan',
    thinkingPattern: 'AI membaca prompt lama dan menulis versi baru yang lebih efektif',
    outputStructure: ['Analisis Prompt Lama', 'Versi Diperbaiki', 'Alasan Perubahan'],
    instructions: `Sebagai Self-Refine Specialist, tugas Anda adalah menganalisis dan memperbaiki prompt yang sudah ada.

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
[Penjelasan mengapa perubahan ini dibuat dan bagaimana ini meningkatkan efektivitas]`
  },
  {
    id: 'chain-of-thought',
    label: 'Chain-of-Thought',
    name: 'Chain-of-Thought', // Add name for DB compatibility
    icon: '🧠',
    description: 'Membedah bagaimana model menalar prompt',
    purpose: 'Analytical reasoning - langkah demi langkah',
    thinkingPattern: 'AI menulis langkah berpikir sebelum memberikan hasil akhir',
    outputStructure: ['Langkah Berpikir', 'Jawaban Akhir'],
    instructions: `Sebagai Chain-of-Thought Analyzer, tugas Anda adalah menunjukkan proses berpikir yang jelas dan logis.

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
[Kesimpulan berdasarkan reasoning di atas]`
  },
  {
    id: 'self-consistency',
    label: 'Self-Consistency',
    name: 'Self-Consistency', // Add name for DB compatibility
    icon: '🧬',
    description: 'Menguji stabilitas prompt dengan multiple reasoning',
    purpose: 'Comparative reasoning - pengujian konsistensi',
    thinkingPattern: 'AI menghasilkan beberapa reasoning path dan memilih yang paling konsisten',
    outputStructure: ['Multiple Reasoning Paths', 'Analisis Konsistensi', 'Versi Terbaik'],
    instructions: `Sebagai Self-Consistency Tester, tugas Anda adalah menguji stabilitas prompt dengan multiple reasoning paths.

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
[Pilihan terbaik dengan justifikasi]`
  },
  {
    id: 'chain-of-prompt',
    label: 'Chain-of-Prompt',
    name: 'Chain-of-Prompt', // Add name for DB compatibility
    icon: '🔄',
    description: 'Mengembangkan prompt secara bertahap (v1→v2→v3)',
    purpose: 'Iterative synthesis - pengembangan bertahap',
    thinkingPattern: 'Setiap versi adalah peningkatan dari versi sebelumnya',
    outputStructure: ['Versi 1', 'Versi 2', 'Versi 3', 'Changelog'],
    instructions: `Sebagai Chain-of-Prompt Developer, tugas Anda adalah mengembangkan prompt secara iteratif.

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
[Ringkasan evolusi prompt dari v1 ke v3]`
  },
  {
    id: 'role-prompt',
    label: 'Role Prompt',
    name: 'Role Prompt', // Add name for DB compatibility
    icon: '🤝',
    description: 'Berdiskusi atau menilai prompt dengan persona tertentu',
    purpose: 'Dialogic reasoning - perspektif multi-angle',
    thinkingPattern: 'AI berbicara sebagai persona: Reviewer, Editor, Developer, atau Researcher',
    outputStructure: ['Persona Introduction', 'Analysis', 'Recommendations'],
    instructions: `Sebagai Role Prompt Specialist, tugas Anda adalah menganalisis prompt dari perspektif persona tertentu.

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
[Insight tambahan atau pertanyaan untuk dipertimbangkan]`
  }
];

export const getModeById = (id: string): ThinkingMode | undefined => {
  return THINKING_MODES.find(mode => mode.id === id);
};

export const formatModeOutput = (mode: ThinkingMode, input: string, context?: any): string => {
  const basePrompt = `${mode.instructions}

KONTEKS:
Input dari pengguna: "${input}"

Ikuti format output yang telah ditentukan dan terapkan pola berpikir "${mode.thinkingPattern}".`;

  return basePrompt;
};

export const getModeInstructions = (modeId: string, userInput: string, existingPrompt?: string): string => {
  const mode = getModeById(modeId);
  if (!mode) return userInput;

  let contextualInstructions = mode.instructions;

  // Add mode-specific context
  switch (modeId) {
    case 'self-refine':
      if (existingPrompt) {
        contextualInstructions += `\n\nPROMPT YANG AKAN DIPERBAIKI:\n"${existingPrompt}"`;
      }
      break;
    case 'chain-of-prompt':
      contextualInstructions += `\n\nIDEA UNTUK DIKEMBANGKAN:\n"${userInput}"`;
      break;
    case 'role-prompt':
      contextualInstructions += `\n\nTOPIK DISKUSI:\n"${userInput}"`;
      break;
  }

  return `${contextualInstructions}\n\nTUGAS PENGGUNA:\n"${userInput}"\n\nSilakan kerjakan sesuai mode ${mode.label}.`;
};
