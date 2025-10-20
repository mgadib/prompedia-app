import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const models = [
  'GPT-4',
  'GPT-3.5',
  'Claude 3.5 Sonnet',
  'Claude 3 Opus',
  'Gemini Pro',
  'Mistral Large',
  'Llama 3',
];

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model} className="text-xs">
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
