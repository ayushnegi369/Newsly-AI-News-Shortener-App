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

const { width } = Dimensions.get('window');

export default function EditProfile() {
  const router = useRouter();
  const [username, setUsername] = useState('wilsonfranci');
  const [fullName, setFullName] = useState('Wilson Franci');
  const [email, setEmail] = useState('example@youremail.com');
  const [phone, setPhone] = useState('+62-8421-4512-2531');
  const [bio, setBio] = useState('Lorem Ipsum is simply dummy text of the printing');
  const [website, setWebsite] = useState('https://yourwebsite.com');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity>
          <Ionicons name="checkmark" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn}>
            <Ionicons name="camera" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Form */}
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
          <Text style={styles.label}>Email Address<Text style={{ color: '#ff5a5f' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number<Text style={{ color: '#ff5a5f' }}>*</Text></Text>
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
});
