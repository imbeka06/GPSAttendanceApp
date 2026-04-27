import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../src/context/AttendanceContext';
import { signIn } from '../src/firebase/authService';
import { colors, shadowStyle } from '../src/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentUser, authLoading, currentUser } = useAttendance();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 900, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // If user is already signed in (app reload), redirect immediately
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role === 'lecturer') {
        router.replace('/(lecturer)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, [authLoading, currentUser]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      setCurrentUser(user);
      if (user.role === 'lecturer') {
        router.replace('/(lecturer)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>GPS Attendance App</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoName}>Simon Musa Imbeka — SCM211/0676</Text>
            <Text style={styles.infoLine}>CAT: Mobile Computing</Text>
            <Text style={styles.infoLine}>Completed: 27/04/2026</Text>
          </View>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. student001@university.ac.ke"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <TouchableOpacity
              style={[styles.button, shadowStyle, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => router.push('/signup' as any)} style={styles.signupLink}>
            <Text style={styles.signupLinkText}>Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
      <Text style={styles.developerText}>Developer: Imbeka Musa</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  container:        { flex: 1, backgroundColor: colors.background },
  content:          { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  title:            { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 },
  infoCard:         { backgroundColor: colors.primary + '12', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 14, alignItems: 'center' },
  infoName:         { fontSize: 13, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  infoLine:         { fontSize: 12, color: colors.textSecondary },
  subtitle:         { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },

  inputContainer: { marginBottom: 24 },
  label:          { fontSize: 14, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
  },

  button:         { backgroundColor: colors.secondary, padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: colors.white, fontSize: 18, fontWeight: 'bold' },

  signupLink:     { alignItems: 'center', marginTop: 6 },
  signupLinkText: { color: colors.textSecondary, fontSize: 14 },
  signupLinkBold: { color: colors.primary, fontWeight: 'bold' },
  developerText: { textAlign: 'center', color: colors.primary, fontWeight: 'bold', marginBottom: 20 },
});
