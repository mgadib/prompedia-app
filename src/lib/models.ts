export interface ModelCapabilities {
  text: boolean;
  image?: boolean;
  vision?: boolean;
  code?: boolean;
  math?: boolean;
  longContext?: boolean;
  conversational?: boolean;
  reasoning?: boolean;
  bilingual?: boolean;
}

export interface AIModel {
  id: string;
  label: string;
  name: string; // Add name for DB compatibility
  provider: string;
  type: 'Text' | 'Multimodal';
  capabilities: ModelCapabilities;
  free?: boolean;
}

// Only 2 models are available for users
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'meta-llama/llama-4-maverick:free',
    label: 'Llama 4 Maverick',
    name: 'Llama 4 Maverick', // Add name for DB compatibility
    provider: 'OpenRouter',
    type: 'Multimodal',
    capabilities: {
      text: true,
      image: true,
      vision: true,
      bilingual: true,
      conversational: true,
      reasoning: true
    },
    free: true
  },
  {
    id: 'qwen/qwen3-30b-a3b:free',
    label: 'Qwen 3 30B',
    name: 'Qwen 3 30B', // Add name for DB compatibility
    provider: 'OpenRouter',
    type: 'Text',
    capabilities: {
      text: true,
      code: true,
      math: true,
      longContext: true,
      reasoning: true
    },
    free: true
  }
];

// Helper to get only allowed models for user selection
export const getAllowedModels = (): AIModel[] => {
  return AVAILABLE_MODELS.filter(model => 
    model.id === 'meta-llama/llama-4-maverick:free' || 
    model.id === 'qwen/qwen3-30b-a3b:free'
  );
};

export const getModelById = (id: string): AIModel | undefined => {
  return AVAILABLE_MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
};

export const getCapabilitiesText = (capabilities: ModelCapabilities): string => {
  const caps: string[] = [];
  if (capabilities.text) caps.push('Text');
  if (capabilities.image) caps.push('Image');
  if (capabilities.vision) caps.push('Vision');
  if (capabilities.code) caps.push('Code');
  if (capabilities.math) caps.push('Math');
  if (capabilities.longContext) caps.push('Long Context');
  if (capabilities.conversational) caps.push('Conversational');
  if (capabilities.reasoning) caps.push('Reasoning');
  if (capabilities.bilingual) caps.push('Bilingual');
  
  return caps.join(', ');
};
