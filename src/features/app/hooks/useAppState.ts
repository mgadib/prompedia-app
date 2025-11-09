import { useState, useRef } from 'react';
import { Prompt } from '@/lib/storage';

interface UseAppStateReturn {
  activeView: 'my-library' | 'public-library';
  setActiveView: (view: 'my-library' | 'public-library') => void;
  currentPrompt: Prompt | null;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  showEditor: boolean;
  setShowEditor: (show: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
  prevAppIsPlaygroundActiveRef: React.MutableRefObject<boolean | null>;
}

export function useAppState(): UseAppStateReturn {
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('public-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevAppIsPlaygroundActiveRef = useRef<boolean | null>(null);

  return {
    activeView,
    setActiveView,
    currentPrompt,
    setCurrentPrompt,
    showEditor,
    setShowEditor,
    isFocusMode,
    setIsFocusMode,
    isTransitioning,
    setIsTransitioning,
    prevAppIsPlaygroundActiveRef,
  };
}

