import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router'; // Fixes the routing crash
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Fixes the warning
import { colors, shadowStyle } from '../src/theme/colors'; // setting correct path for my setup

export default function LoginScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Controls the vertical selection

  //  ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade in the whole form when the app opens
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. Make the Login button continuously float up and down to look 3D/Interactive
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert("Error", "Biometrics not supported or setup on this device.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      Alert.alert("Success!", `Logged in as ${role === 'lecturer' ? 'Lecturer' : 'Student'}`);
      
      // Using small timeout so the Alert box closing doesn't block the router
      setTimeout(() => {
        if (role === 'lecturer') {
          router.replace('/(lecturer)');
        } else {
          router.replace('/(tabs)');
        }
      }, 300);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Your custom Title */}
        <Text style={styles.title}>JKUAT STUDENT ATTENDANCE APP{'\n'}<Text style={{fontSize: 16, textTransform: 'lowercase'}}>student attendance app</Text></Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{role === 'lecturer' ? 'Lecturer ID' : 'Student ID'}</Text>
          <TextInput 
            style={styles.input} 
            placeholder={`Enter ${role === 'lecturer' ? 'Lecturer ID' : 'Student ID'}`}
            value={userId}
            onChangeText={setUserId}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter Password" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* NEW VERTICAL ROLE SELECTION */}
        <View style={styles.roleSelectionContainer}> 
          <Text style={styles.roleHeader}>Select Account Type:</Text> 
          
          <TouchableOpacity 
            style={[styles.roleCard, role === 'student' ? styles.roleCardActive : styles.roleCardInactive, shadowStyle]}
            onPress={() => setRole('student')}
          >
            <Text style={[styles.roleText, role === 'student' ? styles.roleTextActive : styles.roleTextInactive]}>🎓 Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleCard, role === 'lecturer' ? styles.roleCardActive : styles.roleCardInactive, shadowStyle]}
            onPress={() => setRole('lecturer')}
          >
            <Text style={[styles.roleText, role === 'lecturer' ? styles.roleTextActive : styles.roleTextInactive]}>👨‍🏫 Lecturer</Text>
          </TouchableOpacity>
        </View>

        {/* FLOATING LOGIN BUTTON */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <TouchableOpacity style={[styles.button, shadowStyle]} onPress={handleBiometricAuth}>
            <Text style={styles.buttonText}>Login with Biometrics</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>

      <Text style={styles.developerText}>Developer: Imbeka Musa</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 5, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  
  // Styles for the vertical selection
  roleSelectionContainer: { marginBottom: 30 },
  roleHeader: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 10 },
  roleCard: { padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 2 },
  roleCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleCardInactive: { backgroundColor: colors.white, borderColor: '#eee', opacity: 0.5 }, // Grays out perfectly
  roleText: { fontSize: 16, fontWeight: 'bold' },
  roleTextActive: { color: colors.white },
  roleTextInactive: { color: colors.textSecondary },

  button: {
    backgroundColor: colors.secondary, // Gold button
    padding: 18,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  developerText: { textAlign: 'center', color: colors.primary, fontWeight: 'bold', marginBottom: 20 },
});