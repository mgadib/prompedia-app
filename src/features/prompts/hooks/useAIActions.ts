import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/utils/toast';
import { generateModeAwareActionInstructions } from '@/features/prompts/utils/actions';
import { supabase } from '@/integrations/supabase/client';
import { rateLimitingService } from '@/shared/utils/rate-limiting';

type ViewState = 'original' | 'ai-result';

interface UseAIActionsParams {
  content: string;
  mode: string;
  model: string;
  viewState: ViewState;
  setContent: (content: string) => void;
  setOriginalContent: (content: string) => void;
  setAiResultContent: (content: string) => void;
  setViewState: (viewState: ViewState) => void;
}

interface UseAIActionsReturn {
  isActionLoading: boolean;
  loadingAction: string;
  userCanUseAI: boolean;
  handleAction: (actionId: string) => Promise<void>;
}

export function useAIActions({
  content,
  mode,
  model,
  viewState,
  setContent,
  setOriginalContent,
  setAiResultContent,
  setViewState,
}: UseAIActionsParams): UseAIActionsReturn {
  const { t } = useTranslation();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [userCanUseAI, setUserCanUseAI] = useState(true);

  // Mengecek batas penggunaan secara berkala untuk update UI real-time
  useEffect(() => {
    const checkRateLimits = async () => {
      try {
        const user = await supabase.auth.getUser().then(({ data }) => data.user);
        const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
        setUserCanUseAI(rateLimitCheck.allowed);
      } catch (error) {
        console.error('Failed to check rate limits:', error);
        setUserCanUseAI(false);
      }
    };

    checkRateLimits();

    // Mengecek setiap 30 detik untuk update real-time
    const interval = setInterval(checkRateLimits, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (actionId: string) => {
    if (!content.trim()) {
      toast.error('actions.enterContent');
      return;
    }

    try {
      setIsActionLoading(true);
      setLoadingAction(actionId);

      // Mengecek batas penggunaan sebelum melakukan panggilan AI
      const user = await supabase.auth.getUser().then(({ data }) => data.user);
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? t('errors:usage.dailyLimit') : t('errors:usage.guestLimit');
        toast.error('usage.limitReached', { 
          type: limitType, 
          error: rateLimitCheck.error || '' 
        });
        return;
      }

      // Menampilkan peringatan penggunaan tersisa ketika mendekati batas
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          toast.warning('warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining });
        } else {
          toast.warning('warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining });
        }
      }

      // Menghasilkan instruksi spesifik action DENGAN MODE
      const actionInstructions = generateModeAwareActionInstructions(
        actionId,
        mode,  // Meneruskan mode yang dipilih saat ini
        content
      );

      // Memanggil edge function dengan parameter mode
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: {
          model: model,
          prompt: actionInstructions,
          mode: mode,  // Menambahkan mode ke request
          options: {
            temperature: 0.7,
            max_tokens: 8192
          }
        }
      });

      // Penanganan error yang ditingkatkan
      if (error) {
        console.error('Edge function error:', error);
        
        // Mencoba mengekstrak pesan error yang lebih bermakna
        let errorMessage = t('errors:actions.failedToProcess');
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.context) {
          console.error('Error context:', error.context);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!data) {
        throw new Error(t('errors:actions.noResponse'));
      }

      // Mengecek error API dalam response
      if (data.error) {
        console.error('API error response:', data);
        throw new Error(data.error);
      }
      
      const processedContent = data?.choices?.[0]?.message?.content || data?.response || '';
      if (!processedContent) {
        console.error('No content in response:', data);
        throw new Error(t('errors:actions.noContentResponse'));
      }
      
      // Lebih memilih konten refined yang diekstrak ketika tersedia
      let nextContent = processedContent;
      const refinedMatch = processedContent.match(/##\s*Hasil\s*Refined\s*([\s\S]*?)(?:\n##|$)/i);
      if (refinedMatch) {
        nextContent = refinedMatch[1].trim();
      }
      
      // Menyimpan konten original dan menampilkan hasil AI
      if (viewState === 'original') {
        setOriginalContent(content);
      }
      setAiResultContent(nextContent);
      setContent(nextContent);
      setViewState('ai-result');
      
      toast.success('actions.actionSuccess', { 
        count: 1,
        defaultValue: 'Action completed successfully'
      });

      // Menambah counter penggunaan setelah response AI berhasil
      await rateLimitingService.incrementUsage(user);

    } catch (error) {
      console.error(`Error processing ${actionId}:`, error);
      
      // Pesan error yang lebih detail
      let errorMsg = t('errors:actions.actionFailed', { action: actionId });
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Menampilkan tipe error spesifik
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          errorMsg = t('errors:actions.serviceLimitReached');
        } else if (errorMsg.includes('API key') || errorMsg.includes('401')) {
          errorMsg = t('errors:actions.apiAuthFailed');
        } else if (errorMsg.includes('timeout')) {
          errorMsg = t('errors:actions.requestTimeout');
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setLoadingAction('');
    }
  };

  return {
    isActionLoading,
    loadingAction,
    userCanUseAI,
    handleAction,
  };
}

