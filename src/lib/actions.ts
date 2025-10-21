export interface PromptAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  purpose: string;
  thinkingPattern: string;
  instructions: string;
  rules: string[];
}

export const PROMPT_ACTIONS: PromptAction[] = [
  {
    id: 'refine',
    label: 'Refine',
    icon: '✏️',
    description: 'Memperbaiki hasil agar lebih jelas, fokus, dan efektif',
    purpose: 'Reflective thinking - melihat ulang dengan kesadaran',
    thinkingPattern: 'reflective',
    instructions: `Sebagai AI Refine Specialist, tugas Anda adalah memperbaiki konten yang diberikan agar lebih jelas, fokus, dan efektif.

ATURAN WAJIB:
- Jangan mengubah makna utama dari konten
- Perbaiki kejelasan, struktur, dan efektivitas
- Jelaskan alasan setiap perubahan yang dibuat
- Fokus pada improvement, bukan perubahan fundamental

FORMAT OUTPUT:
## Hasil Refined
[Konten yang sudah diperbaiki]

## Perubahan yang Dibuat
[Penjelasan alasan setiap perubahan untuk meningkatkan kualitas]`,
    rules: [
      'Jangan ubah makna utama',
      'Jelaskan alasan tiap perubahan',
      'Fokus pada kejelasan dan efektivitas',
      'Pertahankan essence dari konten original'
    ]
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: '🧩',
    description: 'Memperluas hasil dengan tambahan konteks, contoh, atau elaborasi',
    purpose: 'Exploratory thinking - perluas ruang ide',
    thinkingPattern: 'exploratory',
    instructions: `Sebagai AI Expand Specialist, tugas Anda adalah memperluas konten dengan tambahan konteks, contoh, dan elaborasi yang bermakna.

ATURAN WAJIB:
- Tambahkan nilai baru, bukan sekadar memperpanjang teks
- Berikan konteks tambahan yang relevan
- Sertakan contoh konkret jika memungkinkan
- Elaborasi dengan detail yang berguna

FORMAT OUTPUT:
## Hasil Expanded
[Konten yang sudah diperluas dengan nilai tambah]

## Nilai Tambahan
[Penjelasan elemen baru yang ditambahkan dan mengapa berguna]`,
    rules: [
      'Tambahkan nilai baru, bukan sekadar memperpanjang',
      'Berikan konteks yang relevan',
      'Sertakan contoh konkret',
      'Fokus pada elaborasi yang berguna'
    ]
  },
  {
    id: 'reimagine',
    label: 'Reimagine',
    icon: '🪄',
    description: 'Menciptakan versi baru dengan pendekatan kreatif',
    purpose: 'Divergent thinking - melihat dari sisi berbeda',
    thinkingPattern: 'divergent',
    instructions: `Sebagai AI Reimagine Specialist, tugas Anda adalah menciptakan versi baru dari konten dengan pendekatan yang kreatif dan berbeda.

ATURAN WAJIB:
- Boleh ubah tone, struktur, atau perspektif
- Jelaskan pendekatan baru di awal
- Pertahankan tujuan inti konten
- Berikan interpretasi segar yang menarik

FORMAT OUTPUT:
## Pendekatan Baru
[Penjelasan perspektif atau pendekatan kreatif yang digunakan]

## Hasil Reimagined
[Konten yang sudah dikembangkan ulang dengan pendekatan baru]

## Rationale
[Mengapa pendekatan ini dipilih dan apa keuntungannya]`,
    rules: [
      'Boleh ubah tone, struktur, atau perspektif',
      'Jelaskan pendekatan baru di awal',
      'Pertahankan tujuan inti',
      'Berikan interpretasi segar yang menarik'
    ]
  },
  {
    id: 'reformat',
    label: 'Reformat',
    icon: '🧾',
    description: 'Ubah bentuk output tanpa ubah makna',
    purpose: 'Structural thinking - ubah bentuk, jaga isi',
    thinkingPattern: 'structural',
    instructions: `Sebagai AI Reformat Specialist, tugas Anda adalah mengubah format presentasi konten tanpa mengubah makna atau informasi inti.

ATURAN WAJIB:
- Sebutkan format target (JSON, Markdown, tabel, list, dsb.)
- Pastikan struktur yang dipilih valid dan konsisten
- Jaga semua informasi penting tetap utuh
- Optimalisasi untuk readability format baru

FORMAT OUTPUT:
## Format Target
[Penjelasan format yang dipilih dan alasannya]

## Hasil Reformatted
[Konten dalam format baru yang telah dioptimalkan]

## Struktur Notes
[Penjelasan bagaimana informasi diorganisir dalam format baru]`,
    rules: [
      'Sebutkan format target dengan jelas',
      'Pastikan struktur valid dan konsisten',
      'Jaga semua informasi penting',
      'Optimalisasi untuk readability'
    ]
  },
  {
    id: 'self-review',
    label: 'Self-Review',
    icon: '🪞',
    description: 'Evaluasi diri hasil sebelumnya secara objektif',
    purpose: 'Metacognitive thinking - menilai kualitas pikirannya sendiri',
    thinkingPattern: 'metacognitive',
    instructions: `Sebagai AI Self-Review Specialist, tugas Anda adalah mengevaluasi konten yang diberikan secara objektif dan memberikan penilaian konstruktif.

ATURAN WAJIB:
- Beri penilaian setiap aspek dengan skala 1-10
- Evaluasi objektif tanpa bias
- Identifikasi kekuatan dan kelemahan
- Akhiri dengan rekomendasi singkat untuk improvement

FORMAT OUTPUT:
## Evaluasi Objektif
**Kejelasan (1-10):** [Skor] - [Penjelasan]
**Struktur (1-10):** [Skor] - [Penjelasan]  
**Completeness (1-10):** [Skor] - [Penjelasan]
**Efektivitas (1-10):** [Skor] - [Penjelasan]

## Analisis
### Kekuatan
[Aspek-aspek yang sudah baik]

### Area Improvement
[Aspek yang bisa diperbaiki]

## Rekomendasi
[Saran singkat untuk peningkatan kualitas]`,
    rules: [
      'Beri penilaian tiap aspek (1-10)',
      'Evaluasi objektif tanpa bias',
      'Identifikasi kekuatan dan kelemahan',
      'Akhiri dengan rekomendasi singkat'
    ]
  }
];

export const getActionById = (id: string): PromptAction | undefined => {
  return PROMPT_ACTIONS.find(action => action.id === id);
};

export const generateActionInstructions = (actionId: string, content: string): string => {
  const action = getActionById(actionId);
  if (!action) return content;

  return `${action.instructions}

KONTEN YANG AKAN DIPROSES:
"${content}"

Silakan proses konten di atas sesuai dengan aturan ${action.label} yang telah ditentukan.`;
};
