import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SOURCES = [
  { name: 'CNBC', logo: 'https://logo.clearbit.com/cnbc.com' },
  { name: 'VICE', logo: 'https://logo.clearbit.com/vice.com' },
  { name: 'Vox', logo: 'https://logo.clearbit.com/vox.com' },
  { name: 'BBC News', logo: 'https://logo.clearbit.com/bbc.com' },
  { name: 'SCMP', logo: 'https://logo.clearbit.com/scmp.com' },
  { name: 'CNN', logo: 'https://logo.clearbit.com/cnn.com' },
  { name: 'MSN', logo: 'https://logo.clearbit.com/msn.com' },
  { name: 'CNET', logo: 'https://logo.clearbit.com/cnet.com' },
  { name: 'USA Today', logo: 'https://logo.clearbit.com/usatoday.com' },
  { name: 'TIME', logo: 'https://logo.clearbit.com/time.com' },
  { name: 'Buzzfeed', logo: 'https://logo.clearbit.com/buzzfeed.com' },
  { name: 'Daily Mail', logo: 'https://logo.clearbit.com/dailymail.co.uk' },
];

export default function ChooseNewsSource() {
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<string[]>([]);
  const router = useRouter();

  const filteredSources = SOURCES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollow = (name: string) => {
    setFollowing(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.header}>Choose your News Sources</Text>

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

      {/* Sources Grid */}
      <FlatList
        data={filteredSources}
        keyExtractor={item => item.name}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sourcesGrid}
        renderItem={({ item }) => (
          <View style={styles.sourceCard}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.sourceName}>{item.name}</Text>
            <TouchableOpacity
              style={[styles.followBtn, following.includes(item.name) && styles.followingBtn]}
              onPress={() => toggleFollow(item.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.followText, following.includes(item.name) && styles.followingText]}>
                {following.includes(item.name) ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, { opacity: following.length > 0 ? 1 : 0.5 }]}
        disabled={following.length === 0}
        onPress={() => router.push('/(tabs)')}
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
  sourcesGrid: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  sourceCard: {
    backgroundColor: '#23252B',
    borderRadius: 12,
    alignItems: 'center',
    margin: 6,
    flex: 1,
    minWidth: 90,
    maxWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 6,
    elevation: 2,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sourceName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  followBtn: {
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-in-out',
  },
  followingBtn: {
    backgroundColor: '#2563eb',
    borderWidth: 0,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  followText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    transitionProperty: 'color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-in-out',
  },
  followingText: {
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
