import React from 'react';
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
import useAuthGuard from '../../hooks/useAuthGuard';

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
    category: 'Europe',
    headline: 
      "Ukraine's President Zelensky to BBC: Blood money being paid for Russian oil",
    source: 'BBC News',
    time: '14m ago',
  },
  {
    image: { uri: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c' },
    category: 'Europe',
    headline: 'Wedding celebration in Europe',
    source: 'BBC News',
    time: '1h ago',
  },
];

export default function TrendingScreen() {
  useAuthGuard();
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof trendingNews[0] }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12 }}>
        <ThemedText style={styles.category}>{item.category}</ThemedText>
        <ThemedText style={styles.headline}>{item.headline}</ThemedText>
        <View style={styles.metaRow}>
          <Image source={require('@/assets/images/favicon.png')} style={styles.sourceIcon} />
          <ThemedText style={styles.source}>{item.source}</ThemedText>
          <ThemedText style={styles.time}>{item.time}</ThemedText>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <MaterialIcons name="more-horiz" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} type="subtitle">Trending</ThemedText>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={trendingNews}
        renderItem={renderItem}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
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