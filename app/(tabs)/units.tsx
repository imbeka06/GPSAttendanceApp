import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import { joinUnitByCode } from '../../src/firebase/enrollmentService';
import { listenToStudentUnits, Unit } from '../../src/firebase/unitService';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function UnitsScreen() {
  const router = useRouter();
  const { currentUser } = useAttendance();

  const [units, setUnits]     = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Join modal
  const [modalVisible, setModalVisible] = useState(false);
  const [joinCode, setJoinCode]         = useState('');
  const [joining, setJoining]           = useState(false);

  // ── Real-time listener for enrolled units ─────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToStudentUnits(currentUser.uid, (data) => {
      setUnits(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // ── Join a unit via code ──────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Missing Code', 'Please enter the join code given by your lecturer.');
      return;
    }
    if (!currentUser) return;

    setJoining(true);
    try {
      const { unitCode, unitName } = await joinUnitByCode({
        joinCode:           joinCode.trim(),
        studentUid:         currentUser.uid,
        registrationNumber: currentUser.registrationNumber ?? currentUser.uid,
      });
      setModalVisible(false);
      setJoinCode('');
      Alert.alert('Enrolled!', `You have joined ${unitCode} — ${unitName}.`);
    } catch (err: any) {
      Alert.alert('Could Not Join', err.message);
    } finally {
      setJoining(false);
    }
  };

  // ── Render each enrolled unit card ────────────────────────────────────────
  const renderUnit = ({ item }: { item: Unit }) => (
    <View style={[styles.unitCard, shadowStyle]}>
      <View style={styles.cardInfo}>
        <Text style={styles.unitCode}>{item.code}</Text>
        <Text style={styles.unitName}>{item.name}</Text>
        <Text style={styles.lecturerText}>
          <Ionicons name="person-outline" size={12} color={colors.textSecondary} /> {item.lecturerName}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        {/* Study Materials */}
        <TouchableOpacity
          style={[styles.actionButton, styles.materialsBtn, shadowStyle]}
          onPress={() =>
            router.push({
              pathname: '/materials',
              params: { unitId: item.id, unitName: item.name, unitCode: item.code },
            } as any)
          }
        >
          <Ionicons name="document-text" size={22} color={colors.white} />
          <Text style={styles.actionText}>Materials</Text>
        </TouchableOpacity>

        {/* Class Chat */}
        <TouchableOpacity
          style={[styles.actionButton, styles.chatBtn, shadowStyle]}
          onPress={() => router.push({ pathname: '/chat', params: { unitName: item.name } })}
        >
          <Ionicons name="chatbubbles" size={22} color={colors.white} />
          <Text style={styles.actionText}>Class Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Enrolled Units</Text>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
          <Text style={styles.joinBtnText}>Join Unit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : units.length === 0 ? (
        /* ── Empty State ──────────────────────────────────────────────── */
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={72} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Units Yet</Text>
          <Text style={styles.emptySubtitle}>
            Ask your lecturer for the join code, then tap "Join Unit" to enrol.
          </Text>
          <TouchableOpacity
            style={[styles.emptyJoinBtn, shadowStyle]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.emptyJoinText}>Join a Unit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={(item) => item.id}
          renderItem={renderUnit}
          contentContainerStyle={styles.list}
        />
      )}

      {/* ── Join Unit Modal ──────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); setJoinCode(''); }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join a Unit</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setJoinCode(''); }}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the 6-character code your lecturer shared with you.
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder="e.g. AB12CD"
              placeholderTextColor={colors.textSecondary}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.joinSubmitBtn, joining && styles.joinSubmitBtnDisabled, shadowStyle]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="enter-outline" size={20} color={colors.white} />
              )}
              <Text style={styles.joinSubmitText}>{joining ? 'Joining…' : 'Join Unit'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  joinBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },

  loader: { marginTop: 60 },
  list:   { padding: 20, paddingBottom: 40 },

  unitCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  cardInfo:     { marginBottom: 16 },
  unitCode:     { fontSize: 13, fontWeight: 'bold', color: colors.secondary, marginBottom: 2 },
  unitName:     { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  lecturerText: { fontSize: 12, color: colors.textSecondary },

  buttonRow:    { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', padding: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  materialsBtn: { backgroundColor: colors.primary },
  chatBtn:      { backgroundColor: colors.secondary },
  actionText:   { color: colors.white, fontWeight: 'bold', fontSize: 13 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  emptySubtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  emptyJoinBtn:   { flexDirection: 'row', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 8 },
  emptyJoinText:  { color: colors.white, fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 44,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },

  codeInput: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 24,
    backgroundColor: colors.background,
  },

  joinSubmitBtn:         { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  joinSubmitBtnDisabled: { opacity: 0.6 },
  joinSubmitText:        { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});