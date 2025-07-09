import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Setting() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* Options */}
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.optionIcon} />
        <Text style={styles.optionText}>Notification</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" style={styles.optionArrow} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.optionIcon} />
        <Text style={styles.optionText}>Security</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" style={styles.optionArrow} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionRow}>
        <Ionicons name="help-circle-outline" size={24} color="#fff" style={styles.optionIcon} />
        <Text style={styles.optionText}>Help</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" style={styles.optionArrow} />
      </TouchableOpacity>
      <View style={styles.optionRow}>
        <Ionicons name="moon-outline" size={24} color="#fff" style={styles.optionIcon} />
        <Text style={styles.optionText}>Dark Mode</Text>
        <View style={{ flex: 1 }} />
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#444', true: '#2563eb' }}
          thumbColor={darkMode ? '#fff' : '#888'}
        />
      </View>
      <TouchableOpacity style={styles.optionRow}>
        <MaterialIcons name="logout" size={26} color="#fff" style={styles.optionIcon} />
        <Text style={styles.optionText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232426',
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
    flex: 1,
    marginLeft: -24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 0,
    borderColor: '#333',
  },
  optionIcon: {
    marginRight: 18,
  },
  optionText: {
    color: '#fff',
    fontSize: 17,
    flex: 1,
  },
  optionArrow: {
    marginLeft: 8,
  },
});
