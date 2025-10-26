import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [${requestId}] Audio Transcribe Request started`);

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log(`[${requestId}] Processing audio data, mimeType: ${mimeType}`);

    // Get API key for Gemini 2.0 Flash Lite
    const apiKey = Deno.env.get('OPENROUTER_API_KEY_GEMINI_2.0_FLASH_LITE');
    
    if (!apiKey) {
      console.error(`[${requestId}] No API key found for Gemini 2.0 Flash Lite`);
      throw new Error('Transcription service not configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[${requestId}] Audio processed, size: ${binaryAudio.length} bytes`);
    
    // Prepare multimodal request for Gemini
    // Gemini 2.0 Flash supports audio transcription via chat completions
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompedia.app',
        'X-Title': 'Prompedia Voice Transcription'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please transcribe this audio file accurately. Provide only the transcription text without any additional commentary or formatting.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audio,
                  format: 'webm'
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] OpenRouter API error:`, {
        status: response.status,
        error: errorText.substring(0, 500)
      });
      throw new Error(`Transcription failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const result = await response.json();
    console.log(`[${requestId}] Transcription successful`);

    const transcription = result.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ 
        text: transcription,
        meta: {
          model: 'google/gemini-2.0-flash-lite-001',
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Transcription error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Transcription failed',
        requestId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
