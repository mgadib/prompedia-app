import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { AVAILABLE_MODELS } from '@/features/prompts/utils/models';
import { THINKING_MODES } from '@/features/prompts/utils/modes';
import { sanitizePrompt } from '@/features/prompts/utils/prompt-utils';

type ViewState = 'original' | 'ai-result';

interface UsePromptEditorReturn {
  title: string;
  content: string;
  originalContent: string;
  aiResultContent: string;
  viewState: ViewState;
  model: string;
  mode: string;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setModel: (model: string) => void;
  setMode: (mode: string) => void;
  setOriginalContent: (content: string) => void;
  setAiResultContent: (content: string) => void;
  setViewState: (viewState: ViewState) => void;
  handleContentChange: (newContent: string, currentViewState: ViewState) => void;
  handleBack: () => void;
  handleForward: () => void;
}

export function usePromptEditor(currentPrompt: Prompt | null): UsePromptEditorReturn {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [aiResultContent, setAiResultContent] = useState('');
  const [viewState, setViewState] = useState<ViewState>('original');
  const [model, setModel] = useState(AVAILABLE_MODELS[1].id);
  const [mode, setMode] = useState(THINKING_MODES[5].id);

  useEffect(() => {
    if (currentPrompt) {
      // Menyucikan currentPrompt agar sesuai dengan schema baru
      const sanitizedPrompt = sanitizePrompt(currentPrompt);
      
      // Handle both old and new schema formats
      const modelValue = sanitizedPrompt.model_id || sanitizedPrompt.model || AVAILABLE_MODELS[1].id;
      const modeValue = sanitizedPrompt.mode_id || sanitizedPrompt.mode || mode || 'normal';

      setTitle(sanitizedPrompt.title);
      setContent(sanitizedPrompt.content);
      setModel(modelValue);
      setMode(modeValue as 'meta-prompt' | 'thinking' | 'normal');

      // Reset state hasil AI saat memuat prompt baru
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    } else {
      // Reset form ketika tidak ada prompt yang dipilih
      setTitle('');
      setContent('');
      setModel(AVAILABLE_MODELS[1].id);
      setMode(THINKING_MODES[5].id);

      // Reset state hasil AI
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    }
  }, [currentPrompt, mode]);

  // Menangani kembali ke prompt original
  const handleBack = useCallback(() => {
    if (originalContent && viewState === 'ai-result') {
      setContent(originalContent);
      setViewState('original');
    }
  }, [originalContent, viewState]);

  // Menangani maju ke hasil AI
  const handleForward = useCallback(() => {
    if (aiResultContent && viewState === 'original') {
      setContent(aiResultContent);
      setViewState('ai-result');
    }
  }, [aiResultContent, viewState]);

  const handleContentChange = useCallback((newContent: string, currentViewState: ViewState) => {
    setContent(newContent);
    // Memperbarui state yang sesuai berdasarkan view saat ini
    if (currentViewState === 'original') {
      setOriginalContent(newContent);
    } else if (currentViewState === 'ai-result') {
      setAiResultContent(newContent);
    }
  }, []);

  return {
    title,
    content,
    originalContent,
    aiResultContent,
    viewState,
    model,
    mode,
    setTitle,
    setContent,
    setModel,
    setMode,
    setOriginalContent,
    setAiResultContent,
    setViewState,
    handleContentChange,
    handleBack,
    handleForward,
  };
}

