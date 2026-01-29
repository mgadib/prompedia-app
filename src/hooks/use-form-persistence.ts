import { useEffect, useRef } from 'react';
import { logError } from '@/lib/logger';

const DRAFT_KEY = 'prompedia-draft';

interface DraftState {
    title: string;
    content: string;
    tagsInput: string;
    isPublic: boolean;
}

/**
 * Hook to persist form state to localStorage
 * Automatically saves on change and restores on mount
 */
export function useFormPersistence(
    title: string,
    content: string,
    tagsInput: string,
    isPublic: boolean,
    onRestore: (state: DraftState) => void,
    enabled: boolean = true
) {
    const isRestoredRef = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Restore draft on mount
    useEffect(() => {
        if (!enabled || isRestoredRef.current) return;

        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const draft: DraftState = JSON.parse(saved);
                // Only restore if there's actual content
                if (draft.content || draft.title) {
                    onRestore(draft);
                    isRestoredRef.current = true;
                }
            }
        } catch (error) {
            logError(error instanceof Error ? error : new Error(String(error)), {
                context: 'formPersistence.restore',
            });
        }
    }, [enabled, onRestore]);

    // Save draft on change (debounced)
    useEffect(() => {
        if (!enabled) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Only save if there's content
        if (content.trim() || title.trim()) {
            saveTimeoutRef.current = setTimeout(() => {
                try {
                    const draft: DraftState = {
                        title,
                        content,
                        tagsInput,
                        isPublic,
                    };
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                } catch (error) {
                    logError(error instanceof Error ? error : new Error(String(error)), {
                        context: 'formPersistence.save',
                    });
                }
            }, 1000); // Debounce 1 second
        } else {
            // Clear draft if form is empty
            try {
                localStorage.removeItem(DRAFT_KEY);
            } catch (error) {
                logError(error instanceof Error ? error : new Error(String(error)), {
                    context: 'formPersistence.clear',
                });
            }
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [title, content, tagsInput, isPublic, enabled]);

    // Clear draft function
    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
            isRestoredRef.current = false;
        } catch (error) {
            logError(error instanceof Error ? error : new Error(String(error)), {
                context: 'formPersistence.clearDraft',
            });
        }
    };

    return { clearDraft };
}
