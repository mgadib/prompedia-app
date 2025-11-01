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

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Try to fetch from database first
        const dbModels = await SupabaseService.getAIModels();
        if (dbModels && dbModels.length > 0) {
          setModels(dbModels);
        } else {
          // Fallback to hardcoded data
          setModels(AVAILABLE_MODELS);
        }
      } catch (error) {
        console.error('Failed to load models from database:', error);
        // Fallback to hardcoded data
        setModels(AVAILABLE_MODELS);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const selectedModel = models.find(model => model.id === value);

  // Only show main models in UI, not fallback models (filter out by provider if needed)
  const mainModels = models.filter(model =>
    !model.id.includes('qwen/qwen-2.5-72b:free') &&
    !model.id.includes('llama-3.1-70b:free')
  );

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px] bg-secondary border-border text-xs">
          <SelectValue placeholder="Loading models...">
            Loading...
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select model">
          {selectedModel?.name || selectedModel?.id || 'Select model'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {mainModels.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            {model.name || model.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
