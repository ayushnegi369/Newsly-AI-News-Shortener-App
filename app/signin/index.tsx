import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Image, Modal } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  // Manual sign-in handler
  const handleManualSignIn = async () => {
    if (!email || !password) {
      showModal('Email and password are required');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        showModal(data.message);
        setTimeout(async () => {
          setModalVisible(false);
          let user = { email: data.email, username: data.username, token: data.token, firstTimeLogin: true };
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.email === data.email) user.firstTimeLogin = parsed.firstTimeLogin;
            } catch {}
          }
          await AsyncStorage.setItem('user', JSON.stringify(user));
          if (user.firstTimeLogin) router.push('/choose-topic');
          else router.push('/(tabs)');
        }, 1200);
        setEmail('');
        setPassword('');
      } else {
        const err = await response.text();
        showModal(err);
        console.log('Manual sign-in error:', err);
      }
    } catch (err) {
      showModal('Network error');
      console.log('Manual sign-in network error:', err);
    }
  };

  // Google sign-in handler (triggered by useEffect)
  useEffect(() => {
    if (response?.type === 'success') {
      const { params } = response;
      let email = '';
      let username = '';
      let idToken = '';
      if (params?.id_token) {
        idToken = params.id_token;
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
        username = payload.name;
      }
      if (email && username) {
        fetch('http://localhost:8080/google-signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: username }),
        })
          .then(async res => {
            if (res.ok) {
              const data = await res.json();
              showModal(data.message);
              setTimeout(async () => {
                setModalVisible(false);
                // Check if user is first time
                let user = { email, username, token: idToken, firstTimeLogin: true };
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                  try {
                    const parsed = JSON.parse(stored);
                    if (parsed.email === email) user.firstTimeLogin = parsed.firstTimeLogin;
                  } catch {}
                }
                await AsyncStorage.setItem('user', JSON.stringify(user));
                if (user.firstTimeLogin) router.push('/choose-topic');
                else router.push('/(tabs)');
              }, 1200);
              setEmail('');
              setPassword('');
            } else {
              const err = await res.text();
              showModal(err);
              console.log('Google sign-in error:', err);
            }
          })
          .catch(err => {
            showModal('Network error');
            console.log('Google sign-in network error:', err);
          });
      }
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.hello}>Hello</Text>
        <Text style={styles.again}>Again!</Text>
        <Text style={styles.subtitle}>Login to get started!</Text>

        <View style={{ marginTop: 32 }}>
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

        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgot}>Forgot the password ?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleManualSignIn}>
          <Text style={styles.loginButtonText}>Login</Text>
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
          <Text style={styles.signupText}>Don’t have an account ? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
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