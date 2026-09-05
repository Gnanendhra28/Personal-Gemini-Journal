import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  JournalEntry,
  JournalMessage,
  UserInteraction,
  UserProfile,
  ReflectionMode,
  MoodType,
  ReflectionInsight,
  UserAction,
  GrowthRecord,
  ActionOutcome,
  ActionStatus,
} from './types';

/**
 * Strict undefined-stripping utility to ensure zero-crash payload hygiene
 * when persisting data to Cloud Firestore.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as unknown as T;
  }
  return obj;
}

/**
 * Save or update user profile document in Firestore
 */
export async function saveUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  const existingSnap = await getDoc(userRef);
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || '',
    createdAt: existingSnap.exists() ? (existingSnap.data().createdAt || now) : now,
    lastLoginAt: now,
  };

  await setDoc(userRef, sanitizePayload(profile), { merge: true });
  return profile;
}

/**
 * Create a new journal entry with initial user reflection & AI response
 */
export async function createJournalEntry(
  userId: string,
  params: {
    title: string;
    category?: string;
    mood?: MoodType;
    tags?: string[];
    userPrompt: string;
    aiResponse: string;
    mode: ReflectionMode;
    modelUsed?: string;
    summary?: string;
  }
): Promise<{ entry: JournalEntry; messages: JournalMessage[] }> {
  if (!userId) throw new Error('User ID is required to create a journal entry');

  const now = new Date().toISOString();
  const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userMsgId = `msg_${Date.now()}_u`;
  const aiMsgId = `msg_${Date.now() + 1}_a`;
  const interactionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const userMessage: JournalMessage = {
    id: userMsgId,
    role: 'user',
    content: params.userPrompt,
    mode: params.mode,
    createdAt: now,
  };

  const aiMessage: JournalMessage = {
    id: aiMsgId,
    role: 'assistant',
    content: params.aiResponse,
    mode: params.mode,
    modelUsed: params.modelUsed || 'gemini-3.6-flash',
    createdAt: new Date(Date.now() + 100).toISOString(),
  };

  const entry: JournalEntry = {
    id: entryId,
    userId,
    title: params.title || (params.userPrompt.slice(0, 40) + '...'),
    category: params.category || 'Personal Reflection',
    mood: params.mood || 'thoughtful',
    tags: params.tags || ['reflection'],
    summary: params.summary || '',
    initialPrompt: params.userPrompt,
    turnCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save Entry document
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await setDoc(entryRef, sanitizePayload(entry));

  // 2. Save Initial Messages
  const userMsgRef = doc(db, 'users', userId, 'entries', entryId, 'messages', userMsgId);
  const aiMsgRef = doc(db, 'users', userId, 'entries', entryId, 'messages', aiMsgId);
  await setDoc(userMsgRef, sanitizePayload(userMessage));
  await setDoc(aiMsgRef, sanitizePayload(aiMessage));

  // 3. Save Interaction record for quick history & challenge compliance
  const interaction: UserInteraction = {
    id: interactionId,
    userId,
    entryId,
    title: entry.title,
    userPrompt: params.userPrompt,
    aiResponse: params.aiResponse,
    mode: params.mode,
    modelUsed: params.modelUsed || 'gemini-3.6-flash',
    createdAt: now,
  };
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await setDoc(interactionRef, sanitizePayload(interaction));

  return { entry, messages: [userMessage, aiMessage] };
}

/**
 * Append a new turn to an existing journal entry
 */
export async function appendTurnToEntry(
  userId: string,
  entryId: string,
  params: {
    userPrompt: string;
    aiResponse: string;
    mode: ReflectionMode;
    modelUsed?: string;
    summary?: string;
  }
): Promise<{ userMessage: JournalMessage; aiMessage: JournalMessage }> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required');

  const now = new Date().toISOString();
  const userMsgId = `msg_${Date.now()}_u`;
  const aiMsgId = `msg_${Date.now() + 1}_a`;
  const interactionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const userMessage: JournalMessage = {
    id: userMsgId,
    role: 'user',
    content: params.userPrompt,
    mode: params.mode,
    createdAt: now,
  };

  const aiMessage: JournalMessage = {
    id: aiMsgId,
    role: 'assistant',
    content: params.aiResponse,
    mode: params.mode,
    modelUsed: params.modelUsed || 'gemini-3.6-flash',
    createdAt: new Date(Date.now() + 100).toISOString(),
  };

  // 1. Save messages sub-collection
  const userMsgRef = doc(db, 'users', userId, 'entries', entryId, 'messages', userMsgId);
  const aiMsgRef = doc(db, 'users', userId, 'entries', entryId, 'messages', aiMsgId);
  await setDoc(userMsgRef, sanitizePayload(userMessage));
  await setDoc(aiMsgRef, sanitizePayload(aiMessage));

  // 2. Update parent entry turn count and timestamp
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const entrySnap = await getDoc(entryRef);
  const currentTurns = entrySnap.exists() ? (entrySnap.data().turnCount || 1) : 1;

  const updateData: Record<string, unknown> = {
    turnCount: currentTurns + 1,
    updatedAt: now,
  };
  if (params.summary) {
    updateData.summary = params.summary;
  }

  await updateDoc(entryRef, sanitizePayload(updateData));

  // 3. Save interaction record
  const interaction: UserInteraction = {
    id: interactionId,
    userId,
    entryId,
    title: entrySnap.exists() ? entrySnap.data().title : 'Reflection Turn',
    userPrompt: params.userPrompt,
    aiResponse: params.aiResponse,
    mode: params.mode,
    modelUsed: params.modelUsed || 'gemini-3.6-flash',
    createdAt: now,
  };
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await setDoc(interactionRef, sanitizePayload(interaction));

  return { userMessage, aiMessage };
}

