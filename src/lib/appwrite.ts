import { Client, Account, Databases, Storage } from 'appwrite';

const env = import.meta.env;

function requiredEnv(name: string, value: string | undefined): string {
  const cleanValue = value?.trim();
  if (!cleanValue) {
    throw new Error(
      `Konfigurasi ${name} belum diisi. Salin .env.example ke .env.local atau atur env pada Appwrite Sites.`
    );
  }
  return cleanValue;
}

// These values are public Appwrite project identifiers, not API secrets.
export const APPWRITE_ENDPOINT = requiredEnv('VITE_APPWRITE_ENDPOINT', env.VITE_APPWRITE_ENDPOINT);
export const APPWRITE_PROJECT_ID = requiredEnv('VITE_APPWRITE_PROJECT_ID', env.VITE_APPWRITE_PROJECT_ID);
export const APPWRITE_DATABASE_ID = requiredEnv('VITE_APPWRITE_DATABASE_ID', env.VITE_APPWRITE_DATABASE_ID);
export const APPWRITE_BUCKET_ID = requiredEnv('VITE_APPWRITE_BUCKET_ID', env.VITE_APPWRITE_BUCKET_ID);

// IDs below are the collections configured for the TautanLumina Appwrite project.
export const APPWRITE_COLLECTION_ID = 'tautanlumina';
export const APPWRITE_ANNOUNCEMENTS_COLLECTION_ID = 'announcements';
export const APPWRITE_MESSAGES_COLLECTION_ID = 'private_messages';
export const ADMIN_EMAIL = 'abdulkarim94786@gmail.com';

export function formatDisplayEmail(email?: string | null): string {
  if (!email) return '';
  const clean = email.trim();
  if (clean.toLowerCase() === ADMIN_EMAIL.toLowerCase() || clean.toLowerCase().includes('abdulkarim94786')) {
    return 'Admin';
  }
  return clean;
}

export const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Verify setup by pinging Appwrite backend server.
client.ping().catch((e) => {
  console.warn('Appwrite server ping failed, falling back to local IndexedDB mode:', e);
});

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const isDevEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    Boolean(import.meta.env.DEV) ||
    host.includes('ais-dev') ||
    host.includes('localhost') ||
    host.includes('127.0.0.1')
  );
};

export const getSyncDocId = (userId: string): string => {
  if (isDevEnvironment()) {
    // Isolated document in development mode to prevent sync to published web.
    const prefix = 'dev_';
    const maxUserIdLen = 36 - prefix.length;
    return `${prefix}${userId.slice(0, maxUserIdLen)}`;
  }
  return userId;
};
