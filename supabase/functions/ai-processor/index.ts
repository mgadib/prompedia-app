import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ALLOWED_ORIGINS = [
  'https://prompedia.app',
  'https://www.prompedia.app',
  'http://localhost:8080',
  'http://localhost:8083'
];

// IP-based rate limiting (in-memory)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 100;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const ipRateLimits = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimits.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

const checkRateLimit = (ip: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    ipRateLimits.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
};

const corsHeaders = (origin: string | null): Record<string, string> => {
  // Mengizinkan domain preview Lovable dan origin yang dikonfigurasi
  const isLovablePreview = origin?.includes('.lovable.app') || origin?.includes('.lovableproject.com') || false;
  const isAllowedOrigin = origin ? ALLOWED_ORIGINS.includes(origin) : false;
  
  const allowedOrigin = (isLovablePreview || isAllowedOrigin) && origin ? origin : ALLOWED_ORIGINS[0];
    
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// Schema validasi input menggunakan Zod untuk keamanan
// Hanya mengizinkan 2 model: Llama 4 Maverick dan Qwen 3 30B
const ALLOWED_MODELS = [
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen3-30b-a3b:free'
] as const;

const ALLOWED_MODES = ['creative', 'balanced', 'precise', 'custom', null, undefined] as const;

const RequestSchema = z.object({
  model: z.string().min(1).max(100).refine(
    (val) => ALLOWED_MODELS.includes(val as any),
    { message: 'Invalid model selection. Please select from allowed models.' }
  ),
  prompt: z.string().min(1, 'Prompt cannot be empty').max(50000, 'Prompt exceeds maximum length of 50000 characters'),
  mode: z.string().max(50).optional().nullable(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().min(1).max(16384).optional(),
    top_p: z.number().min(0).max(1).optional()
  }).optional()
});

