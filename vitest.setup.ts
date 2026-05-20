import '@testing-library/jest-dom/vitest';

// Minimal browser API shims used by UI components in jsdom.
// Keep these lightweight so RTL tests remain fast and deterministic.

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      // deprecated listeners (some libs still call these)
      addListener: () => {},
      removeListener: () => {},
    }),
  });
}

if (!('ResizeObserver' in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!HTMLElement.prototype.scrollIntoView) {
  // jsdom doesn't implement this; some components use it for focus/centering.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
}

