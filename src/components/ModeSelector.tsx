import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { THINKING_MODES } from '@/lib/modes';

interface ModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  const selectedMode = THINKING_MODES.find(mode => mode.id === value) || THINKING_MODES[5];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select mode">
          <span>{selectedMode.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {THINKING_MODES.map((mode) => (
          <SelectItem key={mode.id} value={mode.id} className="text-xs">
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModeSelector;