import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingWidget } from './FloatingWidget';
import cssContent from '../index.css?inline';

let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;

let activeTarget: HTMLElement | null = null;
let currentRect: DOMRect | null = null;

function initShadowContainer() {
  if (hostElement) return;

  hostElement = document.createElement('div');
  hostElement.id = 'better-prompt-host-container';
  hostElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  document.body.appendChild(hostElement);

  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Inject CSS inside Shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = cssContent;
  shadowRoot.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'better-prompt-shadow-mount';
  mountPoint.className = 'dark';
  shadowRoot.appendChild(mountPoint);

  reactRoot = ReactDOM.createRoot(mountPoint);
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
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.focus();
    return;
  }

  if (el.isContentEditable) {
    el.focus();
    el.innerText = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function isPromptInputElement(el: EventTarget | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('#better-prompt-host-container')) return false;

  const tagName = el.tagName.toLowerCase();
  if (tagName === 'textarea') return true;
  if (tagName === 'input' && (el as HTMLInputElement).type === 'text') return true;
  if (el.isContentEditable) return true;

  return false;
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

function handleFocusOrInput(e: Event) {
  if (isPromptInputElement(e.target)) {
    activeTarget = e.target;
    currentRect = activeTarget.getBoundingClientRect();
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

// Global event listeners
document.addEventListener('focusin', handleFocusOrInput, true);
document.addEventListener('input', handleFocusOrInput, true);
window.addEventListener('scroll', handleScrollOrResize, true);
window.addEventListener('resize', handleScrollOrResize);

console.log('BetterPrompt Content Script loaded and watching for prompt inputs.');
