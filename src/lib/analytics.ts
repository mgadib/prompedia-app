import { logger } from '@/lib/logger';

export type AnalyticsEventName =
  | 'view_public_library'
  | 'open_prompt_modal'
  | 'view_prompt_detail'
  | 'copy_prompt_content'
  | 'copy_prompt_url'
  | 'use_prompt';

export interface AnalyticsEvent {
  name: AnalyticsEventName | string;
  request_id: string;
  timestamp: string;
  user_id?: string | null;
  payload?: Record<string, any>;
}

const generateRequestId = () => {
  // Generator UUID v4 sederhana tanpa dependency eksternal
  // Tidak cryptographically secure; dapat diterima untuk korelasi telemetri
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const trackEvent = (name: AnalyticsEventName | string, payload?: Record<string, any>, userId?: string | null) => {
  const evt: AnalyticsEvent = {
    name,
    request_id: generateRequestId(),
    timestamp: new Date().toISOString(),
    user_id: userId ?? null,
    payload: payload ?? {},
  };

  // Log JSON terstruktur; bisa dikirim ke external collector nanti
  logger.info('ANALYTICS', `Event: ${name}`, evt as unknown as Record<string, unknown>);
};