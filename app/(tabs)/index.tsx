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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

const trendingNews = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    category: 'Europe',
    headline: 'Russian warship: Moskva sinks in Black Sea',
    source: 'BBC News',
    time: '4h ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Business',
    headline: 'Stock markets rally as tech shares surge worldwide',
    source: 'CNN Business',
    time: '2h ago',
  },
];

const latestNews = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
    category: 'Europe',
    headline: "Ukraine's President Zelensky to BBC: Blood money being paid...",
    source: 'BBC News',
    time: '14m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429' },
    category: 'Travel',
    headline: 'Her train broke down. Her phone died. And then she met her... ',
    source: 'CNN',
    time: '21m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Business',
    headline: 'Stock markets rally as tech shares surge worldwide',
    source: 'CNN Business',
    time: '2h ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e' },
    category: 'Health',
    headline: 'New health guidelines released for 2024',
    source: 'Healthline',
    time: '1h ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    category: 'Science',
    headline: 'NASA launches new Mars rover mission',
    source: 'NASA',
    time: '3h ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    category: 'Sports',
    headline: 'Champions League: Dramatic finish in semi-finals',
    source: 'ESPN',
    time: '30m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b43' },
    category: 'Politics',
    headline: 'Election results spark nationwide debate',
    source: 'Reuters',
    time: '50m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b43' },
    category: 'Lifestyle',
    headline: 'Minimalism: The new trend in urban living',
    source: 'Vogue',
    time: '2h ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Technology',
    headline: 'AI breakthroughs in 2024',
    source: 'TechCrunch',
    time: '10m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    category: 'Art',
    headline: 'Modern art exhibition opens in Paris',
    source: 'ArtDaily',
    time: '5m ago',
  },
];

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

export default function HomeScreen() {
  useAuthGuard();
  useEffect(() => {
    (async () => {
      const user = await AsyncStorage.getItem('user');
      console.log('AsyncStorage user:', user);
    })();
  }, []);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // FlatList data is just the news items
  const flatListData = latestNews;

  // Render each news item
  const renderItem = ({ item }: { item: typeof latestNews[0] }) => (
    <TouchableOpacity style={styles.latestCard} activeOpacity={0.9} onPress={() => router.push('/news-page')}>
      <Image source={item.image} style={styles.latestImage} resizeMode="cover" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText style={styles.newsCategory}>{item.category}</ThemedText>
        <ThemedText style={styles.latestHeadline} numberOfLines={2}>{item.headline}</ThemedText>
        <View style={styles.newsMetaRow}>
          <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
          <ThemedText style={styles.newsSource}>{item.source}</ThemedText>
          <ThemedText style={styles.newsTime}>{item.time}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <MaterialIcons name="more-horiz" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}> 
        <FlatList
          data={flatListData}
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
                  <TouchableOpacity key={idx} style={styles.trendingCard} activeOpacity={0.9}>
                    <Image source={item.image} style={styles.trendingImage} resizeMode="cover" />
                    <View style={{ padding: 14 }}>
                      <ThemedText style={styles.newsCategory}>{item.category}</ThemedText>
                      <ThemedText style={styles.newsHeadline} numberOfLines={2}>{item.headline}</ThemedText>
                      <View style={styles.newsMetaRow}>
                        <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
                        <ThemedText style={styles.newsSource}>{item.source}</ThemedText>
                        <ThemedText style={styles.newsTime}>{item.time}</ThemedText>
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
                <TouchableOpacity>
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