import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.hello}>Hello</Text>
        <Text style={styles.again}>Again!</Text>
        <Text style={styles.subtitle}>Login to get started!</Text>

        <View style={{ marginTop: 32 }}>
          <Text style={styles.label}>Username<Text style={{ color: '#2979FF' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={text => setUsername(text)}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>Password<Text style={{ color: '#2979FF' }}>*</Text></Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgot}>Forgot the password ?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.orContinue}>or continue with</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={24} color="#1877F3" style={{ marginRight: 8 }} />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={24} color="#EA4335" style={{ marginRight: 8 }} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
        </View> 

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don’t have an account ? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 32,
    flex: 1,
  },
  hello: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  again: {
    color: '#2979FF',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: -8,
  },
  subtitle: {
    color: '#B0B3B8',
    fontSize: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    color: '#B0B3B8',
    fontSize: 16,
    marginBottom: 4,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23262B',
    borderRadius: 8,
  },
  eyeIcon: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  forgot: {
    color: '#2979FF',
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#2979FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orContinue: {
    color: '#B0B3B8',
    textAlign: 'center',
    marginVertical: 18,
    fontSize: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23262B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  socialText: {
    color: '#B0B3B8',
    fontSize: 17,
    fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signupText: {
    color: '#B0B3B8',
    fontSize: 16,
  },
  signupLink: {
    color: '#2979FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#2979FF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181B20',
  },
  checkedBox: {
    width: 12,
    height: 12,
    backgroundColor: '#2979FF',
    borderRadius: 2,
  },
});