import { useEffect, useRef } from 'react';

const DRAFT_STORAGE_KEY = 'prompedia_draft';
const DRAFT_DEBOUNCE_MS = 1000; // Auto-save setiap 1 detik setelah user berhenti mengetik

export interface DraftData {
  title: string;
  content: string;
  model?: string;
  mode?: string;
  selectedTags?: string[];
  timestamp: number;
}

/**
 * Hook untuk auto-save draft form ke localStorage
 * Mencegah kehilangan data saat accidental refresh atau navigation
 */
export function useFormPersistence(
  title: string,
  content: string,
  model?: string,
  mode?: string,
  selectedTags?: string[],
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Auto-save draft dengan debounce
  useEffect(() => {
    if (!enabled) {
      // Clear draft jika disabled
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    const currentData = JSON.stringify({ title, content, model, mode, selectedTags });
    
    // Skip jika tidak ada perubahan
    if (currentData === lastSavedRef.current) {
      return;
    }

    // Clear timeout sebelumnya
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout untuk debounced save
    timeoutRef.current = setTimeout(() => {
      const draft: DraftData = {
        title,
        content,
        model,
        mode,
        selectedTags,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        lastSavedRef.current = currentData;
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [title, content, model, mode, selectedTags, enabled]);

  // Load draft saat mount
  const loadDraft = (): DraftData | null => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) return null;
      
      const draft = JSON.parse(stored) as DraftData;
      
      // Hanya load draft yang masih fresh (kurang dari 24 jam)
      const maxAge = 24 * 60 * 60 * 1000; // 24 jam
      if (Date.now() - draft.timestamp > maxAge) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  };

  // Clear draft setelah save berhasil
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    lastSavedRef.current = '';
  };

  return { loadDraft, clearDraft };
}

