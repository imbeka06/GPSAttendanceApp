import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../src/context/AttendanceContext';
import { signUp, UserRole } from '../src/firebase/authService';
import { colors, shadowStyle } from '../src/theme/colors';

export default function SignUpScreen() {
  const router = useRouter();
  const { setCurrentUser } = useAttendance();

  const [role, setRole]           = useState<UserRole>('student');
  const [fullName, setFullName]   = useState('');
  const [regNumber, setRegNumber] = useState(''); // students
  const [staffId, setStaffId]     = useState(''); // lecturers
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name.'); return;
    }
    if (role === 'student' && !regNumber.trim()) {
      Alert.alert('Missing Field', 'Please enter your registration number.'); return;
    }
    if (role === 'lecturer' && !staffId.trim()) {
      Alert.alert('Missing Field', 'Please enter your staff ID.'); return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email address.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.'); return;
    }

    setIsLoading(true);
    try {
      const user = await signUp({
        role,
        displayName: fullName,
        email,
        password,
        registrationNumber: role === 'student' ? regNumber : undefined,
        staffId: role === 'lecturer' ? staffId : undefined,
      });
      setCurrentUser(user);
      if (user.role === 'lecturer') {
        router.replace('/(lecturer)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the GPS Attendance system</Text>

          {/* ── Role selector ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>I am a:</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'student' && styles.roleCardActive, shadowStyle]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.roleIcon}>🎓</Text>
              <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, role === 'lecturer' && styles.roleCardActive, shadowStyle]}
              onPress={() => setRole('lecturer')}
            >
              <Text style={styles.roleIcon}>👨‍🏫</Text>
              <Text style={[styles.roleText, role === 'lecturer' && styles.roleTextActive]}>Lecturer</Text>
            </TouchableOpacity>
          </View>

          {/* ── Fields ────────────────────────────────────────── */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Kamau"
            placeholderTextColor="#aaa"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {role === 'student' ? (
            <>
              <Text style={styles.label}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SCT221-0001/2022"
                placeholderTextColor="#aaa"
                value={regNumber}
                onChangeText={setRegNumber}
                autoCapitalize="characters"
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Staff ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. JKUAT/L/0042"
                placeholderTextColor="#aaa"
                value={staffId}
                onChangeText={setStaffId}
                autoCapitalize="characters"
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. jkamau@students.jkuat.ac.ke"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Min. 6 characters"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPass}
            value={confirm}
            onChangeText={setConfirm}
          />

          {/* ── Submit ────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.button, shadowStyle, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll:    { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },

  backBtn:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  title:    { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },

  roleRow:      { flexDirection: 'row', gap: 14, marginBottom: 24 },
  roleCard:     { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: colors.white, borderWidth: 2, borderColor: '#eee' },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  roleIcon:     { fontSize: 28, marginBottom: 4 },
  roleText:     { fontWeight: '700', color: colors.textSecondary, fontSize: 14 },
  roleTextActive: { color: colors.primary },

  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },

  passwordRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  passwordInput:{ flex: 1, marginBottom: 0, marginRight: 8 },
  eyeBtn:       { padding: 10, marginBottom: 16 },

  button:         { backgroundColor: colors.secondary, padding: 17, borderRadius: 30, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: colors.white, fontSize: 17, fontWeight: 'bold' },

  loginLink:     { alignItems: 'center' },
  loginLinkText: { color: colors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: colors.primary, fontWeight: 'bold' },
});
