/**
 * (lecturer)/create-unit.tsx
 * Form for lecturers to create a new academic unit.
 * On submit: writes to Firestore and auto-generates a student join code.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import { createUnit } from '../../src/firebase/unitService';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function CreateUnitScreen() {
  const router = useRouter();
  const { currentUser } = useAttendance();

  const [code, setCode]       = useState('');
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the unit code and name.');
      return;
    }
    if (!currentUser) return;

    setLoading(true);
    try {
      await createUnit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        lecturerId: currentUser.uid,
        lecturerName: currentUser.displayName,
      });
      Alert.alert(
        'Unit Created!',
        `"${name.trim()}" has been created. Share the join code from the My Units screen with your students.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create unit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Unit</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            A unique join code will be auto-generated. Share it with students so they can enrol.
          </Text>
        </View>

        {/* Unit Code */}
        <Text style={styles.label}>Unit Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ICS 2201"
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={12}
        />

        {/* Unit Name */}
        <Text style={styles.label}>Unit Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mobile Computing"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={80}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled, shadowStyle]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Ionicons name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'} size={22} color={colors.white} />
          <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Create Unit'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn:     { padding: 4 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },

  content: { padding: 24, paddingTop: 32 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },

  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 4 },

  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 22,
  },

  createBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
    gap: 10,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText:     { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
