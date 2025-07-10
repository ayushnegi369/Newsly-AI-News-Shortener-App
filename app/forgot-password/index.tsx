import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  const handleSendOTP = async () => {
    if (!input) {
      showModal('Please enter your email');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/request-password-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input }),
      });
      if (response.ok) {
        const data = await response.json();
        showModal(data.message);
        setTimeout(() => {
          setModalVisible(false);
          router.push(('/password-reset-otp-verification?email=' + encodeURIComponent(input)) as any);
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#B0B3B8" />
        </TouchableOpacity>
        <Text style={styles.header1}>Forgot</Text>
        <Text style={styles.header2}>Password ?</Text>
        <Text style={styles.subtitle}>
          Don’t worry! it happens. Please enter the address associated with your account.
        </Text>
        <Text style={styles.label}>Email ID / Mobile number</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSendOTP}>
          <Text style={styles.submitButtonText}>Submit</Text>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 16,
    marginTop: -8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header1: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: -4,
  },
  header2: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    color: '#B0B3B8',
    fontSize: 17,
    marginBottom: 32,
  },
  label: {
    color: '#B0B3B8',
    fontSize: 16,
    marginBottom: 8,
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
  bottomButtonContainer: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  submitButton: {
    backgroundColor: '#2979FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
