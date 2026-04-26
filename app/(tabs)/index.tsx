import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import {
    listenToAnyActiveSession,
    listenToStudentRecord,
    markStudentAttendance,
} from '../../src/firebase/attendanceService';
import { signOut } from '../../src/firebase/authService';
import { colors, shadowStyle } from '../../src/theme/colors';

// 1 000 m for testing — reduce to ~100 m in production
const ALLOWED_RADIUS_METERS = 1000;

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DashboardScreen() {
  const router = useRouter();
  const { currentUser, setCurrentUser, activeSession, setActiveSession } = useAttendance();

  const [isChecking,     setIsChecking]     = useState(false);
  const [statusMessage,  setStatusMessage]  = useState('Tap button to verify location');
  const [isInRange,      setIsInRange]      = useState<boolean | null>(null);
  const [alreadyMarked,  setAlreadyMarked]  = useState(false);

  // ── Real-time listener: any active session from any lecturer ─────────────
  useEffect(() => {
    const unsubscribe = listenToAnyActiveSession((session) => {
      setActiveSession(session);
      if (!session) {
        setAlreadyMarked(false);
        setStatusMessage('Tap button to verify location');
        setIsInRange(null);
      }
    });
    return unsubscribe;
  }, []);

  // ── Real-time listener: has this student already marked? ─────────────────
  useEffect(() => {
    if (!activeSession || !currentUser) return;
    const unsubscribe = listenToStudentRecord(
      activeSession.id,
      currentUser.uid,
      (marked) => setAlreadyMarked(marked)
    );
    return unsubscribe;
  }, [activeSession?.id, currentUser?.uid]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          router.replace('/');
          try {
            await signOut();
          } catch {
            // ignore
          } finally {
            setCurrentUser(null);
            setActiveSession(null);
          }
        },
      },
    ]);
  };

  // ── Mark Attendance ───────────────────────────────────────────────────────
  const handleMarkAttendance = async () => {
    if (!activeSession) {
      Alert.alert('No Active Session', 'Your lecturer has not started an attendance session yet.');
      return;
    }
    if (alreadyMarked) {
      Alert.alert('Already Signed In', `You have already marked attendance for ${activeSession.unitName}.`);
      return;
    }
    if (!currentUser) return;

    setIsChecking(true);
    setStatusMessage('Getting GPS signal…');

    try {
      // Step 1 — GPS check
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMessage('Location permission denied');
        Alert.alert('Permission Denied', 'Location access is required to mark attendance.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const distance = getDistanceInMeters(
        loc.coords.latitude,
        loc.coords.longitude,
        activeSession.classLat,
        activeSession.classLon
      );

      if (distance > ALLOWED_RADIUS_METERS) {
        setIsInRange(false);
        setStatusMessage(`Too far from class (${Math.round(distance)}m away)`);
        Alert.alert(
          'Out of Range',
          `You must be near the classroom.\nYou are ${Math.round(distance)}m away.`
        );
        return;
      }

      setStatusMessage('Location verified. Authenticating…');

      // Step 2 — Biometric check
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setStatusMessage('Biometrics unavailable');
        Alert.alert('Biometrics Unavailable', 'Set up biometrics on this device to mark attendance.');
        return;
      }

      const bio = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign into ${activeSession.unitCode} — ${activeSession.unitName}`,
        fallbackLabel: 'Use Passcode',
      });

      if (!bio.success) {
        setIsInRange(false);
        setStatusMessage('Biometric verification failed');
        Alert.alert('Authentication Failed', 'Could not verify your identity. Please try again.');
        return;
      }

      // Step 3 — Write to Firestore
      await markStudentAttendance({
        sessionId:    activeSession.id,
        studentUid:   currentUser.uid,
        studentName:  currentUser.displayName,
        studentEmail: currentUser.email,
        distanceMeters: distance,
      });

      setIsInRange(true);
      setStatusMessage(`✓ Signed in! (${Math.round(distance)}m from class)`);
      Alert.alert('✅ Attendance Marked!', `Signed into ${activeSession.unitCode} — ${activeSession.unitName}.`);
    } catch (err: any) {
      setStatusMessage('Error — please try again');
      Alert.alert('Error', err.message ?? 'Could not mark attendance.');
    } finally {
      setIsChecking(false);
    }
  };

  const calendarDays = [
    { dayName: 'Mon', date: 9,  isActive: false },
    { dayName: 'Tue', date: 10, isActive: false },
    { dayName: 'Wed', date: 11, isActive: false },
    { dayName: 'Thu', date: 12, isActive: true  },
    { dayName: 'Fri', date: 13, isActive: false },
    { dayName: 'Sat', date: 14, isActive: false },
  ];

  const buttonDisabled = isChecking || !activeSession || alreadyMarked;
  const displayName    = currentUser?.displayName ?? 'Student';

  return (
    <ScrollView style={styles.container}>
      {/* ── Top Header ──────────────────────────────────────────── */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome, {displayName}</Text>
            <Text style={styles.dateText}>April 2026</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarContainer}>
          {calendarDays.map((day, index) => (
            <View
              key={index}
              style={[styles.dayCard, day.isActive && styles.activeDayCard, day.isActive && shadowStyle]}
            >
              <Text style={[styles.dayName,   day.isActive && styles.activeDayText]}>{day.dayName}</Text>
              <Text style={[styles.dayNumber, day.isActive && styles.activeDayText]}>{day.date}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Active Session Card ──────────────────────────────────── */}
      {activeSession ? (
        <View style={[styles.activeSessionCard, shadowStyle]}>
          <View style={styles.activeSessionLeft}>
            <View style={styles.pulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeSessionTitle}>🔔 Active Attendance Session</Text>
              <Text style={styles.activeSessionUnit}>
                {activeSession.unitCode} — {activeSession.unitName}
              </Text>
              <Text style={styles.activeSessionTime}>Started at {activeSession.startedAt}</Text>
            </View>
          </View>
          {alreadyMarked && (
            <View style={styles.markedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.white} />
              <Text style={styles.markedBadgeText}>Signed In</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.noSessionCard, shadowStyle]}>
          <Ionicons name="time-outline" size={28} color={colors.textSecondary} />
          <Text style={styles.noSessionText}>No active attendance session</Text>
          <Text style={styles.noSessionSub}>Wait for your lecturer to start a session</Text>
        </View>
      )}

      {/* ── Mark Attendance Button ───────────────────────────────── */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.markButton, shadowStyle, buttonDisabled && styles.markButtonDisabled]}
          onPress={handleMarkAttendance}
          disabled={buttonDisabled}
        >
          {isChecking ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : alreadyMarked ? (
            <Text style={styles.markButtonText}>{'✓\nSigned\nIn'}</Text>
          ) : (
            <Text style={styles.markButtonText}>{'Mark\nAttendance'}</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.statusText, isInRange === false && { color: colors.error }]}>
          {isInRange === true  && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
          {isInRange === false && <Ionicons name="close-circle"     size={16} color={colors.error}   />}
          {' '}{statusMessage}
        </Text>
      </View>

      {/* ── Recent Activity ─────────────────────────────────────── */}
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        {alreadyMarked && activeSession ? (
          <View style={[styles.activityCard, shadowStyle]}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </View>
            <View style={styles.activityTextContainer}>
              <Text style={styles.activityMainText}>
                Signed In — {activeSession.unitCode} {activeSession.unitName}
              </Text>
              <Text style={styles.activitySubText}>This session</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        ) : (
          <Text style={styles.noActivityText}>No attendance marked this session</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topSection: {
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 40,
  },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: colors.white, fontSize: 16, opacity: 0.8 },
  dateText:    { color: colors.white, fontSize: 24, fontWeight: 'bold', marginVertical: 5 },
  logoutButton:{ padding: 5 },

  calendarContainer: { marginTop: 15 },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginRight: 10,
    width: 60,
  },
  activeDayCard: { backgroundColor: colors.secondary },
  dayName:       { color: colors.white, fontSize: 14, opacity: 0.8, marginBottom: 5 },
  dayNumber:     { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  activeDayText: { opacity: 1 },

  activeSessionCard: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.success,
  },
  activeSessionLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pulseDot:           { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, marginRight: 12 },
  activeSessionTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary },
  activeSessionUnit:  { fontSize: 15, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  activeSessionTime:  { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  markedBadge:        { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  markedBadgeText:    { color: colors.white, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

  noSessionCard: { backgroundColor: colors.white, marginHorizontal: 20, marginTop: 15, borderRadius: 12, padding: 20, alignItems: 'center' },
  noSessionText: { fontSize: 15, fontWeight: 'bold', color: colors.textSecondary, marginTop: 8 },
  noSessionSub:  { fontSize: 12, color: '#aaa', marginTop: 4, textAlign: 'center' },

  buttonContainer:    { alignItems: 'center', marginTop: 25, zIndex: 10 },
  markButton:         { backgroundColor: colors.secondary, width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white },
  markButtonDisabled: { backgroundColor: '#bbb' },
  markButtonText:     { color: colors.white, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  statusText:         { marginTop: 15, color: colors.textSecondary, fontWeight: '600', fontSize: 14 },

  activitySection:       { padding: 20, marginTop: 10 },
  activityTitle:         { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
  noActivityText:        { color: colors.textSecondary, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  activityCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  activityIcon:          { backgroundColor: colors.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityTextContainer: { flex: 1 },
  activityMainText:      { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  activitySubText:       { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});

