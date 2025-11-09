import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { modelService } from '@/features/prompts/services/model-service';
import { AVAILABLE_MODELS } from '@/features/prompts/utils/models';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface DBModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  icon?: string | null;
  description?: string | null;
  free?: boolean | null;
  is_active?: boolean | null;
}

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  const { t } = useTranslation();
  const [models, setModels] = useState<DBModel[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Mencoba mengambil dari database terlebih dahulu
        const dbModels = await modelService.getAIModels();
        if (dbModels && dbModels.length > 0) {
          // Filter untuk hanya mengizinkan 2 model yang ditentukan
          const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
          const filteredModels = dbModels.filter(model => allowedModelIds.includes(model.id));
          setModels(
            filteredModels.length > 0
              ? (filteredModels as unknown as DBModel[])
              : AVAILABLE_MODELS.map(m => ({
                  id: m.id,
                  name: m.name,
                  provider: m.provider,
                  type: m.type,
                  icon: null,
                  description: null,
                  free: m.free ?? null,
                  is_active: null,
                }))
          );
        } else {
          // Fallback ke data hardcoded (hanya 2 model)
          setModels(AVAILABLE_MODELS);
        }
      } catch (error) {
        console.error('Failed to load models from database:', error);
        // Fallback ke data hardcoded (hanya 2 model)
        setModels(AVAILABLE_MODELS);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  

  // Hanya menampilkan 2 model yang diizinkan: Llama 4 Maverick dan Qwen 3 30B
  const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
  const mainModels = models.filter(model => allowedModelIds.includes(model.id));

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <SelectValue placeholder={t('common:placeholders.loadingModels')}>
            {t('common:status.loading')}
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border text-xs touch-manipulation`}>
        <SelectValue placeholder={t('common:placeholders.selectModel')} />
      </SelectTrigger>
      <SelectContent>
        {mainModels.map((model) => (
          <SelectItem key={model.id} value={model.id} className={`${isMobile ? 'text-xs py-2' : 'text-xs'}`}>
            {model.name || model.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(ModelSelector);
