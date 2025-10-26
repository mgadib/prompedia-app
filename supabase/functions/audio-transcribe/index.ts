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

    // Get OpenAI API key for Whisper
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error(`[${requestId}] No OpenAI API key found`);
      throw new Error('Transcription service not configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[${requestId}] Audio processed, size: ${binaryAudio.length} bytes`);
    
    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: mimeType });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'id'); // Indonesian language
    formData.append('response_format', 'text');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] OpenAI Whisper API error:`, {
        status: response.status,
        error: errorText.substring(0, 500)
      });
      throw new Error(`Transcription failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const transcription = await response.text();
    console.log(`[${requestId}] Transcription successful, length: ${transcription.length} chars`);

    return new Response(
      JSON.stringify({ 
        text: transcription,
        meta: {
          model: 'whisper-1',
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
