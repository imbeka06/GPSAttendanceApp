import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      
      {/* Top Green Section (Calendar Placeholder) */}
      <View style={styles.topSection}>
        <Text style={styles.welcomeText}>Welcome, Student</Text>
        <Text style={styles.dateText}>March 2026</Text>
        {/* We will add a real calendar component here later */}
        <View style={styles.calendarPlaceholder}>
           <Text style={styles.calendarText}>Calendar View Goes Here</Text>
        </View>
      </View>

      {/* The Big 3D Gold Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.markButton, shadowStyle]}>
          <Text style={styles.markButtonText}>Mark{'\n'}Attendance</Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} /> You are in the classroom range
        </Text>
      </View>

      {/* Recent Activity List */}
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        
        {[1, 2, 3].map((item, index) => (
          <View key={index} style={styles.activityCard}>
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
  markButton: { 
    backgroundColor: colors.secondary, 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  markButtonText: { color: colors.white, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  statusText: { marginTop: 15, color: colors.success, fontWeight: '600', fontSize: 14 },

  activitySection: { padding: 20, marginTop: 10 },
  activityTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: 12, marginBottom: 10, ...shadowStyle, elevation: 2 },
  activityIcon: { backgroundColor: colors.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityTextContainer: { flex: 1 },
  activityMainText: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  activitySubText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});