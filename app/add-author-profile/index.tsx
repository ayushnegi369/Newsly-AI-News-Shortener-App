import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AddAuthorProfile() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [followers, setFollowers] = useState('');
  const [following, setFollowing] = useState('');
  const [news, setNews] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    // Save logic here
    alert('Author profile created!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Author Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Profile Image Upload */}
        <TouchableOpacity style={styles.avatarBox} onPress={pickImage} activeOpacity={0.8}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="add" size={36} color="#aaa" />
              <Text style={styles.avatarText}>Add Profile Image</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Name */}
        <TextInput
          style={styles.input}
          placeholder="Author Name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
        {/* Bio */}
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          placeholder="Bio"
          placeholderTextColor="#aaa"
          value={bio}
          onChangeText={setBio}
          multiline
        />
        {/* Followers, Following, News */}
        <View style={styles.statsRow}>
          <TextInput
            style={[styles.input, styles.statInput]}
            placeholder="Followers"
            placeholderTextColor="#aaa"
            value={followers}
            onChangeText={setFollowers}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.statInput]}
            placeholder="Following"
            placeholderTextColor="#aaa"
            value={following}
            onChangeText={setFollowing}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.statInput]}
            placeholder="News"
            placeholderTextColor="#aaa"
            value={news}
            onChangeText={setNews}
            keyboardType="numeric"
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Create Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
  },
  avatarBox: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 60,
    width: 120,
    height: 120,
    backgroundColor: '#23252B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#23252B',
    borderRadius: 8,
    color: '#fff',
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 18,
  },
  statInput: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 