serve(async (req) => {
  // Logging keamanan untuk audit trail
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  console.log(`[${timestamp}] [${requestId}] AI Processor Request:`, {
    method: req.method,
    origin,
    userAgent: userAgent.substring(0, 100), // Potong untuk keamanan
    ip: ip.substring(0, 50), // Potong untuk keamanan
    url: req.url
  });

  // Menangani request CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req.headers.get('origin')) })
  }

  // Check IP-based rate limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`);
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: `You have exceeded the maximum of ${RATE_LIMIT_MAX_REQUESTS} requests per hour. Please try again later.`,
      retry_after: RATE_LIMIT_WINDOW_MS / 1000 // seconds
    }), {
      status: 429,
      headers: {
        ...corsHeaders(req.headers.get('origin')),
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString()
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Mendapatkan user saat ini (opsional untuk guest user)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError)
      return new Response(JSON.stringify({ 
        error: 'Invalid request body. Expected valid JSON.',
        details: parseError instanceof Error ? parseError.message : 'JSON parse error'
      }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Memvalidasi request body menggunakan schema Zod
    const validation = RequestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error(`[${requestId}] Request validation failed:`, validation.error.errors)
      return new Response(JSON.stringify({ 
        error: 'Invalid input parameters',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }
    
    // Menggunakan data yang sudah divalidasi
    const validatedData = validation.data
    
    console.log(`[${requestId}] Request body validated:`, { 
      model: validatedData.model,
      promptLength: validatedData.prompt.length,
      mode: validatedData.mode,
      hasOptions: !!validatedData.options
    })

    const { model, prompt, mode, options = {} } = validatedData

    // Menyucikan input prompt (lapisan tambahan setelah validasi)
    const sanitizedPrompt = prompt
      .trim()
      .normalize('NFKC')  // Mencegah Unicode exploits
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Menghapus karakter kontrol
      .replace(/<[^>]*>/g, '')  // Menghapus tag HTML
      .replace(/javascript:/gi, '')  // Menghapus protocol javascript:
      .replace(/data:/gi, '')  // Menghapus protocol data:
      .replace(/on\w+\s*=/gi, '');  // Menghapus event handlers

    // Memetakan model ke API key yang sesuai
    const getApiKeyForModel = (modelId: string): string | undefined => {
      if (modelId.includes('llama-4-maverick') || modelId.includes('llama4') || modelId.includes('llama-3.1')) {
        return Deno.env.get('OPENROUTER_API_KEY_LLAMA4_MAVERICK')
      } else if (modelId.includes('qwen3') || modelId.includes('qwen-2.5') || modelId.includes('qwen/')) {
        return Deno.env.get('OPENROUTER_API_KEY_QWEN3_30B')
      }
      // Fallback ke default key
      return Deno.env.get('OPENROUTER_API_KEY')
    }

    const apiKey = getApiKeyForModel(model)
    
    if (!apiKey) {
      console.error(`[${requestId}] No API key found for model:`, model)
      return new Response(JSON.stringify({ 
        error: `No API key configured for model: ${model}`,
        model_requested: model
      }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`[${requestId}] Using API key for model:`, model)

    // Opsional: mencoba memetakan model id ke nama yang ramah jika tabel ada
    let modelName = model
    try {
      const { data: modelData } = await supabaseClient
        .from('ai_models')
        .select('id, name')
        .eq('id', model)
        .single()
      if (modelData?.name) modelName = modelData.name
    } catch (_) {
      // Abaikan jika tabel tidak ada atau query gagal
    }

    // Mendapatkan instruksi thinking mode jika disediakan
    let enhancedPrompt = sanitizedPrompt
    let modeContext = ''

    if (mode) {
      // Tahan terhadap schema tanpa kolom `is_active`
      const { data: modeData, error: modeErr } = await supabaseClient
        .from('thinking_modes')
        .select('instructions, thinking_pattern, description')
        .eq('id', mode)
        .single()

      if (!modeErr && modeData) {
        // Konteks mode ditambahkan sebagai system message
        modeContext = `Anda sedang beroperasi dalam mode "${mode}".
Pola berpikir: ${modeData.thinking_pattern}
Instruksi mode: ${modeData.instructions}`;

        // Prompt yang ditingkatkan menggunakan prompt yang sudah disucikan
        enhancedPrompt = sanitizedPrompt
      }
    }

    // Memanggil API OpenRouter dengan fallback spesifik model
    // Hanya mengizinkan 2 model: Llama 4 Maverick dan Qwen 3 30B
    const ALLOWED_MODELS = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
    
    // Memvalidasi model yang diizinkan
    if (!ALLOWED_MODELS.includes(model)) {
      console.error(`[${requestId}] Model not allowed: ${model}. Only ${ALLOWED_MODELS.join(', ')} are allowed.`);
      return new Response(JSON.stringify({ 
        error: `Model "${model}" is not available. Please select from: ${ALLOWED_MODELS.join(', ')}`,
        allowed_models: ALLOWED_MODELS
      }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }
    
    const getModelFallbacks = (modelId: string): string[] => {
      // Hanya mengizinkan fallback di dalam 2 model yang diizinkan
      if (modelId === 'qwen/qwen3-30b-a3b:free') {
        return [
          'qwen/qwen3-30b-a3b:free', // Utama
          'meta-llama/llama-4-maverick:free' // Fallback ke model lain yang diizinkan
        ];
      } else if (modelId === 'meta-llama/llama-4-maverick:free') {
        return [
          'meta-llama/llama-4-maverick:free', // Utama
          'qwen/qwen3-30b-a3b:free' // Fallback ke model lain yang diizinkan
        ];
      }
      // Jika model tidak valid terlewat, kembalikan array kosong
      return [];
    };

    const tryModels: string[] = getModelFallbacks(model);

    let lastErrorText = ''
    let lastStatus = 0

    for (const candidate of tryModels) {
      const key = getApiKeyForModel(candidate)
      if (!key) continue

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://prompedia.app',
          'X-Title': 'Prompedia AI'
        },
        body: JSON.stringify({
          model: candidate,
          messages: modeContext
            ? [
                { role: 'system', content: modeContext },
                { role: 'user', content: enhancedPrompt }
              ]
            : [
                { role: 'user', content: enhancedPrompt }
              ],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 8192,
          top_p: options.top_p || 1.0
        })
      })

      if (resp.ok) {
        const aiResponse = await resp.json()
        const usedModelName = candidate

        // Mencatat session untuk analitik (hanya untuk user terautentikasi)
        if (user) {
          await supabaseClient.from('user_sessions').insert({
            user_id: user.id,
            session_data: {
              model: candidate,
              mode: mode || null,
              prompt_length: prompt.length,
              response_length: aiResponse.choices[0]?.message?.content?.length || 0,
              tokens_used: aiResponse.usage?.total_tokens || 0,
              model_name: usedModelName,
              fallback_used: candidate !== model
            }
          })
        }

        // Mengembalikan response AI
        return new Response(JSON.stringify({
          ...aiResponse,
          metadata: {
            model: usedModelName,
            mode: mode || null,
            tokens_used: aiResponse.usage?.total_tokens || 0,
            fallback_used: candidate !== model
          }
        }), {
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }

      lastStatus = resp.status
      lastErrorText = await resp.text()
      console.error(`[${requestId}] OpenRouter API error for model ${candidate}:`, {
        status: resp.status,
        error: lastErrorText.substring(0, 500)
      })
      
      // Jika rate-limited, payment required, atau masalah content moderation, coba model berikutnya; jika tidak, berhenti dan kembalikan
      if (resp.status !== 429 && resp.status !== 402 && resp.status !== 403) {
        return new Response(JSON.stringify({
          error: 'OpenRouter API error',
          status: resp.status,
          model_tried: candidate,
          details: lastErrorText.substring(0, 500)
        }), {
          status: resp.status,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }
      console.log(`[${requestId}] Trying fallback model after ${resp.status} error...`)
    }

    // Jika semua kandidat gagal karena rate limit atau payment
    return new Response(JSON.stringify({
      error: 'All providers are temporarily rate-limited. Please retry in a moment.',
      status: lastStatus || 429,
      details: lastErrorText
    }), {
      status: 429,
      headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })


  } catch (error) {
    console.error(`[${timestamp}] [${requestId}] Error in ai-processor:`, {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      origin,
      userAgent: userAgent.substring(0, 100),
      ip: ip.substring(0, 50)
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
