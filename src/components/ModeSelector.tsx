import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const modes = [
  {
    value: 'zero-shot',
    label: 'Zero-Shot'
  },
  {
    value: 'one-shot',
    label: 'One-Shot'
  },
  {
    value: 'few-shot',
    label: 'Few-Shot'
  },
  {
    value: 'chain-of-thought',
    label: 'Chain-of-Thought'
  },
  {
    value: 'self-refine',
    label: 'Self-Refine'
  },
  {
    value: 'react',
    label: 'ReAct'
  },
  {
    value: 'role-prompt',
    label: 'Role Prompt'
  },
  {
    value: 'meta-prompt',
    label: 'Meta Prompt'
  }
];

const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  const selectedMode = modes.find(mode => mode.value === value) || modes[0];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select mode">
          <span>{selectedMode.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {modes.map((mode) => (
          <SelectItem key={mode.value} value={mode.value} className="text-xs">
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModeSelector;