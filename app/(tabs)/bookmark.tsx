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

export default function BookmarkScreen() {
  useAuthGuard();
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof bookmarkData[0] }) => (
    <View style={styles.newsCard}>
      <Image source={item.image} style={styles.newsImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <ThemedText style={styles.newsCategory}>{item.category}</ThemedText>
        <ThemedText style={styles.newsHeadline} numberOfLines={2}>{item.headline}</ThemedText>
        <View style={styles.newsMetaRow}>
          <Image source={item.sourceLogo} style={styles.sourceLogo} />
          <ThemedText style={styles.newsSource}>{item.source}</ThemedText>
          <ThemedText style={styles.newsTime}>{item.time}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText style={styles.heading}>Bookmark</ThemedText>
      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBarRow} activeOpacity={0.8} onPress={() => router.push('/search-section')}>
        <Ionicons name="search" size={22} color="#888" style={{ marginLeft: 8, marginRight: 8 }} />
        <Text style={styles.searchInput}>Search</Text>
        <TouchableOpacity style={{ marginRight: 8 }}>
          <MaterialIcons name="tune" size={22} color="#888" />
        </TouchableOpacity>
      </TouchableOpacity>
      <FlatList
        data={bookmarkData}
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
});