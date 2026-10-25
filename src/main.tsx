import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { DialogProvider } from './context/DialogContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';

// Bersihkan semua riwayat dan cache perubahan lama yang sudah tidak diperlukan di localStorage
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('simpanteks:')) {
      keysToRemove.push(key);
    }
    if (
      key === 'tautanlumina:theme' ||
      key === 'tautanlumina:selected_theme' ||
      key === 'tautanlumina:custom_theme' ||
      key === 'tautanlumina:theme_pattern' ||
      key === 'tautanlumina:theme_bg' ||
      key === 'theme' ||
      key === 'tautanlumina:migrated' ||
      key.includes('history') ||
      key.includes('riwayat')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
} catch {
  /* ignore */
}

// Register Service Worker for PWA Offline Access
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  }
} catch (err) {
  console.warn('SW init skipped:', err);
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <DialogProvider>
            <Toaster position="top-center" richColors duration={1500} visibleToasts={1} toastOptions={{ duration: 1500 }} />
            <App />
          </DialogProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
