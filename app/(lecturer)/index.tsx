import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function LecturerDashboard() {
  const router = useRouter();

  const lecturerUnits = [
    { id: '1', code: 'ICS 2201', name: 'Object Oriented Programming' },
    { id: '2', code: 'ICS 2202', name: 'Database Systems' },
    { id: '3', code: 'ICS 2203', name: 'Mobile Computing' },
    { id: '4', code: 'ICS 2204', name: 'Data Structures' },
    { id: '5', code: 'ICS 2205', name: 'Operating Systems' },
    { id: '6', code: 'ICS 2206', name: 'Software Engineering' },
    { id: '7', code: 'ICS 2207', name: 'Computer Networks' },
    { id: '8', code: 'ICS 2208', name: 'Artificial Intelligence' },
  ];

  // Animation values for the 8 cards
  const slideAnims = useRef(lecturerUnits.map(() => new Animated.Value(50))).current;
  const opacityAnims = useRef(lecturerUnits.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered animation: making cards slide up and fade in one by one
    const animations = lecturerUnits.map((_, index) => {
      return Animated.parallel([
        Animated.timing(slideAnims[index], { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacityAnims[index], { toValue: 1, duration: 400, useNativeDriver: true })
      ]);
    });
    Animated.stagger(100, animations).start();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        // Fixing Using push instead of replace, or routing to the exact file path
        onPress: () => router.push('/' as any) 
      }
    ]);
  };

  const handleAction = (action: string, unitName: string) => {
    Alert.alert(action, `Opening ${action} for ${unitName}...`);
    // Here we will eventually route them to the specific unit's management screen
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, Dr. Kamau</Text>
          <Text style={styles.subtitleText}>Your Assigned Units</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {lecturerUnits.map((unit, index) => (
          <Animated.View 
            key={unit.id} 
            style={[
              styles.unitCard, 
              shadowStyle, 
              { opacity: opacityAnims[index], transform: [{ translateY: slideAnims[index] }] }
            ]}
          >
            <View style={styles.unitHeader}>
              <Text style={styles.unitCode}>{unit.code}</Text>
              <Text style={styles.unitName}>{unit.name}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('Attendance', unit.name)}>
                <Ionicons name="people" size={20} color={colors.white} />
                <Text style={styles.actionText}>Attendance</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => handleAction('Post Materials', unit.name)}>
                <Ionicons name="cloud-upload" size={20} color={colors.white} />
                <Text style={styles.actionText}>Materials</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 25, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  welcomeText: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  subtitleText: { color: colors.white, fontSize: 14, opacity: 0.8, marginTop: 5 },
  logoutButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  unitCard: { backgroundColor: colors.white, borderRadius: 15, padding: 20, marginBottom: 20, borderLeftWidth: 6, borderLeftColor: colors.secondary },
  unitHeader: { marginBottom: 15 },
  unitCode: { fontSize: 14, fontWeight: 'bold', color: colors.secondary, marginBottom: 4 },
  unitName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', backgroundColor: colors.secondary, padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  actionText: { color: colors.white, fontWeight: 'bold', marginLeft: 8 },
});