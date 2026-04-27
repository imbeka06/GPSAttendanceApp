/**
 * (lecturer)/session-records.tsx
 * Shows the live list of students who have signed in for an attendance session.
 * Receives sessionId, unitCode, unitName as route params.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    AttendanceRecord,
    listenToSessionRecords,
} from '../../src/firebase/attendanceService';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function SessionRecordsScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{
    sessionId: string;
    unitCode:  string;
    unitName:  string;
  }>();

  const [records, setRecords]   = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!params.sessionId) return;
    const unsub = listenToSessionRecords(params.sessionId, (data) => {
      setRecords(data);
      setLoading(false);
    });
    return unsub;
  }, [params.sessionId]);

  const handleExport = async () => {
    if (records.length === 0) {
      Alert.alert('Nothing to Export', 'No students have signed in yet.');
      return;
    }
    setExporting(true);
    try {
      const date = new Date().toLocaleDateString('en-KE').replace(/\//g, '-');
      const header = 'No,Name,Registration Number,Email,Time Signed In,Distance (m)\n';
      const rows = records
        .map((r, i) =>
          `${i + 1},"${r.studentName}","${r.registrationNumber}","${r.studentEmail}",${r.markedAt},${r.distanceMeters}`
        )
        .join('\n');
      const csv = header + rows;

      await Share.share({
        message: csv,
        title: `Attendance_${params.unitCode}_${date}.csv`,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Could not export. Try again.');
    } finally {
      setExporting(false);
    }
  };

  const renderRecord = ({ item, index }: { item: AttendanceRecord; index: number }) => (
    <View style={[styles.row, shadowStyle]}>
      <View style={styles.indexBox}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.regNumber}>{item.registrationNumber}</Text>
        <Text style={styles.meta}>{item.studentEmail}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.time}>{item.markedAt}</Text>
        <Text style={styles.distance}>{item.distanceMeters}m</Text>
      </View>
    </View>
  );

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
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{records.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="download-outline" size={22} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Students Signed In</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Students Yet</Text>
          <Text style={styles.emptySubtitle}>
            Students who mark attendance will appear here in real time.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.studentUid}
          renderItem={renderRecord}
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
    gap: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn:   { padding: 4 },
  headerText: { flex: 1 },
  unitCode:  { color: colors.secondary, fontWeight: 'bold', fontSize: 13 },
  unitName:  { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  countBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  exportBtn: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  loader: { marginTop: 60 },
  list:   { padding: 16, paddingBottom: 40 },

  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indexBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText:    { fontWeight: 'bold', color: colors.primary, fontSize: 14 },
  rowInfo:      { flex: 1 },
  studentName:  { fontWeight: 'bold', color: colors.textPrimary, fontSize: 15 },
  regNumber:    { color: colors.secondary, fontSize: 13, fontWeight: '600', marginTop: 1 },
  meta:         { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  rowRight:     { alignItems: 'flex-end' },
  time:         { fontWeight: 'bold', color: colors.textPrimary, fontSize: 13 },
  distance:     { color: colors.textSecondary, fontSize: 11, marginTop: 2 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
