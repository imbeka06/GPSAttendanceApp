import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../src/context/AttendanceContext';
import {
    ChatMessage,
    listenToMessages,
    sendMessage,
} from '../src/firebase/chatService';
import { colors, shadowStyle } from '../src/theme/colors';

export default function ChatScreen() {
  const router   = useRouter();
  const params   = useLocalSearchParams<{ unitId: string; unitName: string }>();
  const { currentUser } = useAttendance();

  const unitId   = params.unitId   ?? '';
  const unitName = params.unitName ?? 'Class Chat';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!unitId) { setLoading(false); return; }
    const unsub = listenToMessages(unitId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [unitId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser || !unitId) return;
    setInputText('');
    setSending(true);
    try {
      await sendMessage({
        unitId,
        text,
        senderUid:  currentUser.uid,
        senderName: currentUser.displayName,
      });
    } catch {
      // message failed — silently ignore, user sees input still cleared
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderUid === currentUser?.uid;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther, shadowStyle]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timeText}>{item.sentAt}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: unitName,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10, padding: 5 }}>
              <Ionicons name="arrow-back" size={28} color={colors.white} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputContainer, shadowStyle]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!sending}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Ionicons name="send" size={20} color={colors.white} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  loader:      { flex: 1, marginTop: 60 },
  chatContainer: { padding: 15, paddingBottom: 20 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:      { color: colors.textSecondary, marginTop: 16, fontSize: 15, textAlign: 'center' },

  messageWrapper:      { marginBottom: 15, maxWidth: '80%' },
  messageWrapperMe:    { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageWrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  senderName:   { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginLeft: 4 },
  timeText:     { fontSize: 10, color: colors.textSecondary, marginTop: 4, opacity: 0.7 },

  messageBubble:      { padding: 12, borderRadius: 15 },
  messageBubbleMe:    { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  messageBubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 2 },

  messageText:      { fontSize: 15 },
  messageTextMe:    { color: colors.white },
  messageTextOther: { color: colors.textPrimary },

  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton:         { backgroundColor: colors.secondary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
});
