/**
 * Konfigurasi API untuk OpenRouter
 * Sumber kebenaran tunggal untuk semua pengaturan API
 */

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  headers: Record<string, string>;
}

export const getOpenRouterConfig = (): APIConfig => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY environment variable is required');
  }

  return {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey,
    timeout: 30000, // 30 detik - batas waktu untuk request API
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Prompedia - Prompt Engineering Lab'
    }
  };
};

/**
 * Membuat request ke API OpenRouter dengan konfigurasi yang aman
 * @param endpoint - Endpoint API (tidak digunakan, hardcoded ke chat/completions)
 * @param modelId - ID model AI yang akan digunakan
 * @param prompt - Prompt yang akan dikirim ke AI
 * @param options - Opsi tambahan untuk request (temperature, max_tokens, top_p)
 * @returns Response dari API OpenRouter
 * @throws Error jika request gagal atau timeout
 */
export const makeAPIRequest = async (
  endpoint: string, 
  modelId: string, 
  prompt: string,
  options: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  } = {}
) => {
  const config = getOpenRouterConfig();
  
  const requestBody = {
    model: modelId,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 8192,
    top_p: options.top_p || 1.0
  };

  try {
    // Menggunakan AbortController untuk menghentikan request jika timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Menangani timeout secara khusus dengan pesan yang jelas
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Permintaan API memakan waktu terlalu lama');
      }
      throw error;
    }
    throw new Error('Terjadi kesalahan tidak diketahui saat melakukan request API');
  }
};
