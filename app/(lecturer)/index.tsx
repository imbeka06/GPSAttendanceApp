import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import { colors, shadowStyle } from '../../src/theme/colors';

const LECTURER_UNITS = [
  { id: '1', code: 'ICS 2201', name: 'Object Oriented Programming' },
  { id: '2', code: 'ICS 2202', name: 'Database Systems' },
  { id: '3', code: 'ICS 2203', name: 'Mobile Computing' },
  { id: '4', code: 'ICS 2204', name: 'Data Structures' },
  { id: '5', code: 'ICS 2205', name: 'Operating Systems' },
  { id: '6', code: 'ICS 2206', name: 'Software Engineering' },
  { id: '7', code: 'ICS 2207', name: 'Computer Networks' },
  { id: '8', code: 'ICS 2208', name: 'Artificial Intelligence' },
];

export default function LecturerDashboard() {
  const router = useRouter();
  const { activeSession, startSession, endSession } = useAttendance();
  const [isActivating, setIsActivating] = useState(false);

  // Staggered slide-in animations for unit cards
  const slideAnims = useRef(LECTURER_UNITS.map(() => new Animated.Value(50))).current;
  const opacityAnims = useRef(LECTURER_UNITS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = LECTURER_UNITS.map((_, index) =>
      Animated.parallel([
        Animated.timing(slideAnims[index], { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacityAnims[index], { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    Animated.stagger(80, animations).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          if (activeSession) endSession();
          setTimeout(() => router.replace('/'), 100);
        },
      },
    ]);
  };

  const handleActivateAttendance = async (unit: (typeof LECTURER_UNITS)[0]) => {
    if (activeSession) {
      Alert.alert(
        'Session Already Active',
        `"${activeSession.unitCode}" attendance is already running. End it first before starting a new one.`
      );
      return;
    }

    setIsActivating(true);
    try {
      // ── Step 1: Biometric Authentication ──────────────────────────
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Unavailable',
          'Please set up biometrics on your device to activate attendance.'
        );
        setIsActivating(false);
        return;
      }

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: `Activate attendance for ${unit.code} — ${unit.name}`,
        fallbackLabel: 'Use Passcode',
      });

      if (!biometricResult.success) {
        Alert.alert('Authentication Failed', 'Biometric verification failed. Attendance not activated.');
        setIsActivating(false);
        return;
      }

      // ── Step 2: Capture class GPS location ────────────────────────
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Denied', 'Location access is required to pin the classroom.');
        setIsActivating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      // ── Step 3: Start the attendance session ──────────────────────
      startSession({
        unitId: unit.id,
        unitCode: unit.code,
        unitName: unit.name,
        classLat: location.coords.latitude,
        classLon: location.coords.longitude,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      Alert.alert(
        '✅ Attendance Activated!',
        `Students can now sign in for ${unit.code} — ${unit.name}.\nClass location set to your current GPS position.`
      );
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    Alert.alert(
      'End Session',
      `End attendance for ${activeSession.unitCode} — ${activeSession.unitName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: () => endSession() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, Dr. Kamau</Text>
          <Text style={styles.subtitleText}>Your Assigned Units</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Active Session Banner ─────────────────────────────────── */}
      {activeSession && (
        <View style={[styles.activeBanner, shadowStyle]}>
          <View style={styles.activeBannerLeft}>
            <View style={styles.activeDot} />
            <View>
              <Text style={styles.activeBannerTitle}>🟢 Attendance Active</Text>
              <Text style={styles.activeBannerSub}>
                {activeSession.unitCode} · Started {activeSession.startedAt}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.endBannerButton} onPress={handleEndSession}>
            <Text style={styles.endBannerText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Activating Indicator ──────────────────────────────────── */}
      {isActivating && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying identity &amp; capturing class location…</Text>
        </View>
      )}

      {/* ── Unit Cards ────────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {LECTURER_UNITS.map((unit, index) => {
          const isActive = activeSession?.unitId === unit.id;

          return (
            <Animated.View
              key={unit.id}
              style={[
                styles.unitCard,
                shadowStyle,
                isActive && styles.activeUnitCard,
                { opacity: opacityAnims[index], transform: [{ translateY: slideAnims[index] }] },
              ]}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={[styles.unitCode, isActive && styles.activeUnitCode]}>{unit.code}</Text>
                  {isActive && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.unitName}>{unit.name}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                {isActive ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.endButton]}
                    onPress={handleEndSession}
                  >
                    <Ionicons name="stop-circle" size={20} color={colors.white} />
                    <Text style={styles.actionText}>End Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => handleActivateAttendance(unit)}
                    disabled={isActivating}
                  >
                    <Ionicons name="finger-print" size={20} color={colors.white} />
                    <Text style={styles.actionText}>Activate Attendance</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.materialsButton]}
                  onPress={() => Alert.alert('Materials', `Opening materials for ${unit.name}…`)}
                >
                  <Ionicons name="cloud-upload" size={20} color={colors.white} />
                  <Text style={styles.actionText}>Materials</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    padding: 25,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  subtitleText: { color: colors.white, fontSize: 14, opacity: 0.8, marginTop: 5 },
  logoutButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },

  activeBanner: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.success,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 10 },
  activeBannerTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary },
  activeBannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  endBannerButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endBannerText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },

  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
  },
  loadingText: { marginLeft: 10, color: colors.textSecondary, fontSize: 13 },

  scrollContent: { padding: 20, paddingBottom: 40 },

  unitCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: colors.secondary,
  },
  activeUnitCard: { borderLeftColor: colors.success, backgroundColor: '#f0fdf4' },

  cardHeader: { marginBottom: 15 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  unitCode: { fontSize: 14, fontWeight: 'bold', color: colors.secondary },
  activeUnitCode: { color: colors.success },
  unitName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

  liveBadge: {
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  liveBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },

  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateButton: { backgroundColor: '#2e7d32' },
  endButton: { backgroundColor: colors.error },
  materialsButton: { backgroundColor: colors.primary },
  actionText: { color: colors.white, fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
});
