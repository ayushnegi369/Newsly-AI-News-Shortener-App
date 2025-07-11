import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthGuard from '../hooks/useAuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const user = {
  name: 'Wilson Franci',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  followers: 2156,
  following: 567,
  news: 23,
  bio: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
};

const newsData = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
    category: 'NFTs',
    title: 'Minting Your First NFT: A Beginner’s Guide to Creating...',
    author: 'Wilson Franci',
    time: '15m ago',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    category: 'Business',
    title: '5 things to know before the stock market opens Monday',
    author: 'Wilson Franci',
    time: '1h ago',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
    category: 'Travel',
    title: 'Bali plans to reopen to international tourists in Septe...',
    author: 'Wilson Franci',
    time: '1w ago',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c',
    category: 'Health',
    title: 'Healthy Living: Diet and Exercise',
    author: 'Wilson Franci',
    time: '2w ago',
  },
];

export default function Profile() {
  useAuthGuard();
  const [activeTab, setActiveTab] = useState('Recent');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const router = useRouter();
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const email = userObj.email;
          const res = await fetch(`http://localhost:8080/get-user-details?email=${encodeURIComponent(email)}`);
          if (!res.ok) throw new Error('Failed to fetch user details');
          const data = await res.json();
          setUsername(data.username || '');
          setAvatar(data.avatar || 'https://randomuser.me/api/portraits/men/32.jpg');
          setBio(data.bio || '');
        }
      } catch (e) {
        setUsername('');
        setAvatar('https://randomuser.me/api/portraits/men/32.jpg');
        setBio('');
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch recent news when Recent tab is active
  React.useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const userStr = await AsyncStorage.getItem('user');
        const email = userStr ? JSON.parse(userStr).email : null;
        if (!email) throw new Error('User not found');
        const res = await fetch(`http://localhost:8080/viewed-news/list?user=${encodeURIComponent(email)}`);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to fetch recent news');
        }
        const data = await res.json();
        setRecentNews(data.viewed || []);
      } catch (e: any) {
        setRecentError(e.message || 'Failed to fetch recent news');
        setRecentNews([]);
      } finally {
        setRecentLoading(false);
      }
    };
    if (activeTab === 'Recent') fetchRecent();
  }, [activeTab]);

  const renderNews = ({ item }: { item: typeof newsData[0] }) => (
    <View style={styles.newsCard}>
      <Image source={{ uri: item.image }} style={styles.newsImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.newsCategory}>{item.category}</Text>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.newsMetaRow}>
          <Text style={styles.newsAuthor}>{item.author}</Text>
          <Ionicons name="time-outline" size={14} color="#B0B3B8" style={{ marginLeft: 8, marginRight: 2 }} />
          <Text style={styles.newsTime}>{item.time}</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRecentNews = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.newsCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/news-page', params: { article: JSON.stringify(item) } })}>
      <Image source={{ uri: item.image || item.urlToImage || '' }} style={styles.newsImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.newsCategory}>{item.category || item.country}</Text>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.newsMetaRow}>
          <Text style={styles.newsAuthor}>{item.newsCompany || item.source || item.author}</Text>
          <Ionicons name="time-outline" size={14} color="#B0B3B8" style={{ marginLeft: 8, marginRight: 2 }} />
          <Text style={styles.newsTime}>{item.publishedAgo || item.time || item.publishedAt}</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.profileTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.avatarRow}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.news}</Text>
          <Text style={styles.statLabel}>News</Text>
        </View>
      </View>
      <Text style={styles.userName}>{username}</Text>
      <Text style={styles.userBio}>{bio}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
          <Text style={styles.editBtnText}>Edit profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.websiteBtn}>
          <Text style={styles.websiteBtnText}>Website</Text>
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('News')}>
          <Text style={[styles.tabText, activeTab === 'News' && styles.tabTextActive]}>News</Text>
          {activeTab === 'News' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Recent')}>
          <Text style={[styles.tabText, activeTab === 'Recent' && styles.tabTextActive]}>Recent</Text>
          {activeTab === 'Recent' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>
      {/* News List */}
      {activeTab === 'News' ? (
        <FlatList
          data={newsData}
          keyExtractor={item => item.id}
          renderItem={renderNews}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 8 }}
        />
      ) : (
        <FlatList
          data={recentNews}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderRecentNews}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 8 }}
          ListEmptyComponent={recentLoading ? <Text style={{ color: '#fff', textAlign: 'center', marginTop: 24 }}>Loading...</Text> : recentError ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 24 }}>{recentError}</Text> : <Text style={{ color: '#fff', textAlign: 'center', marginTop: 24 }}>No recent news found.</Text>}
        />
      )}
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-news')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 8,
  },
  profileTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#23252B',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  statNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: '#B0B3B8',
    fontSize: 13,
    marginTop: 2,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 2,
  },
  userBio: {
    color: '#B0B3B8',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    marginTop: 4,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginRight: 10,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  websiteBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  websiteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tabBtn: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabText: {
    color: '#B0B3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  tabUnderline: {
    height: 3,
    width: 36,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginTop: 2,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#23252B',
    borderRadius: 14,
    marginHorizontal: 16,
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
    fontSize: 13,
    marginBottom: 2,
  },
  newsTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  newsAuthor: {
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});