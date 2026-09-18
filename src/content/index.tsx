import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingWidget } from './FloatingWidget';
import cssContent from '../index.css?inline';
import { getSettings, isSiteAllowed } from '@/services/storage';

let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;

let activeTarget: HTMLElement | null = null;
let currentRect: DOMRect | null = null;
let isCurrentSiteEnabled = false;

// Check if current site is allowed (chatgpt.com, gemini.google.com, or user-approved site)
async function checkSitePermission() {
  try {
    const settings = await getSettings();
    const host = window.location.hostname;
    isCurrentSiteEnabled = isSiteAllowed(host, settings.allowedSites);
  } catch (e) {
    console.warn('Failed to check site permission', e);
  }
}
checkSitePermission();

// Real-time synchronization when allowed sites are updated in Popup or Settings
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.better_prompt_settings) {
      const newSettings = changes.better_prompt_settings.newValue;
      if (newSettings) {
        const wasEnabled = isCurrentSiteEnabled;
        isCurrentSiteEnabled = isSiteAllowed(window.location.hostname, newSettings.allowedSites);
        if (!isCurrentSiteEnabled && wasEnabled) {
          activeTarget = null;
          if (reactRoot) reactRoot.render(null);
        }
      }
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'BETTER_PROMPT_SITE_ALLOWED') {
      isCurrentSiteEnabled = true;
      sendResponse({ ok: true });
    }
  });
}

function initShadowContainer() {
  if (hostElement) return;

  hostElement = document.createElement('div');
  hostElement.id = 'better-prompt-host-container';
  hostElement.style.cssText =
    'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  document.body.appendChild(hostElement);

  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Inject CSS inside Shadow DOM with :host support
  const styleEl = document.createElement('style');
  styleEl.textContent = cssContent;
  shadowRoot.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'better-prompt-shadow-mount';
  mountPoint.className = 'dark';
  shadowRoot.appendChild(mountPoint);

  reactRoot = ReactDOM.createRoot(mountPoint);
}

/**
 * Checks if target element is a prompt input area,
 * with special explicit rules for chatgpt.com (#prompt-textarea)
 * and gemini.google.com (rich-textarea / Quill editor).
 */
function isPromptInputElement(el: EventTarget | null): HTMLElement | null {
  if (!el || !(el instanceof HTMLElement)) return null;
  if (el.closest('#better-prompt-host-container')) return null;

  // 1. ChatGPT Rule: #prompt-textarea
  const chatGptTarget =
    el.id === 'prompt-textarea'
      ? el
      : el.closest<HTMLElement>('#prompt-textarea');
  if (chatGptTarget) {
    return chatGptTarget;
  }

  // 2. Google Gemini Rule: User exact selector or rich-textarea quill editor
  // Exact selector provided by user:
  const geminiExactSelector =
    '#xap-skip-link-target > div > chat-window > div > input-container > fieldset > input-area-v2 > div > div > div.ng-tns-c1049024361-4.single-line-format.ng-star-inserted > div > div > div > rich-textarea > div.ql-editor.ql-blank.textarea.new-input-ui';
  
  if (el.matches && el.matches(geminiExactSelector)) {
    return el;
  }

  // Gemini generalized rich-textarea rule (covers Angular variations, dynamic ng-tns classes, and non-blank state)
  const geminiTarget = el.closest<HTMLElement>(
    'rich-textarea div.ql-editor, rich-textarea .ql-editor, rich-textarea [contenteditable="true"], input-area-v2 rich-textarea'
  );
  if (geminiTarget) {
    // If user clicked inside rich-textarea, return the contenteditable editor div
    const editorDiv = geminiTarget.querySelector<HTMLElement>('div.ql-editor, [contenteditable="true"]') || geminiTarget;
    return editorDiv;
  }

  // 3. General textarea / contenteditable fallback for other web apps
  if (el instanceof HTMLTextAreaElement) return el;
  if (el instanceof HTMLInputElement && el.type === 'text') return el;
  if (el.isContentEditable) return el;

  return null;
}

function getElementText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  if (el.isContentEditable) {
    return el.innerText || el.textContent || '';
  }
  return '';
}

function setElementText(el: HTMLElement, text: string) {
  el.focus();

  // 1. If standard input / textarea
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  // 2. If contenteditable (ChatGPT, Gemini Quill editor, etc.)
  if (el.isContentEditable) {
    // Attempt execCommand for natural undo stack and rich text frameworks (Quill, Lexical, ProseMirror)
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      const success = document.execCommand('insertText', false, text);
      if (success) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    } catch (e) {
      console.warn('execCommand insertText failed, falling back to innerHTML/innerText', e);
    }

    // Fallback: Gemini Quill editor uses <p> tags
    if (el.classList.contains('ql-editor') || el.closest('rich-textarea')) {
      const paragraphs = text
        .split('\n')
        .map((line) => `<p>${line || '<br>'}</p>`)
        .join('');
      el.innerHTML = paragraphs;
    } else {
      el.innerText = text;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function renderWidget() {
  if (!reactRoot || !activeTarget || !currentRect) {
    if (reactRoot) {
      reactRoot.render(null);
    }
    return;
  }

  const text = getElementText(activeTarget);

  reactRoot.render(
    <FloatingWidget
      targetElement={activeTarget}
      targetRect={currentRect}
      initialText={text}
      onApplyText={(newText) => {
        if (activeTarget) {
          setElementText(activeTarget, newText);
        }
      }}
      onClose={() => {
        activeTarget = null;
        renderWidget();
      }}
    />
  );
}

function handleInteraction(e: Event) {
  if (!isCurrentSiteEnabled) return;
  const matched = isPromptInputElement(e.target);
  if (matched) {
    activeTarget = matched;
    currentRect = matched.getBoundingClientRect();
    initShadowContainer();
    renderWidget();
  }
}

function handleScrollOrResize() {
  if (activeTarget) {
    currentRect = activeTarget.getBoundingClientRect();
    renderWidget();
  }
}

// Global event listeners for real-time input activation
document.addEventListener('focusin', handleInteraction, true);
document.addEventListener('click', handleInteraction, true);
document.addEventListener('input', handleInteraction, true);
document.addEventListener('keyup', handleInteraction, true);
window.addEventListener('scroll', handleScrollOrResize, true);
window.addEventListener('resize', handleScrollOrResize);

// Periodic check for active element in single-page apps (ChatGPT / Gemini)
setInterval(() => {
  if (!isCurrentSiteEnabled) return;
  if (document.activeElement && document.activeElement !== activeTarget) {
    const matched = isPromptInputElement(document.activeElement);
    if (matched) {
      activeTarget = matched;
      currentRect = matched.getBoundingClientRect();
      initShadowContainer();
      renderWidget();
    }
  }
}, 800);

console.log('BetterPrompt Content Script loaded with ChatGPT & Gemini input hooks.');
