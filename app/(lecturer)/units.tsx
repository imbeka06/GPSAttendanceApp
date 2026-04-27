/**
 * (lecturer)/units.tsx
 * Lecturer's "My Units" screen — lists all their created units,
 * shows the join code per unit, and links to the materials uploader.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import { deleteUnit, listenToLecturerUnits, Unit } from '../../src/firebase/unitService';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function LecturerUnitsScreen() {
  const router = useRouter();
  const { currentUser } = useAttendance();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToLecturerUnits(currentUser.uid, (data) => {
      setUnits(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const handleDelete = (item: Unit) => {
    Alert.alert(
      'Remove Unit',
      `Remove "${item.code} — ${item.name}" from your list?\n\nStudents will keep access to the unit for revision.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnit(item.id);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not remove unit.');
            }
          },
        },
      ]
    );
  };

  const renderUnit = ({ item }: { item: Unit }) => (
    <View style={[styles.card, shadowStyle]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.unitCode}>{item.code}</Text>
          <View style={styles.joinCodeBadge}>
            <Ionicons name="key-outline" size={12} color={colors.secondary} />
            <Text style={styles.joinCodeText}>{item.joinCode}</Text>
          </View>
        </View>
        <Text style={styles.unitName}>{item.name}</Text>
        <Text style={styles.metaText}>Created {item.createdAt}</Text>
      </View>

      <TouchableOpacity
        style={[styles.materialsBtn, shadowStyle]}
        onPress={() =>
          router.push({
            pathname: '/(lecturer)/unit-materials',
            params: { unitId: item.id, unitName: item.name, unitCode: item.code },
          } as any)
        }
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
        <Text style={styles.materialsBtnText}>Manage Materials</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteBtn, shadowStyle]}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={18} color='#e53935' />
        <Text style={styles.deleteBtnText}>Remove Unit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Units</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(lecturer)/create-unit' as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : units.length === 0 ? (
        /* ── Empty State ─────────────────────────────────────────────── */
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={72} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Units Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to create your first unit.{'\n'}Students will join using the unit's join code.
          </Text>
          <TouchableOpacity
            style={[styles.emptyCreateBtn, shadowStyle]}
            onPress={() => router.push('/(lecturer)/create-unit' as any)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.emptyCreateText}>Create Unit</Text>
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
  backBtn:     { padding: 4 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  createBtn:   { padding: 4 },

  loader: { marginTop: 60 },

  list: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  cardTop:      { marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  unitCode:     { fontSize: 14, fontWeight: 'bold', color: colors.secondary },
  unitName:     { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  metaText:     { fontSize: 12, color: colors.textSecondary },

  joinCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9ec',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 4,
  },
  joinCodeText: { fontSize: 13, fontWeight: 'bold', color: colors.secondary },

  materialsBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    borderRadius: 10,
    gap: 8,
  },
  materialsBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 11,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e53935',
    backgroundColor: '#fff5f5',
  },
  deleteBtnText: { color: '#e53935', fontWeight: 'bold', fontSize: 14 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  emptySubtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  emptyCreateBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyCreateText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
