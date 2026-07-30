import { useState, useEffect } from 'react';

const PIN_KEY = 'tautanlumina:pin_hash';
const PIN_UPDATED_AT_KEY = 'tautanlumina:pin_updated_at';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`tautanlumina_salt_2026_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredPinHash(): string {
  return localStorage.getItem(PIN_KEY) || '';
}

export function getStoredPinUpdatedAt(): number {
  const val = localStorage.getItem(PIN_UPDATED_AT_KEY);
  return val ? parseInt(val, 10) || 0 : 0;
}

export function setStoredPinHash(hash: string, updatedAt?: number): void {
  const ts = updatedAt || Date.now();
  if (hash) {
    localStorage.setItem(PIN_KEY, hash);
  } else {
    localStorage.removeItem(PIN_KEY);
  }
  localStorage.setItem(PIN_UPDATED_AT_KEY, ts.toString());
  window.dispatchEvent(new CustomEvent('tautanlumina:pin_changed', { detail: { hash, updatedAt: ts } }));
}

export function hasPinSet(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  setStoredPinHash(hash);
}

export function removePin(): void {
  setStoredPinHash('');
}

export function usePinState(): boolean {
  const [pinActive, setPinActive] = useState<boolean>(hasPinSet());

  useEffect(() => {
    const handlePinChange = () => {
      setPinActive(hasPinSet());
    };

    window.addEventListener('tautanlumina:pin_changed', handlePinChange);
    window.addEventListener('tautanlumina:user_changed', handlePinChange);
    window.addEventListener('storage', handlePinChange);

    return () => {
      window.removeEventListener('tautanlumina:pin_changed', handlePinChange);
      window.removeEventListener('tautanlumina:user_changed', handlePinChange);
      window.removeEventListener('storage', handlePinChange);
    };
  }, []);

  return pinActive;
}
