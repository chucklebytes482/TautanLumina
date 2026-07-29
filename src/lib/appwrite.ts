import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a616ac3001f1f3875c5';

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Verify setup by pinging Appwrite backend server
client.ping().catch((e) => {
    console.warn('Appwrite server ping failed, falling back to local IndexedDB mode:', e);
});

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a616b8f00229e5d63da';
export const APPWRITE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'tautanlumina';
export const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '6a61c1ac0024510878a6';


