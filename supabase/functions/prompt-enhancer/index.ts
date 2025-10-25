import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://prompedia.app',
  'https://www.prompedia.app',
  'http://localhost:8080',
  'http://localhost:8083'
];

const corsHeaders = (origin: string | null): Record<string, string> => {
  // Allow Lovable preview domains and configured origins
  const isLovablePreview = origin?.includes('.lovableproject.com') || false;
  const isAllowedOrigin = origin ? ALLOWED_ORIGINS.includes(origin) : false;
  
  const allowedOrigin = (isLovablePreview || isAllowedOrigin) && origin ? origin : ALLOWED_ORIGINS[0];
    
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

serve(async (req) => {
  // Security logging
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  console.log(`[${timestamp}] [${requestId}] Prompt Enhancer Request:`, {
    method: req.method,
    origin,
    userAgent: userAgent.substring(0, 100), // Truncate for security
    ip: ip.substring(0, 50), // Truncate for security
    url: req.url
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req.headers.get('origin')) })
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

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Check rate limits before processing
    const { data: usageCheck, error: usageError } = await supabaseClient.rpc('get_current_usage', {
      p_user_id: user.id,
      p_is_guest: false,
      p_session_id: null
    });

    if (usageError) {
      return new Response(JSON.stringify({ error: 'Failed to check usage limits' }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    const dailyLimit = 27; // Authenticated user daily limit
    const currentUsage = usageCheck?.usage_count || 0;
    const remainingUsage = dailyLimit - currentUsage;

    if (remainingUsage <= 0) {
      return new Response(JSON.stringify({
        error: `Daily AI usage limit exceeded. You have used ${currentUsage}/${dailyLimit} calls today. Limit resets at midnight GMT+7.`
      }), {
        status: 429,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Show warning when approaching limit
    if (remainingUsage <= 3) {
      console.log(`[Rate Limit Warning] User ${user.id} has ${remainingUsage} calls remaining`);
    }

    const { prompts, operation, options = {} } = await req.json()

    // ENHANCED VALIDATION - Security improvements
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(JSON.stringify({ error: 'Prompts array is required' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Validate operation parameter
    const ALLOWED_OPERATIONS = ['enhance', 'summarize', 'expand', 'refine', 'translate'];
    if (!operation || !ALLOWED_OPERATIONS.includes(operation)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid operation. Allowed operations: enhance, summarize, expand, refine, translate' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } 
      })
    }

    // Validate options object type
    if (options && typeof options !== 'object') {
      return new Response(JSON.stringify({ 
        error: 'Invalid options parameter. Must be an object.' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } 
      })
    }

    // Validate prompts array structure and content
    for (const promptItem of prompts) {
      if (!promptItem || typeof promptItem !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid prompt item structure' }), {
          status: 400,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }

      if (!promptItem.id || typeof promptItem.id !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid prompt ID' }), {
          status: 400,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }

      if (!promptItem.content || typeof promptItem.content !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid prompt content' }), {
          status: 400,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }

      // Length validation for each prompt
      const MAX_PROMPT_LENGTH = 50000;
      if (promptItem.content.length > MAX_PROMPT_LENGTH) {
        return new Response(JSON.stringify({ 
          error: `Prompt content exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` 
        }), {
          status: 400,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }
    }

    if (!operation || !['enhance', 'refine', 'expand', 'reimagine', 'reformat', 'review'].includes(operation)) {
      return new Response(JSON.stringify({ error: 'Valid operation is required' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Model whitelist validation
    const ALLOWED_MODELS = [
      'meta-llama/llama-4-maverick:free',
      'qwen/qwen3-30b-a3b:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'qwen/qwen-2.5-72b:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      'meta-llama/llama-3.1-70b:free',
      'openai/gpt-4o-mini:free',
      'openai/gpt-4o:free',
      'anthropic/claude-3.5-sonnet:free',
      'anthropic/claude-3-haiku:free'
    ];

    const model = options.model || 'meta-llama/llama-4-maverick:free';
    
    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid model selection. Please select from allowed models.' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } 
      })
    }

    // Map model to appropriate API key and validate
    const getApiKeyForModel = (modelId: string): string | undefined => {
      if (modelId.includes('llama-4-maverick') || modelId.includes('llama4') || modelId.includes('llama-3.1')) {
        return Deno.env.get('OPENROUTER_API_KEY_LLAMA4_MAVERICK')
      } else if (modelId.includes('qwen3') || modelId.includes('qwen-2.5') || modelId.includes('qwen/')) {
        return Deno.env.get('OPENROUTER_API_KEY_QWEN3_30B')
      }
      // Fallback to default key
      return Deno.env.get('OPENROUTER_API_KEY')
    }

    const apiKey = getApiKeyForModel(model)

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `No API key configured for model: ${model}` }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }
    const results = []

    // Process each prompt
    for (const promptItem of prompts) {
      try {
        const { id, content, currentMode } = promptItem

        // Sanitize prompt content
        const sanitizedContent = content
          .trim()
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '');

        // Verify the prompt belongs to the user
        const { data: promptData } = await supabaseClient
          .from('prompts')
          .select('id, content, user_id, usage_stats')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (!promptData) {
          results.push({
            id,
            success: false,
            error: 'Prompt not found or access denied'
          })
          continue
        }

        // Create enhanced prompt based on operation
        const enhancedPrompt = sanitizedContent
        let modeInstructions = ''

        switch (operation) {
          case 'enhance':
            modeInstructions = `Sebagai Prompt Enhancement Specialist, tugas Anda adalah meningkatkan prompt yang diberikan dengan menambahkan konteks, contoh, dan instruksi yang lebih spesifik untuk menghasilkan output yang lebih baik.

KONTEKS:
Prompt asli: "${sanitizedContent}"

ATURAN WAJIB:
- Pertahankan maksud utama dari prompt asli
- Tambahkan konteks dan contoh yang relevan
- Buat instruksi lebih spesifik dan terstruktur
- Pastikan prompt lebih efektif dan mudah dipahami

FORMAT OUTPUT:
## Prompt yang Ditingkatkan
[Prompt yang sudah diperbaiki dengan konteks tambahan]

## Perubahan yang Dibuat
[Jelaskan improvement yang dilakukan]`
            break

          case 'refine':
            modeInstructions = `Sebagai Prompt Refinement Expert, tugas Anda adalah memperjelas dan memperbaiki prompt yang sudah ada.

KONTEKS:
Prompt asli: "${sanitizedContent}"

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
            break

          case 'expand':
            modeInstructions = `Sebagai Prompt Expansion Specialist, tugas Anda adalah mengembangkan prompt dengan menambahkan detail, konteks, dan instruksi tambahan.

KONTEKS:
Prompt asli: "${sanitizedContent}"

ATURAN WAJIB:
- Perluas prompt dengan informasi tambahan yang relevan
- Tambahkan konteks yang membantu AI memahami tugas
- Sertakan contoh atau guideline jika diperlukan
- Pastikan prompt lebih komprehensif

FORMAT OUTPUT:
## Prompt yang Diperluas
[Prompt dengan detail dan konteks tambahan]

## Elemen yang Ditambahkan
[Jelaskan bagian baru yang ditambahkan dan alasannya]`
            break

          case 'reimagine':
            modeInstructions = `Sebagai Creative Prompt Reimaginer, tugas Anda adalah membuat versi kreatif dan inovatif dari prompt yang ada.

KONTEKS:
Prompt asli: "${sanitizedContent}"

ATURAN WAJIB:
- Berikan perspektif baru dan kreatif
- Jaga esensi utama tapi tambahkan elemen inovatif
- Buat prompt lebih engaging dan unik
- Pertimbangkan pendekatan alternatif

FORMAT OUTPUT:
## Versi Kreatif
[Prompt yang direimajinasikan dengan pendekatan baru]

## Inovasi yang Dibuat
[Jelaskan perubahan kreatif dan alasannya]`
            break

          case 'reformat':
            modeInstructions = `Sebagai Prompt Formatting Specialist, tugas Anda adalah menyusun ulang prompt dengan struktur yang lebih baik.

KONTEKS:
Prompt asli: "${sanitizedContent}"

ATURAN WAJIB:
- Perbaiki struktur dan formatting
- Pisahkan instruksi menjadi bagian yang lebih jelas
- Tambahkan heading dan bullet points jika diperlukan
- Pastikan readability dan clarity

FORMAT OUTPUT:
## Prompt yang Diformat Ulang
[Prompt dengan struktur yang lebih baik]

## Perubahan Struktur
[Jelaskan improvement dalam formatting]`
            break

          case 'review':
            modeInstructions = `Sebagai Prompt Quality Reviewer, tugas Anda adalah mengevaluasi dan memberikan feedback konstruktif untuk prompt.

KONTEKS:
Prompt untuk direview: "${sanitizedContent}"

ATURAN WAJIB:
- Evaluasi kekuatan dan kelemahan prompt
- Berikan saran perbaikan yang spesifik
- Pertimbangkan clarity, specificity, dan effectiveness
- Berikan rating dan rekomendasi

FORMAT OUTPUT:
## Review Summary
[Ringkasan evaluasi keseluruhan]

## Kekuatan
[List kekuatan prompt]

## Area untuk Perbaikan
[List kelemahan dan saran]

## Rating dan Rekomendasi
[Berikan rating 1-10 dan rekomendasi]`
            break
        }

        // Call OpenRouter API for enhancement
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://prompedia.app',
            'X-Title': 'Prompedia AI'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: modeInstructions }],
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2048,
            top_p: options.top_p || 1.0
          })
        })

        if (!openRouterResponse.ok) {
          throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`)
        }

        const aiResponse = await openRouterResponse.json()
        const enhancedContent = aiResponse.choices[0]?.message?.content || ''

        // Update the prompt with enhanced content
        const { error: updateError } = await supabaseClient
          .from('prompts')
          .update({
            content: enhancedContent,
            model: model,
            usage_stats: {
              ...promptData.usage_stats,
              last_enhanced: new Date().toISOString(),
              enhancement_operation: operation
            }
          })
          .eq('id', id)

        if (updateError) {
          results.push({
            id,
            success: false,
            error: updateError.message
          })
        } else {
          results.push({
            id,
            success: true,
            original_content: content,
            enhanced_content: enhancedContent,
            operation
          })
        }

      } catch (error) {
        console.error(`Error processing prompt ${promptItem.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        results.push({
          id: promptItem.id,
          success: false,
          error: errorMessage
        })
      }
    }

    // Increment usage counter after successful batch processing
    await supabaseClient.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_is_guest: false,
      p_session_id: null
    });

    // Log the batch operation
    await supabaseClient.from('user_sessions').insert({
      user_id: user.id,
      session_data: {
        operation: 'batch_enhancement',
        operation_type: operation,
        prompts_processed: prompts.length,
        successful_operations: results.filter(r => r.success).length,
        model_used: model
      }
    })

    return new Response(JSON.stringify({
      success: true,
      operation,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      results
    }), {
      headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${timestamp}] [${requestId}] Error in prompt-enhancer:`, {
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