/**
 * Fetch all journal entries for a user, ordered newest first
 */
export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('updatedAt', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as JournalEntry);
    });
    return entries;
  } catch (error) {
    console.error('Error fetching user entries:', error);
    const entriesRef = collection(db, 'users', userId, 'entries');
    const querySnapshot = await getDocs(entriesRef);
    const entries: JournalEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as JournalEntry);
    });
    return entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

/**
 * Fetch all messages for a specific journal entry
 */
export async function getEntryMessages(userId: string, entryId: string): Promise<JournalMessage[]> {
  if (!userId || !entryId) return [];
  try {
    const messagesRef = collection(db, 'users', userId, 'entries', entryId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);

    const messages: JournalMessage[] = [];
    querySnapshot.forEach((docSnap) => {
      messages.push(docSnap.data() as JournalMessage);
    });
    return messages;
  } catch (error) {
    console.error('Error fetching entry messages:', error);
    const messagesRef = collection(db, 'users', userId, 'entries', entryId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    const messages: JournalMessage[] = [];
    querySnapshot.forEach((docSnap) => {
      messages.push(docSnap.data() as JournalMessage);
    });
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

/**
 * Update summary, title, or metadata of an existing entry
 */
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<Pick<JournalEntry, 'title' | 'summary' | 'mood' | 'category' | 'tags'>>
): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(entryRef, sanitizePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Delete an entire journal entry and its messages
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  
  // 1. Delete messages
  const messagesRef = collection(db, 'users', userId, 'entries', entryId, 'messages');
  const messagesSnap = await getDocs(messagesRef);
  const deletePromises = messagesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);

  // 2. Delete entry doc
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Fetch all user interactions
 */
export async function getUserInteractions(userId: string): Promise<UserInteraction[]> {
  if (!userId) return [];
  try {
    const interactionsRef = collection(db, 'users', userId, 'interactions');
    const q = query(interactionsRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const interactions: UserInteraction[] = [];
    querySnapshot.forEach((docSnap) => {
      interactions.push(docSnap.data() as UserInteraction);
    });
    return interactions;
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return [];
  }
}

/**
 * MODULE 1: REFLECTION INTELLIGENCE PERSISTENCE
 */
export async function saveReflectionInsight(
  userId: string,
  insight: Omit<ReflectionInsight, 'id' | 'createdAt' | 'userId'> & { id?: string; userId?: string }
): Promise<ReflectionInsight> {
  if (!userId) throw new Error('User ID is required to save a reflection insight');
  const id = insight.id || `refl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: ReflectionInsight = {
    id,
    userId,
    entryId: insight.entryId || '',
    goal: insight.goal,
    challenge: insight.challenge,
    insight: insight.insight,
    decision: insight.decision || '',
    opportunity: insight.opportunity || '',
    status: insight.status || 'suggested',
    createdAt: now,
  };

  const ref = doc(db, 'users', userId, 'reflections', id);
  await setDoc(ref, sanitizePayload(record), { merge: true });
  return record;
}

export async function getUserReflections(userId: string): Promise<ReflectionInsight[]> {
  if (!userId) return [];
  try {
    const ref = collection(db, 'users', userId, 'reflections');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const results: ReflectionInsight[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as ReflectionInsight);
    });
    return results;
  } catch (err) {
    console.error('Error fetching user reflections:', err);
    const ref = collection(db, 'users', userId, 'reflections');
    const snap = await getDocs(ref);
    const results: ReflectionInsight[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as ReflectionInsight);
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * MODULE 2: ACTION ENGINE PERSISTENCE
 */
export async function saveUserAction(
  userId: string,
  action: Omit<UserAction, 'id' | 'createdAt' | 'userId'> & { id?: string; userId?: string }
): Promise<UserAction> {
  if (!userId) throw new Error('User ID is required to save an action');
  const id = action.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: UserAction = {
    id,
    userId,
    reflectionId: action.reflectionId || '',
    entryId: action.entryId || '',
    actionText: action.actionText,
    timeframe: action.timeframe || 'This week',
    status: action.status || 'suggested',
    outcome: action.outcome,
    outcomeReason: action.outcomeReason || '',
    learning: action.learning || '',
    adaptedActionId: action.adaptedActionId || '',
    createdAt: now,
    completedAt: action.completedAt || '',
  };

  const ref = doc(db, 'users', userId, 'actions', id);
  await setDoc(ref, sanitizePayload(record), { merge: true });
  return record;
}

export async function updateUserAction(
  userId: string,
  actionId: string,
  updates: Partial<UserAction>
): Promise<void> {
  if (!userId || !actionId) return;
  const ref = doc(db, 'users', userId, 'actions', actionId);
  await updateDoc(ref, sanitizePayload(updates));
}

export async function getUserActions(userId: string): Promise<UserAction[]> {
  if (!userId) return [];
  try {
    const ref = collection(db, 'users', userId, 'actions');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const results: UserAction[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as UserAction);
    });
    return results;
  } catch (err) {
    console.error('Error fetching user actions:', err);
    const ref = collection(db, 'users', userId, 'actions');
    const snap = await getDocs(ref);
    const results: UserAction[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as UserAction);
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * MODULE 4: GROWTH JOURNEY PERSISTENCE
 */
export async function saveGrowthRecord(
  userId: string,
  growth: Omit<GrowthRecord, 'id' | 'createdAt' | 'userId'> & { id?: string; userId?: string }
): Promise<GrowthRecord> {
  if (!userId) throw new Error('User ID is required to save growth record');
  const id = growth.id || `grow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const dateObj = new Date();
  const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  const record: GrowthRecord = {
    id,
    userId,
    reflectionId: growth.reflectionId || '',
    entryId: growth.entryId || '',
    actionId: growth.actionId || '',
    goal: growth.goal,
    challenge: growth.challenge,
    actionText: growth.actionText,
    outcome: growth.outcome,
    learning: growth.learning,
    growthSummary: growth.growthSummary,
    createdAt: now,
    month: growth.month || monthName,
  };

  const ref = doc(db, 'users', userId, 'growth', id);
  await setDoc(ref, sanitizePayload(record));
  return record;
}

export async function getUserGrowthRecords(userId: string): Promise<GrowthRecord[]> {
  if (!userId) return [];
  try {
    const ref = collection(db, 'users', userId, 'growth');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const results: GrowthRecord[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as GrowthRecord);
    });
    return results;
  } catch (err) {
    console.error('Error fetching user growth records:', err);
    const ref = collection(db, 'users', userId, 'growth');
    const snap = await getDocs(ref);
    const results: GrowthRecord[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as GrowthRecord);
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
