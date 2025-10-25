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

  console.log(`[${timestamp}] [${requestId}] AI Processor Request:`, {
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

    // Get the current user (optional for guest users)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    const { model, prompt, mode, options = {} } = await req.json()

    // ENHANCED VALIDATION - Security improvements
    if (!model || typeof model !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid model parameter' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Model whitelist validation
    const ALLOWED_MODELS = [
      'meta-llama/llama-4-maverick:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      'openai/gpt-4o-mini:free',
      'openai/gpt-4o:free',
      'anthropic/claude-3.5-sonnet:free',
      'anthropic/claude-3-haiku:free'
    ];

    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid model selection. Please select from allowed models.' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } 
      })
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt parameter' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Length validation
    const MAX_PROMPT_LENGTH = 50000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ 
        error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` 
      }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Sanitize prompt input
    const sanitizedPrompt = prompt
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '');

    // Validate mode parameter
    const ALLOWED_MODES = ['creative', 'balanced', 'precise', 'custom', null, undefined];
    if (mode && !ALLOWED_MODES.includes(mode)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid mode parameter. Allowed modes: creative, balanced, precise, custom' 
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

    // Validate options properties
    if (options.temperature && (options.temperature < 0 || options.temperature > 2)) {
      return new Response(JSON.stringify({ error: 'Invalid temperature value. Must be between 0 and 2.' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    if (options.max_tokens && (options.max_tokens < 1 || options.max_tokens > 16384)) {
      return new Response(JSON.stringify({ error: 'Invalid max_tokens value. Must be between 1 and 16384.' }), {
        status: 400,
        headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      })
    }

    // Map model to appropriate API key
    const getApiKeyForModel = (modelId: string): string | undefined => {
      if (modelId.includes('llama-4-maverick') || modelId.includes('llama4') || modelId.includes('llama-3.1')) {
        return Deno.env.get('OPENROUTER_API_KEY_LLAMA4_MAVERICK')
      } else if (modelId.includes('qwen3-30b') || modelId.includes('qwen-2.5') || modelId.includes('qwen/')) {
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

    // Optional: try to map model id to friendly name if table exists
    let modelName = model
    try {
      const { data: modelData } = await supabaseClient
        .from('ai_models')
        .select('id, name, is_active')
        .eq('id', model)
        .eq('is_active', true)
        .single()
      if (modelData?.name) modelName = modelData.name
    } catch (_) {
      // Ignore if table doesn't exist or query fails
    }

    // Get thinking mode instructions if provided
    let enhancedPrompt = sanitizedPrompt
    let modeContext = ''

    if (mode) {
      const { data: modeData } = await supabaseClient
        .from('thinking_modes')
        .select('instructions, thinking_pattern, description')
        .eq('id', mode)
        .eq('is_active', true)
        .single()

      if (modeData) {
        // Mode context ditambahkan sebagai system message
        modeContext = `Anda sedang beroperasi dalam mode "${mode}".
Pola berpikir: ${modeData.thinking_pattern}
Instruksi mode: ${modeData.instructions}`;

        // Enhanced prompt menggunakan sanitized prompt
        enhancedPrompt = sanitizedPrompt
      }
    }

    // Call OpenRouter API with model-specific fallbacks
    const getModelFallbacks = (modelId: string): string[] => {
      // Only try the same model or its variants, no cross-model fallbacks
      if (modelId.includes('qwen')) {
        return [
          modelId,
          'qwen/qwen3-30b-a3b:free', // Try standard qwen if variant fails
          'qwen/qwen-2.5-72b:free'
        ];
      } else if (modelId.includes('llama') || modelId.includes('meta')) {
        return [
          modelId,
          'meta-llama/llama-4-maverick:free', // Try standard llama if variant fails
          'meta-llama/llama-3.1-70b:free'
        ];
      }
      // Default: only try the requested model
      return [modelId];
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

        // Log the session for analytics (only for authenticated users)
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

        // Return the AI response
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
      // If rate-limited or payment required, try next model; otherwise stop and return
      if (resp.status !== 429 && resp.status !== 402) {
        console.error('OpenRouter API error:', resp.status, lastErrorText)
        return new Response(JSON.stringify({
          error: 'OpenRouter API error',
          status: resp.status,
          details: lastErrorText
        }), {
          status: resp.status,
          headers: { ...corsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        })
      }
    }

    // If all candidates failed due to rate limits or payment
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
