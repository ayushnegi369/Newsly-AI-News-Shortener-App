import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8080';

const saveViewedNews = async (article: any) => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    const email = userStr ? JSON.parse(userStr).email : null;
    if (!email) return;
    await fetch('http://localhost:8080/viewed-news/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: email, article })
    });
  } catch {}
};

export default function Explore() {
  useAuthGuard();
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all news
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/news`)
      .then(res => res.json())
      .then(data => setNews([...(data.trending || []), ...(data.latest || [])]))
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false));
  }, []);

  // Search news
  useEffect(() => {
    if (!search) {
      setLoading(true);
      fetch(`${API_BASE}/news`)
        .then(res => res.json())
        .then(data => setNews([...(data.trending || []), ...(data.latest || [])]))
        .catch(() => setError('Failed to load news'))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/news?q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => setNews([...(data.trending || []), ...(data.latest || [])]))
      .catch(() => setError('Failed to search news'))
      .finally(() => setLoading(false));
  }, [search]);

  const renderNewsCard = (item: any, idx: number) => (
    <TouchableOpacity key={item._id || idx} style={styles.popularCard} activeOpacity={0.9} onPress={async () => {
      await saveViewedNews(item);
      router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } });
    }}>
      <Image source={{ uri: item.image || item.urlToImage || '' }} style={styles.popularImage} />
      <View style={{ padding: 14 }}>
        <Text style={styles.popularCategory}>{item.category || item.country}</Text>
        <Text style={styles.popularHeadline}>{item.title || item.headline}</Text>
        <View style={styles.popularMetaRow}>
          <Text style={styles.popularSource}>{item.source || item.newsCompany}</Text>
          <Text style={styles.popularTime}>{item.time || item.publishedAgo}</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Explore</Text>
        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: '#23252B', color: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 40 }}
            placeholder="Search news..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading && <Text style={{ color: '#fff', textAlign: 'center' }}>Loading...</Text>}
        {error && <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>}
        {news.length === 0 && !loading ? <Text style={{ color: '#fff', textAlign: 'center' }}>No news found.</Text> : news.map(renderNewsCard)}
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