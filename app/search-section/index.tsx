import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ScrollView,
  Keyboard,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import { useEffect } from 'react';

const TABS = ['News', 'Topics', 'Author'];

const newsData = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    category: 'Europe',
    headline: "Ukraine's President Zelensky to BBC: Blood money being paid...",
    source: 'BBC News',
    time: '14m ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    category: 'Travel',
    headline: 'Russian warship: Moskva sinks in Black Sea',
    source: 'BBC News',
    time: '1h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    category: 'Travel',
    headline: 'Her train broke down. Her phone died. And then she met her ...',
    source: 'CNN',
    time: '1h ago',
    sourceLogo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/CNN_International_logo.svg' },
  },
];

const topicsData = [
  {
    image: { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    title: 'Health',
    desc: 'View the latest health news and explore articles on...',
    saved: false,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    title: 'Technology',
    desc: "The latest tech news about the world's best hardware...",
    saved: true,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    title: 'Art',
    desc: 'The Art Newspaper is the journal of record for...',
    saved: true,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
    title: 'Politics',
    desc: 'Opinion and analysis of American and global politi...',
    saved: false,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b43' },
    title: 'Sport',
    desc: 'Sports news and live sports coverage including scores..',
    saved: false,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
    title: 'Travel',
    desc: 'The latest travel news on the most significant developm...',
    saved: false,
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    title: 'Money',
    desc: 'The latest breaking financial news on the US and world...',
    saved: false,
  },
];

const authorData = [
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg' },
    name: 'BBC News',
    followers: '1.2M',
    following: true,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/CNN_International_logo.svg' },
    name: 'CNN',
    followers: '959K',
    following: false,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Vox_logo_2014.svg' },
    name: 'Vox',
    followers: '452K',
    following: true,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/USA_Today_logo.svg' },
    name: 'USA Today',
    followers: '325K',
    following: true,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/CNBC_logo.svg' },
    name: 'CNBC',
    followers: '21K',
    following: false,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/20/CNET_logo.svg' },
    name: 'CNET',
    followers: '18K',
    following: false,
  },
  {
    logo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/4/44/MSN_logo.svg' },
    name: 'MSN',
    followers: '15K',
    following: false,
  },
];

export default function SearchSection() {
  useAuthGuard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('News');
  const [search, setSearch] = useState('');
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchNews();
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeTab]);

  const fetchNews = () => {
    if (activeTab === 'News' || activeTab === 'Author' || activeTab === 'Topics') {
      setLoading(true);
      setError(null);
      let url = 'http://localhost:8080/news?';
      if (search) url += `q=${encodeURIComponent(search)}&`;
      if (activeTab === 'Topics' && search) url += `category=${encodeURIComponent(search.toLowerCase())}&`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch news');
          return res.json();
        })
        .then(data => {
          let allNews = [...(data.trending || []), ...(data.latest || [])];
          if (activeTab === 'Author' && search) {
            allNews = allNews.filter(n => n.newsCompany && n.newsCompany.toLowerCase().includes(search.toLowerCase()));
          }
          if (activeTab === 'Topics' && search) {
            allNews = allNews.filter(n => n.country && n.country.toLowerCase().includes(search.toLowerCase()));
          }
          setNewsResults(allNews);
        })
        .catch(err => setError(err.message || 'Error fetching news'))
        .finally(() => setLoading(false));
    }
  };

  const renderNews = () => (
    <FlatList
      data={newsResults}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item }) => (
        <View style={styles.newsCard}>
          <Image source={{ uri: item.image }} style={styles.newsImage} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <ThemedText style={styles.newsCategory}>{item.country}</ThemedText>
            <ThemedText style={styles.newsHeadline} numberOfLines={2}>{item.title}</ThemedText>
            <View style={styles.newsMetaRow}>
              <Image source={require('@/assets/images/favicon.png')} style={styles.sourceLogo} />
              <ThemedText style={styles.newsSource}>{item.newsCompany}</ThemedText>
              <ThemedText style={styles.newsTime}>{item.publishedAgo}</ThemedText>
              <TouchableOpacity style={{ marginLeft: 'auto' }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      style={{ marginTop: 12 }}
      ListEmptyComponent={loading ? null : <Text style={{ color: '#fff', textAlign: 'center', marginTop: 24 }}>No results found.</Text>}
    />
  );

  const renderTopics = () => (
    <FlatList
      data={topicsData}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item }) => (
        <View style={styles.topicCard}>
          <Image source={item.image} style={styles.topicImage} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <ThemedText style={styles.topicTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.topicDesc} numberOfLines={2}>{item.desc}</ThemedText>
          </View>
          <TouchableOpacity style={[styles.saveBtn, item.saved && styles.saveBtnActive]}>
            <Text style={[styles.saveBtnText, item.saved && styles.saveBtnTextActive]}>{item.saved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      style={{ marginTop: 12 }}
    />
  );

  const renderAuthors = () => (
    <FlatList
      data={authorData}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item }) => (
        <View style={styles.authorCard}>
          <Image source={item.logo} style={styles.authorLogo} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText style={styles.authorName}>{item.name}</ThemedText>
            <ThemedText style={styles.authorFollowers}>{item.followers} Followers</ThemedText>
          </View>
          <TouchableOpacity style={[styles.followBtn, item.following && styles.followingBtn]}>
            <Text style={[styles.followBtnText, item.following && styles.followBtnTextActive]}>{item.following ? 'Following' : '+ Follow'}</Text>
          </TouchableOpacity>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      style={{ marginTop: 12 }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search news, topics, authors..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoFocus
          />
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color="#2979FF" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 24 }}>{error}</Text>
      ) : activeTab === 'News' || activeTab === 'Author' || activeTab === 'Topics' ? (
        renderNews()
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginHorizontal: 12,
    marginBottom: 0,
  },
  tabBtn: {
    marginRight: 32,
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    color: '#B0B3B8',
    fontSize: 17,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabUnderline: {
    height: 3,
    width: 28,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginTop: 2,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 12,
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
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 10,
    overflow: 'hidden',
  },
  topicImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  topicTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  topicDesc: {
    color: '#B0B3B8',
    fontSize: 14,
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  saveBtnActive: {
    backgroundColor: '#2563eb',
    borderWidth: 0,
  },
  saveBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtnTextActive: {
    color: '#fff',
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 10,
    overflow: 'hidden',
  },
  authorLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  authorFollowers: {
    color: '#B0B3B8',
    fontSize: 14,
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  followingBtn: {
    backgroundColor: '#2563eb',
    borderWidth: 0,
  },
  followBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },
  followBtnTextActive: {
    color: '#fff',
  },
});
