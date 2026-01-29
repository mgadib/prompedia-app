/**
 * Analytics Script Injector
 *
 * Injects analytics script (e.g. Umami) when config.analytics.scriptUrl and
 * config.analytics.websiteId are set. Config comes from env for per-environment setup.
 */

import { useEffect } from 'react';
import { config } from '@/lib/config';

export function Analytics(): null {
  useEffect(() => {
    const scriptUrl = config.analytics.scriptUrl?.trim();
    const websiteId = config.analytics.websiteId?.trim();
    if (!scriptUrl || !websiteId) return;

    const existing = document.querySelector(`script[data-website-id="${websiteId}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-website-id', websiteId);
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
