import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

const topicsData = [
  {
    id: '1',
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    title: 'Health',
    description: 'Get energizing workout moves, healthy recipes...',
    saved: false,
  },
  {
    id: '2',
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    title: 'Technology',
    description: 'The application of scientific knowledge to the practi...',
    saved: true,
  },
  {
    id: '3',
    image: { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
    title: 'Art',
    description: 'Art is a diverse range of human activity, and result...',
    saved: true,
  },
];

const popularTopics = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    category: 'Europe',
    headline: 'Russian warship: Moskva sinks in Black Sea',
    source: 'BBC News',
    time: '4h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Health',
    headline: 'Get energizing workout moves, healthy recipes...',
    source: 'CNN',
    time: '2h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/CNN_International_logo.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
    category: 'Technology',
    headline: 'The application of scientific knowledge to the practi...',
    source: 'USA Today',
    time: '1h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/USA_Today_logo.svg' },
  },
];

export default function Explore() {
  const [topics, setTopics] = useState(topicsData);
  const router = useRouter();

  const toggleSave = (id: string) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, saved: !t.saved } : t));
  };

  const renderTopic = ({ item }: { item: typeof topicsData[0] }) => (
    <View style={styles.topicRow} key={item.id}>
      <Image source={item.image} style={styles.topicImage} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.topicTitle}>{item.title}</Text>
        <Text style={styles.topicDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      <TouchableOpacity
        style={[styles.saveBtn, item.saved && styles.saveBtnActive]}
        onPress={() => toggleSave(item.id)}
      >
        <Text style={[styles.saveBtnText, item.saved && styles.saveBtnTextActive]}>
          {item.saved ? 'Saved' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Explore</Text>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { marginLeft: 0 }]}>Topic</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {topics.map(topic => renderTopic({ item: topic }))}
        <Text style={styles.sectionTitle}>Popular Topic</Text>
        {popularTopics.map((item, idx) => (
          <View style={[styles.popularCard, idx === 0 && { marginTop: 16 }]} key={idx}>
            <Image source={item.image} style={styles.popularImage} />
            <View style={{ padding: 14 }}>
              <Text style={styles.popularCategory}>{item.category}</Text>
              <Text style={styles.popularHeadline}>{item.headline}</Text>
              <View style={styles.popularMetaRow}>
                <Image source={item.sourceLogo} style={styles.sourceLogo} />
                <Text style={styles.popularSource}>{item.source}</Text>
                <Text style={styles.popularTime}>{item.time}</Text>
                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: 32,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heading: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
    marginLeft: 16,
    marginBottom: 18,
    paddingTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 16, // Only left margin for alignment
    marginRight: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 16, // Add left margin for alignment with cards
    marginBottom: 8,
    marginTop: 16, // Add top margin for spacing above
  },
  seeAll: {
    color: '#B0B3B8',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topicImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  topicTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  topicDesc: {
    color: '#B0B3B8',
    fontSize: 14,
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: '#3A8FFF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  saveBtnActive: {
    backgroundColor: '#3A8FFF',
    borderColor: '#3A8FFF',
  },
  saveBtnText: {
    color: '#3A8FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveBtnTextActive: {
    color: '#fff',
  },
  popularCard: {
    backgroundColor: '#23252B',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  popularCategory: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  popularHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  popularMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sourceLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  popularSource: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  popularTime: {
    color: '#B0B3B8',
    fontSize: 13,
    marginRight: 8,
  },
});