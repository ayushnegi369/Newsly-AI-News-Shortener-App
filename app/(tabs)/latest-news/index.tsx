import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import useAuthGuard from '@/app/hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LatestNewsScreen() {
  useAuthGuard();
  const router = useRouter();
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8080/news');
        if (!res.ok) throw new Error('Failed to fetch latest news');
        const data = await res.json();
        setLatestNews(data.latest || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching news');
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={async () => {
      await saveViewedNews(item);
      router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } });
    }}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12 }}>
        <ThemedText style={styles.category}>{item.country}</ThemedText>
        <ThemedText style={styles.headline}>{item.title}</ThemedText>
        <View style={styles.metaRow}>
          <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
          <ThemedText style={styles.source}>{item.newsCompany}</ThemedText>
          <ThemedText style={styles.time}>{item.publishedAgo}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <MaterialIcons name="more-horiz" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} type="subtitle">Latest News</ThemedText>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>
      ) : (
        <FlatList
          data={latestNews}
          renderItem={renderItem}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 18,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    marginLeft: -32, // visually center between icons
  },
  card: {
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: width * 0.38,
    backgroundColor: '#222',
  },
  category: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  headline: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
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