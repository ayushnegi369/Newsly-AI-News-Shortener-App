import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const [input, setInput] = useState('');
  const router = useRouter();

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
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
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
