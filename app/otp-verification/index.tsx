import React, { useRef, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState(true); // Simulate error for UI
  const [timer, setTimer] = useState(56);
  const router = useRouter();
  const inputRefs: React.RefObject<RNTextInput | null>[] = [
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
    useRef<RNTextInput | null>(null),
  ];

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
        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>
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
