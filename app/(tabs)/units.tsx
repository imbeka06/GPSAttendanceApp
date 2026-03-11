import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadowStyle } from '../../src/theme/colors';

export default function UnitsScreen() {
  const router = useRouter();

  // Mock data for the units a student is taking
  const myUnits = [
    { id: '1', name: 'Mobile Computing' },
    { id: '2', name: 'Database Systems' },
    { id: '3', name: 'Software Engineering' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>My Enrolled Units</Text>

      {myUnits.map((unit) => (
        <View key={unit.id} style={[styles.unitCard, shadowStyle]}>
          <Text style={styles.unitName}>{unit.name}</Text>
          
          <View style={styles.buttonRow}>
            {/* Study Materials Button */}
            <TouchableOpacity style={[styles.actionButton, shadowStyle]}>
              <Ionicons name="document-text" size={24} color={colors.white} />
              <Text style={styles.actionText}>Materials</Text>
            </TouchableOpacity>

            {/* Class Chat Button (NOW WIRED UP!) */}
            <TouchableOpacity 
              style={[styles.actionButton, shadowStyle]}
              onPress={() => router.push({ pathname: '/chat', params: { unitName: unit.name } })}
            >
              <Ionicons name="chatbubbles" size={24} color={colors.white} />
              <Text style={styles.actionText}>Class Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: 20 },
  unitCard: { 
    backgroundColor: colors.white, 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: colors.primary 
  },
  unitName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { 
    flex: 1, 
    backgroundColor: colors.secondary, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginHorizontal: 5 
  },
  actionText: { color: colors.white, fontWeight: 'bold', marginTop: 5 },
});