import React, { useRef, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, TextInput as RNTextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PasswordResetOTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendDisabled, setResendDisabled] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const inputRefs: React.RefObject<RNTextInput | null>[] = [
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
  ];
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Timer effect
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text: string, idx: number) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[idx] = text;
      setOtp(newOtp);
      if (text && idx < 3) {
        inputRefs[idx + 1].current?.focus();
      }
      if (!text && idx > 0) {
        inputRefs[idx - 1].current?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  };

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError(true);
      showModal('Please enter the 4-digit OTP');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/verify-password-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });
      if (response.ok) {
        setError(false);
        const data = await response.json();
        showModal(data.message);
        setTimeout(() => {
          setModalVisible(false);
          router.push(('/reset-password?email=' + encodeURIComponent(email as string)) as any);
        }, 1200);
      } else {
        setError(true);
        const err = await response.text();
        showModal(err);
      }
    } catch (err) {
      setError(true);
      showModal('Network error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: '#181B20', flex: 1 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#B0B3B8" />
        </TouchableOpacity>
        <Text style={styles.header}>OTP Verification</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to +67-1234-5678-9</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={inputRefs[idx]}
              style={[styles.otpInput, error && styles.otpInputError]}
              value={digit}
              onChangeText={text => handleChange(text, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              placeholder=""
              placeholderTextColor="#888"
              selectionColor="#2979FF"
              autoFocus={idx === 0}
              returnKeyType={idx === otp.length - 1 ? 'done' : 'next'}
              blurOnSubmit={idx === otp.length - 1}
            />
          ))}
        </View>
        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>Invalid OTP</Text>
          </View>
        )}
        <Text style={styles.resendText}>
          Resend code in <Text style={styles.resendTime}>{timer}s</Text>
        </Text>
      </View>
      <View style={[styles.bottomButtonContainer, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify</Text>
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
    marginTop: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#23262B',
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  otpInputError: {
    borderColor: '#E5397B',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 0,
  },
  errorText: {
    color: '#E5397B',
    fontSize: 15,
    marginLeft: 4,
  },
  resendText: {
    color: '#B0B3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  resendTime: {
    color: '#E5397B',
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  verifyButton: {
    backgroundColor: '#2979FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
