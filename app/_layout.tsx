import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* The index.tsx (Login) will load first automatically */}
        <Stack.Screen name="index" />
        {/* We register the tabs folder so we can navigate to it later */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}