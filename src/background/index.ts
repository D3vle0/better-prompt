import { callBackendAnalyze, testBackendConnection } from '../services/aiService';

// Extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('BetterPrompt Extension Installed successfully!');
});

// Message router between Content Scripts and BetterPrompt Backend API
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_PROMPT') {
    const { promptText, settings } = message.payload;
    callBackendAnalyze(promptText, settings)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error('Background AI call error:', err);
        sendResponse({ success: false, error: err.message || '백엔드 호출 실패' });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'TEST_CONNECTION') {
    const { backendUrl } = message.payload;
    testBackendConnection(backendUrl)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
