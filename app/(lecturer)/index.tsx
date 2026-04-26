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
import {
    endAttendanceSession,
    listenToLecturerActiveSession,
    startAttendanceSession,
} from '../../src/firebase/attendanceService';
import { signOut } from '../../src/firebase/authService';
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
  const { currentUser, setCurrentUser, activeSession, setActiveSession } = useAttendance();
  const [isActivating, setIsActivating] = useState(false);

  // Staggered slide-in animations
  const slideAnims  = useRef(LECTURER_UNITS.map(() => new Animated.Value(50))).current;
  const opacityAnims = useRef(LECTURER_UNITS.map(() => new Animated.Value(0))).current;

  // ── Run entrance animations once ─────────────────────────────────────────
  useEffect(() => {
    const animations = LECTURER_UNITS.map((_, i) =>
      Animated.parallel([
        Animated.timing(slideAnims[i],  { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacityAnims[i], { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    Animated.stagger(80, animations).start();
  }, []);

  // ── Real-time Firestore listener for this lecturer's active session ───────
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenToLecturerActiveSession(currentUser.uid, (session) => {
      setActiveSession(session);
    });
    return unsubscribe;
  }, [currentUser]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            // ignore sign-out errors
          } finally {
            setCurrentUser(null);
            setActiveSession(null);
          }
        },
      },
    ]);
  };

  // ── Activate attendance for a unit ────────────────────────────────────────
  const handleActivateAttendance = async (unit: (typeof LECTURER_UNITS)[0]) => {
    if (activeSession) {
      Alert.alert(
        'Session Already Active',
        `"${activeSession.unitCode}" is already running. End it before starting another.`
      );
      return;
    }
    if (!currentUser) return;

    setIsActivating(true);
    try {
      // Step 1 — Biometric auth
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometrics Unavailable', 'Set up biometrics on your device to activate attendance.');
        return;
      }

      const bio = await LocalAuthentication.authenticateAsync({
        promptMessage: `Activate attendance — ${unit.code} ${unit.name}`,
        fallbackLabel: 'Use Passcode',
      });

      if (!bio.success) {
        Alert.alert('Authentication Failed', 'Biometric check failed. Attendance not activated.');
        return;
      }

      // Step 2 — Capture GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Denied', 'Location access is required to pin the classroom.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });

      // Step 3 — Write session to Firestore
      await startAttendanceSession({
        unitId:       unit.id,
        unitCode:     unit.code,
        unitName:     unit.name,
        classLat:     loc.coords.latitude,
        classLon:     loc.coords.longitude,
        lecturerId:   currentUser.uid,
        lecturerName: currentUser.displayName,
      });

      Alert.alert(
        '✅ Attendance Activated!',
        `Students can now sign in for ${unit.code} — ${unit.name}.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    } finally {
      setIsActivating(false);
    }
  };

  // ── End active session ────────────────────────────────────────────────────
  const handleEndSession = () => {
    if (!activeSession) return;
    Alert.alert(
      'End Session',
      `End attendance for ${activeSession.unitCode} — ${activeSession.unitName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await endAttendanceSession(activeSession.id);
              // Firestore listener will automatically clear activeSession
            } catch {
              Alert.alert('Error', 'Could not end the session. Try again.');
            }
          },
        },
      ]
    );
  };

  const displayName = currentUser?.displayName ?? 'Lecturer';

  return (
    <View style={styles.container}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {displayName}</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>🟢 Attendance Active</Text>
              <Text style={styles.activeBannerSub} numberOfLines={1}>
                {activeSession.unitCode} · Started {activeSession.startedAt}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.endBannerButton} onPress={handleEndSession}>
            <Text style={styles.endBannerText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Activating Indicator ─────────────────────────────────── */}
      {isActivating && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying identity & capturing class location…</Text>
        </View>
      )}

      {/* ── Unit Cards ───────────────────────────────────────────── */}
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

              <View style={styles.buttonRow}>
                {isActive ? (
                  <TouchableOpacity style={[styles.actionButton, styles.endButton]} onPress={handleEndSession}>
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
  welcomeText:  { color: colors.white, fontSize: 22, fontWeight: 'bold' },
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
  activeBannerLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activeDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 10 },
  activeBannerTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary },
  activeBannerSub:   { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  endBannerButton:   { backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  endBannerText:     { color: colors.white, fontWeight: 'bold', fontSize: 13 },

  loadingBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9e6', marginHorizontal: 20, marginTop: 10, borderRadius: 10, padding: 12 },
  loadingText: { marginLeft: 10, color: colors.textSecondary, fontSize: 13 },

  scrollContent: { padding: 20, paddingBottom: 40 },

  unitCard:       { backgroundColor: colors.white, borderRadius: 15, padding: 20, marginBottom: 20, borderLeftWidth: 6, borderLeftColor: colors.secondary },
  activeUnitCard: { borderLeftColor: colors.success, backgroundColor: '#f0fdf4' },

  cardHeader:     { marginBottom: 15 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  unitCode:       { fontSize: 14, fontWeight: 'bold', color: colors.secondary },
  activeUnitCode: { color: colors.success },
  unitName:       { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

  liveBadge:     { backgroundColor: colors.success, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10 },
  liveBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },

  buttonRow:       { flexDirection: 'row', gap: 10 },
  actionButton:    { flex: 1, flexDirection: 'row', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  activateButton:  { backgroundColor: '#2e7d32' },
  endButton:       { backgroundColor: colors.error },
  materialsButton: { backgroundColor: colors.primary },
  actionText:      { color: colors.white, fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
});

