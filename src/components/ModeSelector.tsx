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
    label: 'Zero-Shot',
    description: 'Prompt langsung tanpa contoh',
    icon: '🔘'
  },
  {
    value: 'one-shot',
    label: 'One-Shot',
    description: 'Satu contoh tugas & hasil',
    icon: '⚪'
  },
  {
    value: 'few-shot',
    label: 'Few-Shot',
    description: 'Beberapa contoh',
    icon: '⚪'
  },
  {
    value: 'chain-of-thought',
    label: 'Chain-of-Thought',
    description: 'Minta model jelaskan langkah berpikir',
    icon: '⚪'
  },
  {
    value: 'self-refine',
    label: 'Self-Refine',
    description: 'Model memperbaiki jawabannya sendiri',
    icon: '⚪'
  },
  {
    value: 'react',
    label: 'ReAct',
    description: 'Reason + Action mode',
    icon: '⚪'
  },
  {
    value: 'role-prompt',
    label: 'Role Prompt',
    description: 'Tetapkan peran model',
    icon: '⚪'
  },
  {
    value: 'meta-prompt',
    label: 'Meta Prompt',
    description: 'Prompt untuk membuat prompt lain',
    icon: '⚪'
  }
];

const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  const selectedMode = modes.find(mode => mode.value === value) || modes[0];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-secondary border-border text-xs">
        <SelectValue placeholder="Select mode">
          <div className="flex items-center gap-2">
            <span>{selectedMode.icon}</span>
            <span>{selectedMode.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-2">
            Mode Prompt
          </div>
          {modes.map((mode) => (
            <SelectItem key={mode.value} value={mode.value} className="text-xs py-2">
              <div className="flex items-start gap-3 w-full">
                <span className="text-sm">{mode.value === value ? '🔘' : '⚪'}</span>
                <div className="flex-1">
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {mode.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};

export default ModeSelector;