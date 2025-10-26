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
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: `audio/${format}` })
    formData.append('file', blob, `audio.${format}`)
    formData.append('model', 'whisper-1')
    formData.append('language', 'id') // Indonesian language
    formData.append('response_format', 'json')

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!apiKey) {
      console.error(`[${requestId}] No API key configured`)
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[${requestId}] Sending to OpenAI Whisper API...`)
    
    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[${requestId}] OpenAI API error:`, {
        status: response.status,
        error: errorText.substring(0, 500)
      })
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const result = await response.json()
    
    console.log(`[${requestId}] Transcription successful, text length: ${result.text?.length || 0}`)

    return new Response(
      JSON.stringify({ 
        text: result.text,
        duration: result.duration 
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
