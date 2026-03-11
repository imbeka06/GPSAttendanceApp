import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Tap button to verify location');
  const [isInRange, setIsInRange] = useState<boolean | null>(null);

  //  CLASSROOM TARGET COORDINATES
  const CLASS_LAT = -1.095333; 
  const CLASS_LON = 37.012222;
  const ALLOWED_RADIUS_METERS = 1000; // Left at 1km so you can test success from your room!

  // The Haversine Formula
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  const handleMarkAttendance = async () => {
    setIsChecking(true);
    setStatusMessage('Getting GPS signal...');
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need location access to mark attendance.');
        setIsChecking(false);
        setStatusMessage('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const distance = getDistanceInMeters(location.coords.latitude, location.coords.longitude, CLASS_LAT, CLASS_LON);

      setIsChecking(false);

      if (distance <= ALLOWED_RADIUS_METERS) {
        setIsInRange(true);
        setStatusMessage(`You are in range! (${Math.round(distance)}m away)`);
        Alert.alert("Success!", "Attendance has been officially marked.");
      } else {
        setIsInRange(false);
        setStatusMessage(`Too far from class (${Math.round(distance)}m away)`);
        Alert.alert("Out of Range", `You must be in the classroom to sign in. You are ${Math.round(distance)} meters away.`);
      }
    } catch (error) {
      setIsChecking(false);
      setStatusMessage('Error finding location');
      Alert.alert('Error', 'Could not get your location. Make sure GPS is turned on.');
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => router.replace('/') }
    ]);
  };

  // Static mock week for the Calendar UI (Centered around current date)
  const calendarDays = [
    { dayName: 'Mon', date: 9, isActive: false },
    { dayName: 'Tue', date: 10, isActive: false },
    { dayName: 'Wed', date: 11, isActive: false },
    { dayName: 'Thu', date: 12, isActive: true }, // Highlighted as today!
    { dayName: 'Fri', date: 13, isActive: false },
    { dayName: 'Sat', date: 14, isActive: false },
  ];

  return (
    <ScrollView style={styles.container}>
      
      {/* Top Green Section with Header, Logout, and Calendar */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome, Student</Text>
            <Text style={styles.dateText}>March 2026</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* The New Horizontal Calendar UI */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarContainer}>
          {calendarDays.map((day, index) => (
            <View 
              key={index} 
              style={[
                styles.dayCard, 
                day.isActive && styles.activeDayCard, 
                day.isActive && shadowStyle
              ]}
            >
              <Text style={[styles.dayName, day.isActive && styles.activeDayText]}>{day.dayName}</Text>
              <Text style={[styles.dayNumber, day.isActive && styles.activeDayText]}>{day.date}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* The Big 3D Gold Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.markButton, shadowStyle]} 
          onPress={handleMarkAttendance}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : (
            <Text style={styles.markButtonText}>Mark{'\n'}Attendance</Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.statusText, isInRange === false && { color: colors.error }]}>
          {isInRange === true && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
          {isInRange === false && <Ionicons name="close-circle" size={16} color={colors.error} />}
          {' '}{statusMessage}
        </Text>
      </View>

      {/* Recent Activity List */}
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        {[1, 2, 3].map((item, index) => (
          <View key={index} style={[styles.activityCard, shadowStyle]}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </View>
            <View style={styles.activityTextContainer}>
              <Text style={styles.activityMainText}>Signed in - Mobile Computing</Text>
              <Text style={styles.activitySubText}>10 minutes ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topSection: { backgroundColor: colors.primary, padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 40 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: colors.white, fontSize: 16, opacity: 0.8 },
  dateText: { color: colors.white, fontSize: 24, fontWeight: 'bold', marginVertical: 5 },
  logoutButton: { padding: 5 },

  calendarContainer: { marginTop: 15, flexDirection: 'row' },
  dayCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', marginRight: 10, width: 60 },
  activeDayCard: { backgroundColor: colors.secondary }, // Gold background for today
  dayName: { color: colors.white, fontSize: 14, opacity: 0.8, marginBottom: 5 },
  dayNumber: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  activeDayText: { opacity: 1 },

  buttonContainer: { alignItems: 'center', marginTop: -40, zIndex: 10 },
  markButton: { backgroundColor: colors.secondary, width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white },
  markButtonText: { color: colors.white, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  statusText: { marginTop: 15, color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  
  activitySection: { padding: 20, marginTop: 10 },
  activityTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  activityIcon: { backgroundColor: colors.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityTextContainer: { flex: 1 },
  activityMainText: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  activitySubText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});