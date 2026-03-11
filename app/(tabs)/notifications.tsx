import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function NotificationsScreen() {
  // Mock data for notifications
  const notifications = [
    {
      id: '1',
      type: 'alert',
      title: 'Room Change',
      message: 'Mobile Computing has been moved to Room 304 for today.',
      time: '10 mins ago',
      isRead: false,
    },
    {
      id: '2',
      type: 'document',
      title: 'New Study Material',
      message: 'Mr. Oyugi uploaded "Chapter 4 in Mobile Computing.',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'Attendance Verified',
      message: 'You successfully signed into Database Systems.',
      time: 'Yesterday',
      isRead: true,
    },
  ];

  // Helper function to pick the right icon based on the type of notification
  const getIconName = (type: string) => {
    switch (type) {
      case 'alert': return 'warning';
      case 'document': return 'document-text';
      case 'success': return 'checkmark-circle';
      default: return 'notifications';
    }
  };

  // Helper function to pick the icon color
  const getIconColor = (type: string) => {
    switch (type) {
      case 'alert': return colors.error; // Red for alerts
      case 'document': return colors.secondary; // Gold for documents
      case 'success': return colors.success; // Green for success
      default: return colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Notifications</Text>

      {notifications.map((notif) => (
        <TouchableOpacity 
          key={notif.id} 
          style={[
            styles.notifCard, 
            shadowStyle,
            !notif.isRead && styles.unreadCard // Adds a gold border if unread
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={getIconName(notif.type)} size={32} color={getIconColor(notif.type)} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.notifTitle}>{notif.title}</Text>
            <Text style={styles.notifMessage}>{notif.message}</Text>
            <Text style={styles.notifTime}>{notif.time}</Text>
          </View>

          {/* Shows a small gold dot on the right if unread */}
          {!notif.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: 20 },
  
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  
  iconContainer: { marginRight: 15, justifyContent: 'center', alignItems: 'center', width: 40 },
  textContainer: { flex: 1 },
  
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  notifMessage: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  notifTime: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginLeft: 10,
  },
});