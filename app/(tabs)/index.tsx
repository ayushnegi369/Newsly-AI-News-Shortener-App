import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const categories = [
  'All',
  'Sports',
  'Politics',
  'Business',
  'Health',
  'Travel',
  'Science',
  'Lifestyle',
  'Technology',
  'Art',
];

// Utility to format published time as 'Xh ago' or 'Xm ago'
function formatTimeAgo(dateString: string): string {
  const published = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }
}

// Helper to save viewed news
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

export default function HomeScreen() {
  useAuthGuard();
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const searchTimeout = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Helper to get backend category param
  const getBackendCategory = (cat: string) => {
    if (cat === 'All') return '';
    return cat.toLowerCase();
  };

  // Fetch news with optional search and category
  const fetchNews = async (opts?: { q?: string; category?: string }) => {
    setLoading(true);
    setError(null);
    try {
      let url = 'http://localhost:8080/news?';
      if (opts?.q) url += `q=${encodeURIComponent(opts.q)}&`;
      if (opts?.category && opts.category !== 'All') url += `category=${encodeURIComponent(getBackendCategory(opts.category))}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setTrendingNews(data.trending || []);
      setLatestNews(data.latest || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching news');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNews();
  }, []);

  // Handle search input with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchNews({ q: search, category: selectedCategory });
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  // Handle category change
  useEffect(() => {
    fetchNews({ q: search, category: selectedCategory });
  }, [selectedCategory]);

  // FlatList data is just the news items
  const flatListData = latestNews;

  // Render each news item
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.latestCard} activeOpacity={0.9} onPress={async () => {
      await saveViewedNews(item);
      router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } });
    }}>
      <Image source={{ uri: item.image }} style={styles.latestImage} resizeMode="cover" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText style={styles.newsCategory}>{item.country}</ThemedText>
        <ThemedText style={styles.latestHeadline} numberOfLines={2}>{item.title}</ThemedText>
        <View style={styles.newsMetaRow}>
          <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
          <ThemedText style={styles.newsSource}>{item.newsCompany}</ThemedText>
          <ThemedText style={styles.newsTime}>{item.publishedAgo}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <MaterialIcons name="more-horiz" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#2979FF" />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}> 
        <FlatList
          data={latestNews}
          renderItem={renderItem}
          keyExtractor={(_, idx) => idx.toString()}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View style={styles.headerRow}>
                <ThemedText style={styles.logoText} type="title">NEWSLY</ThemedText>
                <TouchableOpacity style={styles.lockIcon}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {/* Search Bar */}
              <TouchableOpacity style={styles.searchContainer} activeOpacity={0.8} onPress={() => router.push('/search-section')}>
                <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                <Text style={styles.searchInput}>Search</Text>
                <TouchableOpacity>
                  <MaterialIcons name="tune" size={22} color="#888" />
                </TouchableOpacity>
              </TouchableOpacity>
              {/* Category Tabs - now directly below search bar */}
              <View style={{ backgroundColor: '#181A20' }} className="this-section">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>{cat}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Trending Section */}
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.sectionTitle} type="subtitle">Trending</ThemedText>
                <TouchableOpacity onPress={() => router.push('/(tabs)/trending' as any)}>
                  <ThemedText style={styles.seeAll}>See all</ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll} contentContainerStyle={{ paddingLeft: 18, paddingRight: 4 }}>
                {trendingNews.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.trendingCard} activeOpacity={0.9} onPress={async () => {
                    await saveViewedNews(item);
                    router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } });
                  }}>
                    <Image source={{ uri: item.image }} style={styles.trendingImage} resizeMode="cover" />
                    <View style={{ padding: 14 }}>
                      <ThemedText style={styles.newsCategory}>{item.country}</ThemedText>
                      <ThemedText style={styles.newsHeadline} numberOfLines={2}>{item.title}</ThemedText>
                      <View style={styles.newsMetaRow}>
                        <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
                        <ThemedText style={styles.newsSource}>{item.newsCompany}</ThemedText>
                        <ThemedText style={styles.newsTime}>{item.publishedAgo}</ThemedText>
                        <TouchableOpacity style={{ marginLeft: 'auto' }}>
                          <MaterialIcons name="more-horiz" size={20} color="#888" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Latest Section */}
              <View style={styles.latestSectionHeaderRow}>
                <ThemedText style={styles.sectionTitle} type="subtitle">Latest</ThemedText>
                <TouchableOpacity onPress={() => router.push('./latest-news')}>
                  <ThemedText style={styles.seeAll}>See all</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 20,
    marginBottom: 8,
  },
  logoText: {
    color: '#2979FF',
    fontWeight: 'bold',
    fontSize: 32,
    letterSpacing: 2,
    marginRight: 8,
  },
  lockIcon: {
    backgroundColor: '#23252B',
    borderRadius: 10,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  latestSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 28,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  seeAll: {
    color: '#B0B3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  trendingScroll: {
    marginBottom: 18,
    marginTop: 2,
  },
  trendingCard: {
    backgroundColor: '#23252B',
    borderRadius: 16,
    marginRight: 14,
    width: width * 0.7,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: width * 0.42,
    backgroundColor: '#222',
  },
  newsCategory: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  newsHeadline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  newsMetaRow: {
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
  categoryTabs: {
    flexGrow: 0,
    marginLeft: 8,
    marginBottom: 16,
    marginTop: 2,
    minHeight: 38,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    backgroundColor: 'transparent',
  },
  categoryTabText: {
    color: '#B0B3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 10,
    overflow: 'hidden',
  },
  latestImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  latestHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
});