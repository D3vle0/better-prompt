import { AppSettings, HistoryItem } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: 'http://localhost:3001',
  floatingBadgeEnabled: true,
  preferredLanguage: 'ko',
  defaultImageEngine: 'midjourney',
  deepThinkingEnabled: false,
};

const SETTINGS_KEY = 'better_prompt_settings';
const HISTORY_KEY = 'better_prompt_history';

function isChromeStorageAvailable(): boolean {
  try {
    return (
      typeof chrome !== 'undefined' &&
      Boolean(chrome.runtime && chrome.runtime.id) &&
      Boolean(chrome.storage && chrome.storage.local)
    );
  } catch {
    return false;
  }
}

function getLocalSettings(): AppSettings {
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

export async function getSettings(): Promise<AppSettings> {
  if (isChromeStorageAvailable()) {
    try {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.get([SETTINGS_KEY], (result) => {
            if (chrome.runtime?.lastError) {
              resolve(getLocalSettings());
              return;
            }
            const saved = result ? result[SETTINGS_KEY] : null;
            resolve({ ...DEFAULT_SETTINGS, ...(saved || {}) });
          });
        } catch {
          resolve(getLocalSettings());
        }
      });
    } catch {
      return getLocalSettings();
    }
  }

  return getLocalSettings();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...settings };

  // Always sync to localStorage as a safety mirror
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write to localStorage', e);
  }

  if (isChromeStorageAvailable()) {
    try {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [SETTINGS_KEY]: updated }, () => {
            resolve(updated);
          });
        } catch {
          resolve(updated);
        }
      });
    } catch {
      return updated;
    }
  }

  return updated;
}

function getLocalHistory(): HistoryItem[] {
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

export async function getHistory(): Promise<HistoryItem[]> {
  if (isChromeStorageAvailable()) {
    try {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.get([HISTORY_KEY], (result) => {
            if (chrome.runtime?.lastError) {
              resolve(getLocalHistory());
              return;
            }
            resolve((result && result[HISTORY_KEY]) || getLocalHistory());
          });
        } catch {
          resolve(getLocalHistory());
        }
      });
    } catch {
      return getLocalHistory();
    }
  }

  return getLocalHistory();
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

  // Always mirror to localStorage
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write history to localStorage', e);
  }

  if (isChromeStorageAvailable()) {
    try {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [HISTORY_KEY]: updated }, () => {
            resolve(updated);
          });
        } catch {
          resolve(updated);
        }
      });
    } catch {
      return updated;
    }
  }

  return updated;
}

export async function toggleFavorite(id: string): Promise<HistoryItem[]> {
  const current = await getHistory();
  const updated = current.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update favorite in localStorage', e);
  }

  if (isChromeStorageAvailable()) {
    try {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [HISTORY_KEY]: updated }, () => {
            resolve(updated);
          });
        } catch {
          resolve(updated);
        }
      });
    } catch {
      return updated;
    }
  }

  return updated;
}

export async function clearHistory(): Promise<void> {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to remove history from localStorage', e);
  }

  if (isChromeStorageAvailable()) {
    try {
      await new Promise<void>((resolve) => {
        try {
          chrome.storage.local.remove([HISTORY_KEY], () => {
            resolve();
          });
        } catch {
          resolve();
        }
      });
    } catch {
      // Ignored
    }
  }
}
