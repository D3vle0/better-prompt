import { callDeepSeekDirect, testApiConnection } from '../services/aiService';

// Extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('BetterPrompt Extension Installed successfully!');
});

// Message router between Content Scripts and OpenCode Go API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_PROMPT') {
    const { promptText, settings } = message.payload;
    callDeepSeekDirect(promptText, settings)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error('Background AI call error:', err);
        sendResponse({ success: false, error: err.message || 'API 호출 실패' });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'TEST_CONNECTION') {
    const { apiKey, baseUrl, model } = message.payload;
    testApiConnection(apiKey, baseUrl, model)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
