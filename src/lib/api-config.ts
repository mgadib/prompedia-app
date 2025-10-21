/**
 * API Configuration for OpenRouter
 * Single source of truth for all API settings
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
    timeout: 30000, // 30 seconds
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Prompedia AI'
    }
  };
};

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
    max_tokens: options.max_tokens || 2048,
    top_p: options.top_p || 1.0
  };

  try {
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
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The API request took too long to complete');
      }
      throw error;
    }
    throw new Error('Unknown error occurred during API request');
  }
};
