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

    const { prompts, operation, options = {} } = await req.json()

    // Validate input
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(JSON.stringify({ error: 'Prompts array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!operation || !['enhance', 'refine', 'expand', 'reimagine', 'reformat', 'review'].includes(operation)) {
      return new Response(JSON.stringify({ error: 'Valid operation is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = options.model || 'meta-llama/llama-4-maverick:free'
    const results = []

    // Process each prompt
    for (const promptItem of prompts) {
      try {
        const { id, content, currentMode } = promptItem

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
        let enhancedPrompt = content
        let modeInstructions = ''

        switch (operation) {
          case 'enhance':
            modeInstructions = `Sebagai Prompt Enhancement Specialist, tugas Anda adalah meningkatkan prompt yang diberikan dengan menambahkan konteks, contoh, dan instruksi yang lebih spesifik untuk menghasilkan output yang lebih baik.

KONTEKS:
Prompt asli: "${content}"

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
Prompt asli: "${content}"

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
Prompt asli: "${content}"

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
Prompt asli: "${content}"

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
Prompt asli: "${content}"

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
Prompt untuk direview: "${content}"

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
            'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://prompedia.ai',
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in prompt-enhancer:', error)
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
