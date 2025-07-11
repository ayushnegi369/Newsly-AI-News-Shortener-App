import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

export default function EditProfile() {
  useAuthGuard();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (!userStr) return;
        const userObj = JSON.parse(userStr);
        setEmail(userObj.email);
        // Fetch user details from backend
        const res = await fetch(`http://localhost:8080/get-user-details?email=${encodeURIComponent(userObj.email)}`);
        if (!res.ok) throw new Error('Failed to fetch user details');
        const data = await res.json();
        setUsername(data.username || '');
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setAvatar(data.avatar || '');
      } catch (e) {
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const requestBody = { email, username, password, fullName, phone, bio, website, avatar };
    console.log('Sending update request:', requestBody);
    try {
      const res = await fetch('http://localhost:8080/update-user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      console.log('Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.log('Error response:', errorText);
        throw new Error('Failed to update user details');
      }
      setSuccess('Profile updated successfully');
      setPassword('');
      // Optionally update AsyncStorage username
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.username = username;
        await AsyncStorage.setItem('user', JSON.stringify(userObj));
      }
    } catch (e) {
      console.log('Caught error:', e);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
        <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <Image source={{ uri: avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn}>
            <Ionicons name="camera" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatar}
            onChangeText={setAvatar}
            placeholder="Avatar URL"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            editable={false}
            placeholder="Email Address"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Bio"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="Website"
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={[styles.editBtn, { margin: 16 }]} onPress={handleSave} disabled={loading}>
          <Text style={styles.editBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
        {error ? <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text> : null}
        {success ? <Text style={{ color: 'green', textAlign: 'center' }}>{success}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#23252B',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 12,
    right: width / 2 - 70 - 18, // Centered horizontally on avatar
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#181A20',
  },
  formGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    color: '#B0B3B8',
    fontSize: 15,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#23252B',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  editBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
