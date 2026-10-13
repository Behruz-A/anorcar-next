import { getApps, initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Services are created lazily in browser effects, never during SSR.
export function getChatFirebase() {
 if (typeof window === 'undefined') throw new Error('Chat requires a browser');
 const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
 };
 if (Object.values(config).some(value => !value)) throw new Error('Chat configuration unavailable');
 const app = getApps().find(value => value.name === 'anorcar-chat') ?? initializeApp(config, 'anorcar-chat');
 return { auth: getAuth(app), db: getDatabase(app) };
}

let authQueue: Promise<unknown> = Promise.resolve();
export function serializeChatAuth<T>(work: () => Promise<T>): Promise<T> {
 const result = authQueue.then(work, work);
 authQueue = result.catch(() => undefined);
 return result;
}
export async function memoryChatAuth() {
 const services = getChatFirebase();
 await setPersistence(services.auth, inMemoryPersistence);
 return services;
}

export async function endChatFirebaseSession() {
 const app = getApps().find(value => value.name === 'anorcar-chat');
 if (!app) return;
 const { goOffline } = await import('firebase/database');
 const { signOut } = await import('firebase/auth');
 goOffline(getDatabase(app));
 await serializeChatAuth(() => signOut(getAuth(app)));
}
