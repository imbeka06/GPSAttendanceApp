import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AttendanceProvider, useAttendance } from '../src/context/AttendanceContext';

// Watches auth state from the root navigator context — the only place
// where router.replace('/') is guaranteed to be handled correctly.
function AuthGuard() {
  const { currentUser, authLoading } = useAttendance();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    const inProtectedRoute = segments[0] === '(tabs)' || segments[0] === '(lecturer)';
    if (!currentUser && inProtectedRoute) {
      router.replace('/');
    }
  }, [currentUser, authLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AttendanceProvider>
      <AuthGuard />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(lecturer)" />
        <Stack.Screen name="materials" />
        <Stack.Screen name="chat" />
      </Stack>
    </AttendanceProvider>
  );
}