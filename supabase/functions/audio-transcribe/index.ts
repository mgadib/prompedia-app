import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [${requestId}] Audio Transcribe Request:`, {
    method: req.method,
    origin: req.headers.get('origin'),
  });

  try {
    const { audio, format = 'webm' } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log(`[${requestId}] Processing audio data...`)
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    
    console.log(`[${requestId}] Audio size: ${binaryAudio.length} bytes`)
    
    // Get OpenRouter API key for Gemini
    const apiKey = Deno.env.get('OPENROUTER_API_KEY_GEMINI_2.0_FLASH_LITE')
    
    if (!apiKey) {
      console.error(`[${requestId}] No API key configured`)
      throw new Error('OpenRouter API key for Gemini not configured')
    }

    console.log(`[${requestId}] Sending to OpenRouter Gemini for transcription...`)

    // Convert audio bytes to base64 for OpenRouter audio input
    const base64Audio = btoa(String.fromCharCode(...binaryAudio))

    // Send to OpenRouter with Gemini Flash Lite using input_audio
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompedia.app',
        'X-Title': 'Prompedia Audio Transcription'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transkripsikan audio berikut ke teks Bahasa Indonesia. Kembalikan hanya teks transkripsinya tanpa penjelasan.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: format
                }
              }
            ]
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[${requestId}] OpenRouter API error:`, {
        status: response.status,
        error: errorText.substring(0, 500)
      })
      throw new Error(`OpenRouter API error: ${errorText}`)
    }

    const result = await response.json()
    const transcribedText = result.choices?.[0]?.message?.content || ''
    
    console.log(`[${requestId}] Transcription successful, text length: ${transcribedText.length}`)

    return new Response(
      JSON.stringify({ 
        text: transcribedText
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error(`[${timestamp}] [${requestId}] Error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Transcription failed',
        requestId 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
