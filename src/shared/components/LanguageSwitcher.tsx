import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useIsMobile } from '@/shared/hooks/use-mobile';

const LanguageSwitcher = ({ isCollapsed = false }: { isCollapsed?: boolean }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const isMobile = useIsMobile();

  const languages = [
    { code: 'en', label: t('common:languages.en'), flag: '🇺🇸' },
    { code: 'id', label: t('common:languages.id'), flag: '🇮🇩' },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center ${isCollapsed || isMobile ? 'w-9 h-9 justify-center px-0' : 'w-full justify-start gap-3 px-3 py-3'} ${isMobile ? 'min-h-[44px]' : ''} rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground font-mono group touch-manipulation`}
          title={isCollapsed || isMobile ? t('common:changeLanguage') : ''}
        >
          <Languages className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!isCollapsed && !isMobile && (
            <span className="flex items-center gap-2">
              <span>{currentLang.flag}</span>
              <span>{currentLang.label}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center gap-2 cursor-pointer ${currentLanguage === lang.code ? 'bg-accent' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
            {currentLanguage === lang.code && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

