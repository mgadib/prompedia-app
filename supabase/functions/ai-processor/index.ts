import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Validate required fields
    if (!model || !prompt) {
      return new Response(JSON.stringify({ error: 'Model and prompt are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Map model to appropriate API key
    const getApiKeyForModel = (modelId: string): string | undefined => {
      if (modelId.includes('llama-4-maverick') || modelId.includes('llama4')) {
        return Deno.env.get('OPENROUTER_API_KEY_LLAMA4_MAVERICK')
      } else if (modelId.includes('qwen3-30b')) {
        return Deno.env.get('OPENROUTER_API_KEY_QWEN3_30B')
      } else if (modelId.includes('deepseek')) {
        return Deno.env.get('OPENROUTER_API_KEY_DEEPSEEK_V3')
      } else if (modelId.includes('oss-20b')) {
        return Deno.env.get('OPENROUTER_API_KEY_OPENAI_OSS_20B')
      }
      // Fallback to default key
      return Deno.env.get('OPENROUTER_API_KEY')
    }

    const apiKey = getApiKeyForModel(model)
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: `No API key configured for model: ${model}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    let enhancedPrompt = prompt
    if (mode) {
      const { data: modeData } = await supabaseClient
        .from('thinking_modes')
        .select('instructions, thinking_pattern')
        .eq('id', mode)
        .eq('is_active', true)
        .single()

      if (modeData) {
        enhancedPrompt = `${modeData.instructions}\n\nKONTEKS:\nInput dari pengguna: "${prompt}"\n\nIkuti format output yang telah ditentukan dan terapkan pola berpikir "${modeData.thinking_pattern}".`
      }
    }

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompedia.ai',
        'X-Title': 'Prompedia AI'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: enhancedPrompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        top_p: options.top_p || 1.0
      })
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter API error:', openRouterResponse.status, errorText)
      return new Response(JSON.stringify({
        error: 'OpenRouter API error',
        status: openRouterResponse.status,
        details: errorText
      }), {
        status: openRouterResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiResponse = await openRouterResponse.json()

    // Log the session for analytics (only for authenticated users)
    if (user) {
      await supabaseClient.from('user_sessions').insert({
        user_id: user.id,
        session_data: {
          model,
          mode: mode || null,
          prompt_length: prompt.length,
          response_length: aiResponse.choices[0]?.message?.content?.length || 0,
          tokens_used: aiResponse.usage?.total_tokens || 0,
          model_name: modelName
        }
      })
    }

    // Return the AI response
    return new Response(JSON.stringify({
      ...aiResponse,
      metadata: {
        model: modelName,
        mode: mode || null,
        tokens_used: aiResponse.usage?.total_tokens || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ai-processor:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
