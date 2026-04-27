/**
 * chatService.ts
 * Firestore real-time chat per unit.
 *
 * Firestore structure:
 *  chats/{unitId}/messages/{messageId}
 *    text, senderUid, senderName, sentAt (Timestamp)
 */
import {
    addDoc,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface ChatMessage {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  sentAt: string;
}

/** Real-time listener — returns latest 100 messages in order */
export function listenToMessages(
  unitId: string,
  onChange: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, 'chats', unitId, 'messages'),
    orderBy('sentAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const messages: ChatMessage[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text,
        senderUid: data.senderUid,
        senderName: data.senderName,
        sentAt: data.sentAt?.toDate
          ? data.sentAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      };
    });
    onChange(messages);
  });
}

/** Send a message */
export async function sendMessage(params: {
  unitId: string;
  text: string;
  senderUid: string;
  senderName: string;
}): Promise<void> {
  await addDoc(collection(db, 'chats', params.unitId, 'messages'), {
    text: params.text.trim(),
    senderUid: params.senderUid,
    senderName: params.senderName,
    sentAt: serverTimestamp(),
  });
}
