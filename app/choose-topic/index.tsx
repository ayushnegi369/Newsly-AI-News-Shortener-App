import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOPICS = [
  'National',
  'International',
  'Sport',
  'Lifestyle',
  'Business',
  'Health',
  'Fashion',
  'Technology',
  'Science',
  'Art',
  'Politics',
];

export default function ChooseTopic() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const filteredTopics = TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  const toggleTopic = (topic: string) => {
    setSelected(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleNext = async () => {
    if (selected.length === 0) return;
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && user.email) {
        await fetch('http://localhost:8080/update-user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, categories: selected }),
        });
      }
    } catch (err) {
      // Optionally handle error
    }
    router.push('/choose-news-source');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.header}>Choose your Topics</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
      </View>

      {/* Topics Grid */}
      <View style={styles.topicsGrid}>
        {filteredTopics.map(topic => (
          <TouchableOpacity
            key={topic}
            style={[styles.topicBtn, selected.includes(topic) && styles.topicBtnSelected]}
            onPress={() => toggleTopic(topic)}
            activeOpacity={0.7}
          >
            <Text style={[styles.topicText, selected.includes(topic) && styles.topicTextSelected]}>{topic}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, { opacity: selected.length > 0 ? 1 : 0.5 }]}
        disabled={selected.length === 0}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  backArrow: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 2,
    padding: 4,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  topicBtn: {
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 4,
    marginRight: 4,
    backgroundColor: 'transparent',
  },
  topicBtnSelected: {
    backgroundColor: '#2563eb',
  },
  topicText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  topicTextSelected: {
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 'auto',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
