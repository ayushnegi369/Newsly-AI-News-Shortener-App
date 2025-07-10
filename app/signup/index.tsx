import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '135675268993-doffv77sb4487nvkkbd00mbqpnot90nm.apps.googleusercontent.com',
    webClientId: '135675268993-tnnqtofg504b05o8rmpcv7fe0hp9m2np.apps.googleusercontent.com',
  });

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  // Handle for Google sign-in
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication, params } = response;
      const accessToken = authentication?.accessToken;
      const idToken = params?.id_token;

      let email = '';
      let name = '';

      if (idToken) {
        // Decode JWT payload
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        email = payload.email;
        name = payload.name;
      }

      console.log('Access Token:', accessToken);
      console.log('Email:', email);
      console.log('Name:', name);

      // Send name and email to backend
      if (name && email) {
        fetch('http://localhost:8080/google-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email }),
        })
          .then(async res => res.json())
          .then(async data => {
            showModal(data.message);
            setTimeout(async () => {
              setModalVisible(false);
              await AsyncStorage.setItem('user', JSON.stringify({ email, username: name, token: idToken, firstTimeLogin: true }));
              router.push('/choose-topic');
            }, 1200);
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
          })
          .catch(err => {
            showModal('Backend error');
          });
      }
    }
  }, [response]);

  // Handler for manual signup
  const handleManualSignup = async () => {
    console.log('Manual Signup Attempt:', { username, email, password, confirmPassword });
    if (!username || !email || !password || !confirmPassword) {
      showModal('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      showModal('Passwords do not match');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        showModal(data.message);
        // Navigate to signup-otp-verification page, passing email
        router.push({ pathname: '/signup-otp-verification', params: { email } });
        // Optionally clear input fields
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        const err = await response.text(); // <-- Parse as text, not JSON
        showModal(err);
      }
    } catch (err) {
      showModal('Network error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.hello}>Create</Text>
        <Text style={styles.again}>Account</Text>
        <Text style={styles.subtitle}>Sign up to get started!</Text>

        <View style={{ marginTop: 32 }}>
          <Text style={styles.label}>Username<Text style={{ color: '#2979FF' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>Email<Text style={{ color: '#2979FF' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
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

        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>Confirm Password<Text style={{ color: '#2979FF' }}>*</Text></Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm your password"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleManualSignup}>
          <Text style={styles.loginButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.orContinue}>or continue with</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={24} color="#1877F3" style={{ marginRight: 8 }} />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => promptAsync()}>
            <FontAwesome name="google" size={24} color="#EA4335" style={{ marginRight: 8 }} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signin')}>
            <Text style={styles.signupLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 0,
  },
  signupText: {
    color: '#B0B3B8',
    fontSize: 15,
  },
  signupLink: {
    color: '#2979FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
