import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showModal('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      showModal('Passwords do not match');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      if (response.ok) {
        const data = await response.json();
        showModal(data.message);
        setTimeout(() => {
          setModalVisible(false);
          router.push('/signin');
        }, 1200);
      } else {
        const err = await response.text();
        showModal(err);
      }
    } catch (err) {
      showModal('Network error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password for {email}</Text>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#23262B', padding: 24, borderRadius: 12, alignItems: 'center', maxWidth: 320 }}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#2979FF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    flex: 1,
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    color: '#B0B3B8',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    color: '#B0B3B8',
    fontSize: 16,
    marginBottom: 4,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#23262B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 0,
    width: '100%',
    minHeight: 52,
    maxHeight: 52,
  },
  resetButton: {
    backgroundColor: '#2979FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
