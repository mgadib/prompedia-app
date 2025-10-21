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

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { model, prompt, mode, options = {} } = await req.json()

    // Validate required fields
    if (!model || !prompt) {
      return new Response(JSON.stringify({ error: 'Model and prompt are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify model exists and is active
    const { data: modelData } = await supabaseClient
      .from('ai_models')
      .select('id, name, is_active')
      .eq('id', model)
      .eq('is_active', true)
      .single()

    if (!modelData) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive model' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
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
      throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`)
    }

    const aiResponse = await openRouterResponse.json()

    // Log the session for analytics
    await supabaseClient.from('user_sessions').insert({
      user_id: user.id,
      session_data: {
        model,
        mode: mode || null,
        prompt_length: prompt.length,
        response_length: aiResponse.choices[0]?.message?.content?.length || 0,
        tokens_used: aiResponse.usage?.total_tokens || 0,
        model_name: modelData.name
      }
    })

    // Return the AI response
    return new Response(JSON.stringify({
      ...aiResponse,
      metadata: {
        model: modelData.name,
        mode: mode || null,
        tokens_used: aiResponse.usage?.total_tokens || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ai-processor:', error)
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
