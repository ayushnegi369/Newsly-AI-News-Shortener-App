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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthGuard from '../hooks/useAuthGuard';

export default function AddNews() {
  useAuthGuard();
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverImage(result.assets[0].uri);
    }
  };

  // Formatting tools (for demonstration, just insert markdown-like tags)
  const format = (type: 'bold' | 'italic' | 'bullet' | 'list' | 'link') => {
    if (type === 'bold') setBody(body + '**bold**');
    if (type === 'italic') setBody(body + '*italic*');
    if (type === 'bullet') setBody(body + '\n• ');
    if (type === 'list') setBody(body + '\n1. ');
    if (type === 'link') setBody(body + '[link](url)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create News</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Cover Photo Upload */}
      <TouchableOpacity style={styles.coverPhotoBox} onPress={pickImage} activeOpacity={0.8}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.coverPhoto} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="add" size={36} color="#aaa" />
            <Text style={styles.coverText}>Add Cover Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {/* News Title */}
      <TextInput
        style={styles.titleInput}
        placeholder="News title"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
      />
      {/* News Body */}
      <TextInput
        style={styles.bodyInput}
        placeholder="Add News/Article"
        placeholderTextColor="#aaa"
        value={body}
        onChangeText={setBody}
        multiline
      />
      {/* Formatting Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => format('bold')}><Text style={styles.toolText}>B</Text></TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => format('italic')}><Text style={styles.toolText}>I</Text></TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => format('bullet')}><MaterialIcons name="format-list-bulleted" size={20} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => format('list')}><MaterialIcons name="format-list-numbered" size={20} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => format('link')}><MaterialIcons name="link" size={20} color="#fff" /></TouchableOpacity>
      </View>
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity style={styles.bottomIcon}><MaterialIcons name="text-fields" size={22} color="#aaa" /></TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon}><MaterialIcons name="format-align-left" size={22} color="#aaa" /></TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon} onPress={pickImage}><MaterialIcons name="image" size={22} color="#aaa" /></TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon}><MaterialIcons name="more-horiz" size={22} color="#aaa" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.publishBtn}>
          <Text style={styles.publishText}>Publish</Text>
        </TouchableOpacity>
      </View>
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
  coverPhotoBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#aaa',
    borderRadius: 10,
    height: 140,
    marginHorizontal: 16,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  coverText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 6,
  },
  titleInput: {
    color: '#ccc',
    fontSize: 28,
    fontWeight: '400',
    marginHorizontal: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 6,
  },
  bodyInput: {
    color: '#ccc',
    fontSize: 17,
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 80,
    borderBottomWidth: 0,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#23252B',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 6,
    justifyContent: 'flex-start',
  },
  toolBtn: {
    marginHorizontal: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toolText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingBottom: 12,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomIcon: {
    marginHorizontal: 6,
  },
  publishBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  publishText: {
    color: '#23252B',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
