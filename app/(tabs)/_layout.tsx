import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleAlign: 'center',
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="units" 
        options={{ 
          title: 'Units & Chats', 
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications', 
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}