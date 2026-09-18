import { AppSettings, HistoryItem } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://opencode.ai/zen/go/v1',
  model: 'deepseek-v4.1-flash',
  floatingBadgeEnabled: true,
  preferredLanguage: 'ko',
  defaultImageEngine: 'midjourney',
};

const SETTINGS_KEY = 'better_prompt_settings';
const HISTORY_KEY = 'better_prompt_history';

function isChromeStorageAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome.storage) &&
    Boolean(chrome.storage.local)
  );
}

export async function getSettings(): Promise<AppSettings> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (result) => {
        const saved = result[SETTINGS_KEY];
        resolve({ ...DEFAULT_SETTINGS, ...(saved || {}) });
      });
    });
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to read from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...settings };

  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [SETTINGS_KEY]: updated }, () => {
        resolve(updated);
      });
    });
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write to localStorage', e);
  }
  return updated;
}

export async function getHistory(): Promise<HistoryItem[]> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([HISTORY_KEY], (result) => {
        resolve(result[HISTORY_KEY] || []);
      });
    });
  }

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read history from localStorage', e);
  }
  return [];
}

export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem[]> {
  const current = await getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
  };

  // Keep last 50 items
  const updated = [newItem, ...current.slice(0, 49)];

  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [HISTORY_KEY]: updated }, () => {
        resolve(updated);
      });
    });
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write history to localStorage', e);
  }
  return updated;
}

export async function toggleFavorite(id: string): Promise<HistoryItem[]> {
  const current = await getHistory();
  const updated = current.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );

  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [HISTORY_KEY]: updated }, () => {
        resolve(updated);
      });
    });
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update favorite', e);
  }
  return updated;
}

export async function clearHistory(): Promise<void> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([HISTORY_KEY], () => {
        resolve();
      });
    });
  }
  localStorage.removeItem(HISTORY_KEY);
}
