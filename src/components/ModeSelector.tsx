import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupabaseService } from '@/lib/supabase-service';
import { THINKING_MODES } from '@/lib/modes';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface DBMode {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  instructions?: string;
  purpose?: string;
  thinking_pattern?: string;
  output_structure?: string[];
}

const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  const [modes, setModes] = useState<DBMode[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadModes = async () => {
      try {
        // Try to fetch from database first
        const dbModes = await SupabaseService.getThinkingModes();
        if (dbModes && dbModes.length > 0) {
          setModes(dbModes);
        } else {
          // Fallback to hardcoded data
          setModes(THINKING_MODES);
        }
      } catch (error) {
        console.error('Failed to load modes from database:', error);
        // Fallback to hardcoded data
        setModes(THINKING_MODES);
      } finally {
        setLoading(false);
      }
    };

    loadModes();
  }, []);

  const selectedMode = modes.find(mode => mode.id === value) || modes[5];

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`${isMobile ? 'w-full min-h-[44px]' : 'w-[180px]'} bg-secondary border-border ${isMobile ? 'text-sm' : 'text-xs'}`}>
          <SelectValue placeholder="Loading modes...">
            Loading...
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${isMobile ? 'w-full min-h-[44px]' : 'w-[180px]'} bg-secondary border-border ${isMobile ? 'text-sm' : 'text-xs'} touch-manipulation`}>
        <SelectValue placeholder="Select mode">
          <span>{selectedMode?.name || selectedMode?.id}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {modes.map((mode) => (
          <SelectItem key={mode.id} value={mode.id} className={`${isMobile ? 'text-sm min-h-[44px]' : 'text-xs'}`}>
            {mode.name || mode.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModeSelector;