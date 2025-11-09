import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { modeService } from '@/features/prompts/services/mode-service';
import { THINKING_MODES } from '@/features/prompts/utils/modes';
import { useIsMobile } from '@/shared/hooks/use-mobile';

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
  const { t } = useTranslation();
  const [modes, setModes] = useState<DBMode[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadModes = async () => {
      try {
        // Mencoba mengambil dari database terlebih dahulu
        const dbModes = await modeService.getThinkingModes();
        if (dbModes && dbModes.length > 0) {
          setModes(dbModes);
        } else {
          // Fallback ke data hardcoded
          setModes(THINKING_MODES);
        }
      } catch (error) {
        console.error('Failed to load modes from database:', error);
        // Fallback ke data hardcoded
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
        <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <SelectValue placeholder={t('common:placeholders.loadingModes')}>
            {t('common:status.loading')}
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${isMobile ? 'w-full h-9 text-xs' : 'w-[180px]'} bg-secondary border-border text-xs touch-manipulation`}>
        <SelectValue placeholder={t('common:placeholders.selectMode')}>
          <span className="truncate">{selectedMode?.name || selectedMode?.id}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {modes.map((mode) => (
          <SelectItem key={mode.id} value={mode.id} className={`${isMobile ? 'text-xs py-2' : 'text-xs'}`}>
            {mode.name || mode.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(ModeSelector);