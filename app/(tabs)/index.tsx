import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function DashboardScreen() {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Tap button to verify location');
  const [isInRange, setIsInRange] = useState<boolean | null>(null);

  // --- CLASSROOM TARGET COORDINATES (Set to Juja / JKUAT roughly) ---
  const CLASS_LAT = -1.095333; 
  const CLASS_LON = 37.012222;
  const ALLOWED_RADIUS_METERS = 100; // You must be within 100 meters

  // The Haversine Formula: Calculates distance between two GPS coordinates
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
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
      // 1. Ask for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need location access to mark attendance.');
        setIsChecking(false);
        setStatusMessage('Location permission denied');
        return;
      }

      // 2. Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      // 3. Calculate distance
      const distance = getDistanceInMeters(
        location.coords.latitude, 
        location.coords.longitude, 
        CLASS_LAT, 
        CLASS_LON
      );

      setIsChecking(false);

      // 4. Check if within radius
      if (distance <= ALLOWED_RADIUS_METERS) {
        setIsInRange(true);
        setStatusMessage(`You are in range! (${Math.round(distance)}m away)`);
        Alert.alert("Success!", "Attendance has been officially marked.");
        // Here you would eventually send a success message to a database
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.welcomeText}>Welcome, Student</Text>
        <Text style={styles.dateText}>March 2026</Text>
        <View style={styles.calendarPlaceholder}>
           <Text style={styles.calendarText}>Calendar View Goes Here</Text>
        </View>
      </View>

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
        
        <Text style={[
          styles.statusText, 
          isInRange === false && { color: colors.error } // Turns red if out of bounds
        ]}>
          {isInRange === true && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
          {isInRange === false && <Ionicons name="close-circle" size={16} color={colors.error} />}
          {' '}{statusMessage}
        </Text>
      </View>

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
  welcomeText: { color: colors.white, fontSize: 16, opacity: 0.8 },
  dateText: { color: colors.white, fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  calendarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 30, borderRadius: 15, alignItems: 'center' },
  calendarText: { color: colors.white, fontWeight: '600' },
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