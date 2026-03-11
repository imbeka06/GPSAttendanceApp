import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../src/theme/colors';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // We get the unit name from the button we clicked, or default to 'Class Chat'
  const unitName = params.unitName || 'Class Chat';

  const [inputText, setInputText] = useState('');
  
  // Mock data to make the chat look alive
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hi everyone! Did the lecturer upload the new notes?', sender: 'Student A', time: '10:00 AM', isMe: false },
    { id: '2', text: 'Yes, check the study materials section.', sender: 'Student B', time: '10:05 AM', isMe: false },
  ]);

  // Function to handle sending a new message
  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'Me', // You are the sender
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setInputText(''); // Clear the input box
  };

  // How each individual message bubble is drawn
  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageWrapper, item.isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
      {!item.isMe && <Text style={styles.senderName}>{item.sender}</Text>}
      <View style={[styles.messageBubble, item.isMe ? styles.messageBubbleMe : styles.messageBubbleOther, shadowStyle]}>
        <Text style={[styles.messageText, item.isMe ? styles.messageTextMe : styles.messageTextOther]}>{item.text}</Text>
      </View>
      <Text style={styles.timeText}>{item.time}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* This customizes the top header for this specific screen */}
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: unitName as string,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10, padding: 5 }}>
              <Ionicons name="arrow-back" size={28} color={colors.white} />
            </TouchableOpacity>
          )
        }} 
      />

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={[styles.inputContainer, shadowStyle]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatContainer: { padding: 15, paddingBottom: 20 },
  
  messageWrapper: { marginBottom: 15, maxWidth: '80%' },
  messageWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageWrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  
  senderName: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginLeft: 4 },
  timeText: { fontSize: 10, color: colors.textSecondary, marginTop: 4, opacity: 0.7 },
  
  messageBubble: { padding: 12, borderRadius: 15 },
  messageBubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  messageBubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 2 },
  
  messageText: { fontSize: 15 },
  messageTextMe: { color: colors.white },
  messageTextOther: { color: colors.textPrimary },
  
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: colors.white, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, marginRight: 10 },
  sendButton: { backgroundColor: colors.secondary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});