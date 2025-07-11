import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const bookmarkData = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Europe',
    headline: "Ukraine's President Zelensky to BBC: Blood money being paid...",
    source: 'BBC News',
    time: '14m ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    category: 'Travel',
    headline: 'Her train broke down. Her phone died. And then she met her...',
    source: 'CNN',
    time: '1h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/CNN_International_logo.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    category: 'Europe',
    headline: 'Russian warship: Moskva sinks in Black Sea',
    source: 'BBC News',
    time: '4h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
    category: 'Money',
    headline: 'Wind power produced more electricity than coal and nuc...',
    source: 'USA Today',
    time: '4h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/USA_Today_logo.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b43' },
    category: 'Life',
    headline: "'We keep rising to new challenges:' For churches hit...",
    source: 'USA Today',
    time: '4h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/USA_Today_logo.svg' },
  },
];

const API_BASE = 'http://localhost:8080';

export default function Bookmark() {
  useAuthGuard();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user email from AsyncStorage
  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      let email = null;
      try {
        const userObj = userStr ? JSON.parse(userStr) : null;
        email = userObj?.email || null;
      } catch {}
      setUser(email);
    })();
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bookmarks/list?user=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch {
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      let email = null;
      try {
        const userObj = userStr ? JSON.parse(userStr) : null;
        email = userObj?.email || null;
      } catch {}
      setUser(email);
      if (email) fetchBookmarks(email);
    })();
  }, []);

  // Remove bookmark
  const removeBookmark = async (article: any) => {
    if (!user) return;
    setLoading(true);
    fetch(`${API_BASE}/bookmarks/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, articleId: article.url || article._id })
    })
      .then(res => res.json())
      .then(() => setBookmarks(bms => bms.filter(bm => (bm.url || bm._id) !== (article.url || article._id))))
      .catch(() => setError('Failed to remove bookmark'))
      .finally(() => setLoading(false));
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } })}>
      <Image source={{ uri: item.image || item.urlToImage || '' }} style={styles.image} resizeMode="cover" />
      <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12, flex: 1 }}>
        <ThemedText style={styles.category}>{item.category || item.country}</ThemedText>
        <ThemedText style={styles.headline}>{item.title || item.headline}</ThemedText>
        <View style={styles.metaRow}>
          <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
          <ThemedText style={styles.source}>{item.newsCompany || item.source}</ThemedText>
          <ThemedText style={styles.time}>{item.publishedAgo || item.time}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => removeBookmark(item)}>
            <Ionicons name="bookmark" size={20} color="#E5397B" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText style={styles.heading}>Bookmark</ThemedText>
      {/* Search Bar (optional, not implemented) */}
      {loading && <Text style={{ color: '#fff', textAlign: 'center', marginTop: 24 }}>Loading...</Text>}
      {error && <Text style={{ color: 'red', textAlign: 'center', marginTop: 24 }}>{error}</Text>}
      {!loading && bookmarks.length === 0 && <Text style={{ color: '#fff', textAlign: 'center', marginTop: 24 }}>No data available</Text>}
      <FlatList
        data={bookmarks}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 12 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: 48, // Increased top margin
  },
  heading: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
    marginLeft: 16, // Reduced horizontal margin
    marginBottom: 18,
    paddingTop: 16, // Use padding from top instead of margin
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 16, // Reduced horizontal margin
    marginBottom: 14,
    padding: 10,
    overflow: 'hidden',
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  newsCategory: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  newsHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  newsMetaRow: {
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
  newsSource: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  newsTime: {
    color: '#B0B3B8',
    fontSize: 13,
    marginRight: 8,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 10,
    marginHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    paddingVertical: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  category: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  headline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sourceIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  source: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  time: {
    color: '#B0B3B8',
    fontSize: 13,
    marginRight: 8,
  },
});