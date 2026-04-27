import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function LecturerLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="units" />
        <Stack.Screen name="create-unit" />
        <Stack.Screen name="unit-materials" />
        <Stack.Screen name="session-records" />
      </Stack>
    </>
  );
}