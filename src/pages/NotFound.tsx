import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="mb-4 text-6xl sm:text-8xl font-bold font-mono text-primary">{t('common:notFound.title')}</h1>
        <p className="mb-6 text-xl sm:text-2xl text-foreground font-mono">{t('common:notFound.heading')}</p>
        <p className="mb-8 text-sm sm:text-base text-muted-foreground font-mono">
          {t('common:notFound.description')}
        </p>
        <Button asChild size="lg" className="font-mono touch-manipulation">
          <a href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t('common:notFound.returnHome')}
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
