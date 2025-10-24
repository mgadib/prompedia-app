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
  provider: string;
  type: 'Text' | 'Multimodal';
  capabilities: ModelCapabilities;
  free?: boolean;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'meta-llama/llama-4-maverick:free',
    label: 'Llama 4 Maverick',
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
  },
  // Fallback models (not shown in UI but available for API fallbacks)
  {
    id: 'qwen/qwen-2.5-72b:free',
    label: 'Qwen 2.5 72B',
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
  },
  {
    id: 'meta-llama/llama-3.1-70b:free',
    label: 'Llama 3.1 70B',
    provider: 'OpenRouter',
    type: 'Text',
    capabilities: {
      text: true,
      conversational: true,
      reasoning: true,
      code: true,
      math: true,
      longContext: true
    },
    free: true
  }
];

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
