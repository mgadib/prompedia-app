import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupabaseService } from '@/lib/supabase-service';
import { AVAILABLE_MODELS } from '@/lib/models';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface DBModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  icon?: string;
  description?: string;
  free?: boolean;
}

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  const [models, setModels] = useState<DBModel[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Try to fetch from database first
        const dbModels = await SupabaseService.getAIModels();
        if (dbModels && dbModels.length > 0) {
          // Filter to only allow the 2 specified models
          const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
          const filteredModels = dbModels.filter(model => allowedModelIds.includes(model.id));
          setModels(filteredModels.length > 0 ? filteredModels : AVAILABLE_MODELS);
        } else {
          // Fallback to hardcoded data (only 2 models)
          setModels(AVAILABLE_MODELS);
        }
      } catch (error) {
        console.error('Failed to load models from database:', error);
        // Fallback to hardcoded data (only 2 models)
        setModels(AVAILABLE_MODELS);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const selectedModel = models.find(model => model.id === value);

  // Only show the 2 allowed models: Llama 4 Maverick and Qwen 3 30B
  const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
  const mainModels = models.filter(model => allowedModelIds.includes(model.id));

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <SelectValue placeholder="Loading models...">
            Loading...
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border text-xs touch-manipulation`}>
        <SelectValue placeholder="Select model">
          <span className="truncate">{selectedModel?.name || selectedModel?.id || 'Select model'}</span>
        </SelectValue>
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

export default ModelSelector;
