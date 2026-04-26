import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AttendanceProvider } from '../src/context/AttendanceContext';

export default function RootLayout() {
  return (
    <AttendanceProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(lecturer)" />
      </Stack>
    </AttendanceProvider>
  );
}