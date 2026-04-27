/**
 * app/materials.tsx
 * Student's "Learning Materials" screen for a specific enrolled unit.
 * Access control: verifies enrollment in Firestore before rendering.
 * Real-time: uses onSnapshot so new uploads appear instantly.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../src/context/AttendanceContext';
import { isStudentEnrolled } from '../src/firebase/enrollmentService';
import { listenToMaterials, Material } from '../src/firebase/materialService';
import { colors, shadowStyle } from '../src/theme/colors';

// ─── Icon helper (mirrors lecturer side) ──────────────────────────────────────
function getMaterialIcon(type: Material['type']) {
  switch (type) {
    case 'pdf':  return { name: 'document-text' as const, color: '#e53935' };
    case 'docx': return { name: 'document'      as const, color: '#1565c0' };
    case 'pptx': return { name: 'easel'         as const, color: '#e65100' };
    case 'link': return { name: 'link'           as const, color: colors.primary };
  }
}

export default function MaterialsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ unitId: string; unitName: string; unitCode: string }>();
  const { currentUser } = useAttendance();

  const [checking,  setChecking]  = useState(true);  // enrollment check
  const [allowed,   setAllowed]   = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // ── Step 1: Access control — verify enrollment ────────────────────────────
  useEffect(() => {
    if (!currentUser || !params.unitId) return;

    isStudentEnrolled(currentUser.uid, params.unitId)
      .then((enrolled) => {
        if (!enrolled) {
          Alert.alert(
            'Access Denied',
            'You are not enrolled in this unit.',
            [{ text: 'Go Back', onPress: () => router.replace('/(tabs)/units' as any) }]
          );
        }
        setAllowed(enrolled);
      })
      .catch(() => {
        Alert.alert('Error', 'Could not verify enrollment. Try again.');
        router.back();
      })
      .finally(() => setChecking(false));
  }, [currentUser, params.unitId]);

  // ── Step 2: Subscribe to materials (only if enrolled) ────────────────────
  useEffect(() => {
    if (!allowed || !params.unitId) return;
    const unsub = listenToMaterials(params.unitId, (data) => {
      setMaterials(data);
      setLoadingMaterials(false);
    });
    return unsub;
  }, [allowed, params.unitId]);

  // ── Open material URL ─────────────────────────────────────────────────────
  const handleOpen = async (item: Material) => {
    const canOpen = await Linking.canOpenURL(item.url);
    if (!canOpen) {
      Alert.alert('Cannot Open', 'No app found to open this file type.');
      return;
    }
    await Linking.openURL(item.url);
  };

  // ── Render each material card ─────────────────────────────────────────────
  const renderMaterial = ({ item }: { item: Material }) => {
    const icon = getMaterialIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.materialCard, shadowStyle]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: icon.color + '18' }]}>
          <Ionicons name={icon.name} size={26} color={icon.color} />
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.materialMeta}>
            Posted by {item.uploaderName} · {item.uploadedAt}
          </Text>
        </View>
        <View style={styles.openChevron}>
          <Ionicons
            name={item.type === 'link' ? 'open-outline' : 'download-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (checking) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.checkingText}>Verifying access…</Text>
      </View>
    );
  }

  if (!allowed) return null; // Alert handles navigation

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.unitCode}>{params.unitCode}</Text>
          <Text style={styles.unitName} numberOfLines={1}>{params.unitName}</Text>
        </View>
      </View>

      {loadingMaterials ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : materials.length === 0 ? (
        /* ── Empty State ──────────────────────────────────────────────── */
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={72} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Materials Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your lecturer hasn't uploaded anything for this unit yet.{'\n'}
            Check back later!
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.countLabel}>
            {materials.length} material{materials.length !== 1 ? 's' : ''} available
          </Text>
          <FlatList
            data={materials}
            keyExtractor={(item) => item.id}
            renderItem={renderMaterial}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  checkingText:      { fontSize: 14, color: colors.textSecondary },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 14,
  },
  backBtn:    { padding: 4 },
  headerText: { flex: 1 },
  unitCode:   { color: colors.white, fontSize: 12, opacity: 0.8 },
  unitName:   { color: colors.white, fontSize: 18, fontWeight: 'bold' },

  loader:     { marginTop: 60 },
  countLabel: { fontSize: 13, color: colors.textSecondary, marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
  list:       { padding: 20, paddingTop: 10, paddingBottom: 40 },

  materialCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox:      { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  materialMeta:  { fontSize: 12, color: colors.textSecondary },
  openChevron:   { padding: 4 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 18, marginBottom: 10 },
  emptySubtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
