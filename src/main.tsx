import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { polyfill as mobileDndPolyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';
import { DialogProvider } from './context/DialogContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';

// Migrasi localStorage lama (simpanteks:*) → nama baru (tautanlumina:*)
try {
  const migrated = localStorage.getItem('tautanlumina:migrated');
  if (!migrated) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('simpanteks:')) {
        const val = localStorage.getItem(key);
        if (val !== null) localStorage.setItem(key.replace('simpanteks:', 'tautanlumina:'), val);
      }
    }
    // Hapus key lama
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('simpanteks:')) toDelete.push(key);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('tautanlumina:migrated', '1');
  }
} catch {
  /* ignore */
}

mobileDndPolyfill({
  holdToDrag: 300,
  dragImageTranslateOverride: undefined as unknown as never,
});
window.addEventListener('touchmove', () => {}, { passive: false });

// Register Service Worker for PWA Offline Access
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('SW registration failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <DialogProvider>
          <Toaster position="top-center" richColors duration={1500} visibleToasts={1} toastOptions={{ duration: 1500 }} />
          <App />
        </DialogProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
