export type AnalyticsEventName =
  | 'wallet_connect'
  | 'wallet_disconnect'
  | 'contract_initialize'
  | 'application_submit'
  | 'approval_submit'
  | 'vote_cast'
  | 'vote_quadratic'
  | 'voting_closed'
  | 'feedback_submitted';

export interface AnalyticsEventRecord {
  id: string;
  event: AnalyticsEventName;
  timestamp: string;
  details?: Record<string, unknown>;
}

const STORAGE_KEY = 'scholarship-analytics-events';
const MAX_EVENTS = 50;

const isBrowser = typeof window !== 'undefined';

export const trackEvent = (event: AnalyticsEventName, details?: Record<string, unknown>) => {
  const record: AnalyticsEventRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    timestamp: new Date().toISOString(),
    details,
  };

  console.info(`[analytics] ${event}`, details ?? {});

  if (!isBrowser) return;

  try {
    const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as AnalyticsEventRecord[];
    const next = [record, ...existing].slice(0, MAX_EVENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Unable to persist analytics event', error);
  }
};

export const getAnalyticsEvents = (): AnalyticsEventRecord[] => {
  if (!isBrowser) return [];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as AnalyticsEventRecord[];
  } catch (error) {
    console.warn('Unable to read analytics events', error);
    return [];
  }
};
