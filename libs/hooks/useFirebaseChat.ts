import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { DataSnapshot, endBefore, get, goOffline, goOnline, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set } from 'firebase/database';
import { userVar } from '../../apollo/store';
import { CREATE_FIREBASE_CHAT_TOKEN, CREATE_FIREBASE_CONVERSATION, GET_FIREBASE_CONVERSATION } from '../../apollo/user/firebaseChat';
import { getChatFirebase, memoryChatAuth, serializeChatAuth } from '../firebase/client';

export interface ChatMessage { id: string; senderId: string; text: string; createdAt: number }
export interface ChatThread { id: string; otherMemberId: string; createdAt: number; preview?: string }
const PAGE = 30;
const chronological = (a: ChatMessage, b: ChatMessage) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export function readChatMessages(snapshot: DataSnapshot): ChatMessage[] {
 const items: ChatMessage[] = [];
 snapshot.forEach(child => { const value = child.val(); items.push({ ...value, id: child.key! }); });
 return items.sort(chronological);
}
export function mergeChatMessages(old: ChatMessage[], incoming: ChatMessage[]) {
 const map = new Map(old.map(item => [item.id, item]));
 incoming.forEach(item => map.set(item.id, item));
 return Array.from(map.values()).sort(chronological);
}

export function useFirebaseChat(enabled: boolean) {
 const client = useApolloClient();
 const user = useReactiveVar(userVar);
 const uid = user._id.toLowerCase();
 const allowed = !!uid && ['USER', 'AGENT'].includes(user.memberType) && user.memberStatus === 'ACTIVE';
 const [retry, setRetry] = useState(0);
 const [session, setSession] = useState<{ uid: string; generation: number } | null>(null);
 const [threads, setThreads] = useState<ChatThread[]>([]);
 const [selected, setSelected] = useState('');
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [loading, setLoading] = useState(false);
 const [indexLoading, setIndexLoading] = useState(false);
 const [olderLoading, setOlderLoading] = useState(false);
 const [hasOlder, setHasOlder] = useState(false);
 const [online, setOnline] = useState(false);
 const [sending, setSending] = useState(false);
 const [error, setError] = useState('');
 const generation = useRef(0);
 const selectionVersion = useRef(0);
 const sendLock = useRef(false);
 const openLock = useRef(false);
 const olderLock = useRef(false);
 const stopSession = useRef<() => void>(() => undefined);
 const ready = enabled && allowed && session?.uid === uid && session.generation === generation.current;

 useEffect(() => {
  const version = ++generation.current;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  let expiryTimer: ReturnType<typeof setTimeout>;
  const listeners: (() => void)[] = [];
  const stop = () => {
   if (stopped) return;
   stopped = true; ++generation.current;
   clearTimeout(timer); clearTimeout(expiryTimer);
   listeners.splice(0).forEach(unsubscribe => unsubscribe());
   setSession(null); setThreads([]); setMessages([]); setSelected(''); setOnline(false); setIndexLoading(false); setLoading(false); setSending(false); setOlderLoading(false);
   sendLock.current = false; openLock.current = false; olderLock.current = false;
   // Disconnect immediately; serialize sign-out behind any in-flight sign-in.
   try { goOffline(getChatFirebase().db); } catch { /* Missing configuration. */ }
   void serializeChatAuth(async () => { try { await signOut(getChatFirebase().auth); } catch { /* Already unavailable. */ } });
  };
  stopSession.current = stop;
  setSession(null); setError(''); setThreads([]); setMessages([]); setSelected('');
  if (!enabled || !allowed) return stop;
  setIndexLoading(true);
  const current = () => !stopped && generation.current === version && userVar()._id.toLowerCase() === uid && !localStorage.getItem('logoutPending');
  const fail = () => { if (current()) { setError('Chat access unavailable. Please retry.'); stop(); } };
  let expires = 0;
  const renew = async () => {
   try {
    await serializeChatAuth(async () => {
     if (!current()) return;
     const services = await memoryChatAuth();
     const result = await client.mutate({ mutation: CREATE_FIREBASE_CHAT_TOKEN, fetchPolicy: 'no-cache', context: { skipGlobalError: true } });
     if (!current()) return;
     const credential = await signInWithCustomToken(services.auth, result.data.createFirebaseChatToken);
     if (!current()) { await signOut(services.auth); return; }
     const token = await credential.user.getIdTokenResult();
     expires = Number(token.claims.chatExpiresAt);
     if (credential.user.uid !== uid || token.claims.anorcarChat !== true || !Number.isFinite(expires) || expires <= Date.now() + 60000) throw new Error('Invalid chat grant');
     clearTimeout(expiryTimer);
     expiryTimer = setTimeout(fail, Math.max(0, expires - Date.now()));
     goOnline(services.db);
     setSession({ uid, generation: version });
     if (!listeners.length) {
      listeners.push(onValue(ref(services.db, '.info/connected'), snapshot => { if (current()) setOnline(snapshot.val() === true); }));
      const previews = new Map<string, () => void>();
      listeners.push(() => { previews.forEach(unsubscribe => unsubscribe()); previews.clear(); });
      listeners.push(onValue(query(ref(services.db, `userConversations/${uid}`), orderByChild('createdAt')), snapshot => {
       if (!current()) return;
       const rows: ChatThread[] = [];
       snapshot.forEach(child => { rows.push({ id: child.key!, ...child.val() }); });
       setThreads(previous => rows.reverse().map(row => ({ ...row, preview: previous.find(item => item.id === row.id)?.preview })));
       setIndexLoading(false);
       const ids = new Set(rows.map(row => row.id));
       previews.forEach((unsubscribe, id) => { if (!ids.has(id)) { unsubscribe(); previews.delete(id); } });
       rows.forEach(row => {
        if (previews.has(row.id)) return;
        previews.set(row.id, onValue(query(ref(services.db, `messages/${row.id}`), orderByChild('createdAt'), limitToLast(1)), value => {
         if (!current()) return;
         const latest = readChatMessages(value)[0];
         setThreads(previous => previous.map(item => item.id === row.id ? { ...item, preview: latest?.text } : item));
        }, fail));
       });
      }, fail));
     }
    });
    if (current()) timer = setTimeout(renew, Math.max(1000, expires - Date.now() - 60000));
   } catch { fail(); }
  };
  const wake = () => { if (current() && expires && Date.now() >= expires) fail(); };
  const authChanged = () => { if (userVar()._id.toLowerCase() !== uid || localStorage.getItem('logoutPending') || !localStorage.getItem('accessToken')) stop(); };
  window.addEventListener('anorcar:auth-changed', authChanged);
  window.addEventListener('storage', authChanged);
  window.addEventListener('anorcar:session-changing', stop);
  document.addEventListener('visibilitychange', wake);
  void renew();
  return () => { stop(); window.removeEventListener('anorcar:auth-changed', authChanged); window.removeEventListener('storage', authChanged); window.removeEventListener('anorcar:session-changing', stop); document.removeEventListener('visibilitychange', wake); };
 }, [client, uid, user.memberType, user.memberStatus, enabled, allowed, retry]);

 useEffect(() => {
  const version = ++selectionVersion.current;
  let unsubscribe: () => void = () => undefined;
  olderLock.current = false; setOlderLoading(false);
  setMessages([]); setHasOlder(false); setLoading(false);
  if (!ready || !selected) return;
  setLoading(true);
  const current = () => version === selectionVersion.current && session?.generation === generation.current;
  let initial = true;
  void client.query({ query: GET_FIREBASE_CONVERSATION, variables: { conversationId: selected }, fetchPolicy: 'no-cache', context: { skipGlobalError: true } }).then(() => {
   if (!current()) return;
   unsubscribe = onValue(query(ref(getChatFirebase().db, `messages/${selected}`), orderByChild('createdAt'), limitToLast(PAGE)), snapshot => {
    if (!current()) return;
    const incoming = readChatMessages(snapshot);
    setMessages(previous => mergeChatMessages(previous, incoming));
    if (initial) { setHasOlder(incoming.length === PAGE); initial = false; }
    setLoading(false);
   }, () => { if (current()) { setError('Chat access unavailable. Please retry.'); stopSession.current(); } });
  }).catch(() => { if (current()) { setError('Chat access unavailable. Please retry.'); stopSession.current(); } });
  return () => { ++selectionVersion.current; unsubscribe(); };
 }, [client, selected, ready, session?.generation]);

 const startConversation = async (agentId: string) => {
  if (!ready || user.memberType !== 'USER' || openLock.current) return;
  const version = generation.current;
  openLock.current = true; setError('');
  try {
   const result = await client.mutate({ mutation: CREATE_FIREBASE_CONVERSATION, variables: { input: { agentId } }, fetchPolicy: 'no-cache', context: { skipGlobalError: true } });
   if (version === generation.current) setSelected(result.data.createFirebaseConversation.conversationId);
  } catch { if (version === generation.current) setError('Unable to open conversation. Please retry.'); }
  finally { if (version === generation.current) openLock.current = false; }
 };
 const loadOlder = async () => {
  if (!ready || !online || olderLock.current || !messages.length || !hasOlder) return;
  olderLock.current = true; setOlderLoading(true);
  const version = selectionVersion.current;
  const first = messages[0];
  try {
   const snapshot = await get(query(ref(getChatFirebase().db, `messages/${selected}`), orderByChild('createdAt'), endBefore(first.createdAt, first.id), limitToLast(PAGE)));
   if (version !== selectionVersion.current) return;
   const incoming = readChatMessages(snapshot);
   setMessages(previous => mergeChatMessages(previous, incoming)); setHasOlder(incoming.length === PAGE);
  } catch (cause) { if (version === selectionVersion.current) { setError('Unable to load messages. Please retry.'); if (/permission.?denied/i.test(String(cause))) stopSession.current(); } }
  finally { if (version === selectionVersion.current) { olderLock.current = false; setOlderLoading(false); } }
 };
 const send = async (text: string) => {
  if (!ready || !online || !selected || sendLock.current || !text.trim() || text.length > 2000) return false;
  const services = getChatFirebase();
  if (services.auth.currentUser?.uid !== uid) return false;
  const version = generation.current;
  sendLock.current = true; setSending(true); setError('');
  try {
   await set(push(ref(services.db, `messages/${selected}`)), { senderId: services.auth.currentUser.uid, text: text.trim(), createdAt: serverTimestamp() });
   return version === generation.current;
  } catch (cause) {
   if (version === generation.current) {
    setError('Unable to send message. Please retry.');
    if (/permission.?denied/i.test(String(cause))) stopSession.current();
   }
   return false;
  } finally { if (version === generation.current) { sendLock.current = false; setSending(false); } }
 };
 return { uid, isCustomer: user.memberType === 'USER', allowed, ready, threads: ready ? threads : [], selected: ready ? selected : '', select: setSelected, messages: ready ? messages : [], loading, indexLoading, hasOlder, olderLoading, online, sending, error, startConversation, loadOlder, send, retry: () => setRetry(value => value + 1) };
}
