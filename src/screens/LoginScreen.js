// src/screens/LoginScreen.js
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLecturer, setIsLecturer] = useState(false);

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
      // We will navigate to the Dashboard here later
      Alert.alert("Success!", `Logged in as ${isLecturer ? 'Lecturer' : 'Student'}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Text style={styles.title}>React Native GPS-based{'\n'}student attendance app</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{isLecturer ? 'Lecturer ID' : 'Student ID'}</Text>
          <TextInput 
            style={styles.input} 
            placeholder={`Enter ${isLecturer ? 'Lecturer ID' : 'Student ID'}`}
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

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>Login as: Student / Lecturer</Text>
          <Switch
            trackColor={{ false: '#ccc', true: colors.primary }}
            thumbColor={'#fff'}
            onValueChange={() => setIsLecturer(!isLecturer)}
            value={isLecturer}
          />
        </View>

        <TouchableOpacity style={[styles.button, shadowStyle]} onPress={handleBiometricAuth}>
          <Text style={styles.buttonText}>Login with Biometrics</Text>
        </TouchableOpacity>

      </View>

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
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  toggleText: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
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