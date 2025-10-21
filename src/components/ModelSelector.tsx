import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AVAILABLE_MODELS } from '@/lib/models';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  const selectedModel = AVAILABLE_MODELS.find(model => model.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select model">
          {selectedModel?.label || 'Select model'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
