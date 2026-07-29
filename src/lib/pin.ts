const PIN_KEY = 'tautanlumina:pin_hash';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`tautanlumina_salt_2026_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  localStorage.setItem(PIN_KEY, hash);
}

export function removePin(): void {
  localStorage.removeItem(PIN_KEY);
}
