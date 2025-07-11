import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView, 
  Platform,
  TextInput,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import RBSheet from 'react-native-raw-bottom-sheet';
import useAuthGuard from '../hooks/useAuthGuard';
import { useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NewsPage() {
  useAuthGuard();
  const params = useLocalSearchParams();
  const article = params.article ? JSON.parse(params.article as string) : null;
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [cachedSummary, setCachedSummary] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchAndSummarize = async () => {
      setSummarizing(true);
      setSummaryError(null);
      try {
        // 1. Fetch full article from backend (by url)
        let articleData = null;
        if (article?.url) {
          const res = await fetch(`http://localhost:8080/news/article?url=${encodeURIComponent(article.url)}`);
          if (res.ok) {
            articleData = await res.json();
          }
        }
        if (!articleData) {
          articleData = article;
        }
        if (!articleData) throw new Error('No article data available for summary.');
        // 2. Summarize with Cohere (ask it to extract main article text and summarize)
        let cohereKey = undefined;
        if (Constants.expoConfig?.extra?.COHERE_API_KEY) {
          cohereKey = Constants.expoConfig.extra.COHERE_API_KEY;
        } else if (
          Constants.manifest &&
          typeof Constants.manifest === 'object' &&
          'extra' in Constants.manifest &&
          (Constants.manifest as any).extra?.COHERE_API_KEY
        ) {
          cohereKey = (Constants.manifest as any).extra.COHERE_API_KEY;
        }
        if (!cohereKey) throw new Error('Cohere API key not set');
        // Compose a prompt for Cohere to extract and summarize
        const prompt = `Given the following JSON object from NewsAPI for a news article, extract the main article text (not just the description or title), and then summarize it in 5-6 lines. If the main article text is not present, use the most detailed available field.\n\nNewsAPI Article JSON:\n${JSON.stringify(articleData)}\n\nSummary:`;
        const cohereRes = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cohereKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'command',
            prompt,
            max_tokens: 300,
            temperature: 0.3,
            k: 0,
            p: 0.75,
            stop_sequences: [],
            return_likelihoods: 'NONE'
          })
        });
        if (!cohereRes.ok) {
          const errText = await cohereRes.text();
          throw new Error(errText || 'Failed to fetch summary');
        }
        const cohereData = await cohereRes.json();
        const summaryText = cohereData.generations?.[0]?.text?.trim() || 'No summary available.';
        setSummary(summaryText);
        setCachedSummary(prev => ({ ...prev, [getArticleKey(article)]: summaryText }));
        setShowSummary(true);
      } catch (err: any) {
        setSummaryError(err.message || 'Error fetching summary');
      } finally {
        setSummarizing(false);
      }
    };
    fetchAndSummarize();
  }, [article?.url, article?.description, article?.content]);

  // Helper to clean up content field
  function cleanContent(content: string | undefined) {
    if (!content) return '';
    return content.split('[+')[0].replace(/\{.*?\}/g, '').replace(/<.*?>/g, '').trim();
  }

  // Helper to get a unique key for caching summary per article
  const getArticleKey = (art: any) => art?.url || art?._id || art?.title || '';

  // Summarize handler (on button click)
  const handleSummarize = async () => {
    if (!article) return;
    const articleKey = getArticleKey(article);
    if (cachedSummary[articleKey]) {
      setSummary(cachedSummary[articleKey]);
      setShowSummary(true);
      return;
    }
    setSummarizing(true);
    setSummaryError(null);
    try {
      // 1. Fetch full article from backend (by url)
      let articleData = null;
      if (article?.url) {
        const res = await fetch(`http://localhost:8080/news/article?url=${encodeURIComponent(article.url)}`);
        if (res.ok) {
          articleData = await res.json();
        }
      }
      if (!articleData) {
        articleData = article;
      }
      if (!articleData) throw new Error('No article data available for summary.');
      // 2. Summarize with Cohere (ask it to extract main article text and summarize)
      let cohereKey = undefined;
      if (Constants.expoConfig?.extra?.COHERE_API_KEY) {
        cohereKey = Constants.expoConfig.extra.COHERE_API_KEY;
      } else if (
        Constants.manifest &&
        typeof Constants.manifest === 'object' &&
        'extra' in Constants.manifest &&
        (Constants.manifest as any).extra?.COHERE_API_KEY
      ) {
        cohereKey = (Constants.manifest as any).extra.COHERE_API_KEY;
      }
      if (!cohereKey) throw new Error('Cohere API key not set');
      // Compose a prompt for Cohere to extract and summarize
      const prompt = `Given the following JSON object from NewsAPI for a news article, extract the main article text (not just the description or title), and then summarize it in 5-6 lines. If the main article text is not present, use the most detailed available field.\n\nNewsAPI Article JSON:\n${JSON.stringify(articleData)}\n\nSummary:`;
      const cohereRes = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'command',
          prompt,
          max_tokens: 300,
          temperature: 0.3,
          k: 0,
          p: 0.75,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        })
      });
      if (!cohereRes.ok) {
        const errText = await cohereRes.text();
        throw new Error(errText || 'Failed to fetch summary');
      }
      const cohereData = await cohereRes.json();
      const summaryText = cohereData.generations?.[0]?.text?.trim() || 'No summary available.';
      setSummary(summaryText);
      setCachedSummary(prev => ({ ...prev, [articleKey]: summaryText }));
      setShowSummary(true);
    } catch (err: any) {
      setSummaryError(err.message || 'Error fetching summary');
    } finally {
      setSummarizing(false);
    }
  };

  const news = article;
  const author = {
    name: (news && (news.newsCompany || news.source?.name || news.author)) || 'Unknown',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg',
    time: news && (news.publishedAt || news.publishedAgo || ''),
    following: true,
  };
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24500);
  const [comment, setComment] = useState('');
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const rbSheetRef = useRef<any>(null);

  // Mock comments data
  const comments = [
    {
      id: '1',
      user: 'Wilson Franci',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      time: '4w',
      likes: 125,
      replies: [
        {
          id: '1-1',
          user: 'Madelyn Saris',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          text: 'Lorem Ipsum is simply dummy text of the printing and type...',
          time: '4w',
          likes: 3,
        },
      ],
      moreReplies: 2,
    },
    {
      id: '2',
      user: 'Marley Botosh',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      time: '4w',
      likes: 12,
      replies: [],
      moreReplies: 2,
    },
    {
      id: '3',
      user: 'Alfonso Septimus',
      avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      time: '4w',
      likes: 14000,
      replies: [],
      moreReplies: 58,
    },
    {
      id: '4',
      user: 'Omar Herwitz',
      avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      time: '4w',
      likes: 16,
      replies: [],
      moreReplies: 0,
    },
    {
      id: '5',
      user: 'Corey Geidt',
      avatar: 'https://randomuser.me/api/portraits/men/99.jpg',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      time: '4w',
      likes: 0,
      replies: [],
      moreReplies: 0,
    },
  ];

  const openSheet = () => {
    rbSheetRef.current?.open();
  };
  const closeSheet = () => {
    rbSheetRef.current?.close();
  };

  const renderReply = (reply: any) => (
    <View key={reply.id} style={styles.replyRow}>
      <Image source={{ uri: reply.avatar }} style={styles.replyAvatar} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.replyUser}>{reply.user}</Text>
        <Text style={styles.replyText} numberOfLines={1}>{reply.text}</Text>
        <View style={styles.commentMetaRow}>
          <Text style={styles.commentTime}>{reply.time}</Text>
          <FontAwesome name="heart" size={14} color="#E5397B" style={{ marginLeft: 12, marginRight: 2 }} />
          <Text style={styles.commentLikes}>3 likes</Text>
          <Text style={styles.replyBtn}>reply</Text>
        </View>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentRow}>
      <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.commentUser}>{item.user}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentMetaRow}>
          <Text style={styles.commentTime}>{item.time}</Text>
          <FontAwesome name="heart-o" size={14} color="#aaa" style={{ marginLeft: 12, marginRight: 2 }} />
          <Text style={styles.commentLikes}>{item.likes} likes</Text>
          <Text style={styles.replyBtn}>reply</Text>
        </View>
        {item.replies && item.replies.length > 0 && (
          <View style={{ marginTop: 6, marginLeft: 0 }}>
            {item.replies.map(renderReply)}
            <Text style={styles.seeMore}>See more ({item.moreReplies})</Text>
          </View>
        )}
        {item.replies && item.replies.length === 0 && item.moreReplies > 0 && (
          <Text style={styles.seeMore}>See more ({item.moreReplies})</Text>
        )}
      </View>
    </View>
  );

  const API_BASE = 'http://localhost:8080';

  // Add bookmark logic
  const handleBookmark = async () => {
    setBookmarkLoading(true);
    setBookmarkError(null);
    try {
      const userStr = await AsyncStorage.getItem('user');
      let email = null;
      try {
        const userObj = userStr ? JSON.parse(userStr) : null;
        email = userObj?.email || null;
      } catch {}
      if (!email) throw new Error('User not found');
      if (!bookmarked) {
        const res = await fetch(`${API_BASE}/bookmarks/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: email, article })
        });
        const data = await res.json();
        if (data.message === 'Already bookmarked') {
          setBookmarked(true);
          Alert.alert('Already Bookmarked', 'This article is already in your bookmarks.');
        } else if (data.message === 'Bookmark added') {
          setBookmarked(true);
          Alert.alert('Bookmarked', 'Article added to your bookmarks.');
        } else {
          throw new Error('Failed to add bookmark');
        }
      } else {
        // Remove bookmark
        const res = await fetch(`${API_BASE}/bookmarks/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: email, articleId: article.url || article._id })
        });
        const data = await res.json();
        if (data.message === 'Bookmark removed') {
          setBookmarked(false);
          Alert.alert('Bookmark Removed', 'Article removed from your bookmarks.');
        } else {
          throw new Error('Failed to remove bookmark');
        }
      }
    } catch (err: any) {
      setBookmarkError(err.message || 'Bookmark error');
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={{ marginRight: 8 }}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="more-vert" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Author Row */}
        <View style={styles.authorRow}>
          <Image source={{ uri: author.avatar }} style={styles.authorAvatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.authorName}>{author.name}</Text>
            <Text style={styles.authorTime}>{author.time}</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Following</Text>
          </TouchableOpacity>
        </View>
        {/* News Content & Summary */}
        {news && (
          <View style={styles.contentBox}>
            <Text style={styles.category}>{news.country || ((news as any).source && (news as any).source.name) || ''}</Text>
            <Text style={styles.title}>{news.title}</Text>
            {/* News Company */}
            <Text style={styles.source}>{news.newsCompany || ((news as any).source && (news as any).source.name) || (news as any).author || ''}</Text>
            <Text style={styles.time}>{news.publishedAgo || (news as any).publishedAt || ''}</Text>
            {/* News Image */}
            {((news as any).urlToImage || news.image) && (
              <Image source={{ uri: (news as any).urlToImage || news.image }} style={styles.newsImage} />
            )}
            {/* Article Body or Summary */}
            {!showSummary ? (
              <Text style={styles.body}>
                {((news as any).content && ((news as any).content as string).trim()) ||
                  (news as any).description ||
                  cleanContent((news as any).content) ||
                  'No article content available.'}
              </Text>
            ) : (
              <View style={{ backgroundColor: '#23252B', borderRadius: 8, padding: 12, marginTop: 8 }}>
                {summarizing ? (
                  <Text style={{ color: '#fff', fontSize: 16 }}>Summarizing...</Text>
                ) : summary ? (
                  <>
                    <Text style={{ color: '#fff', fontSize: 15 }}>{summary}</Text>
                    <Text style={{ color: '#888', fontSize: 13, marginTop: 8, textAlign: 'right' }}>Powered by Cohere</Text>
                  </>
                ) : summaryError ? (
                  <Text style={{ color: 'red', fontSize: 15 }}>{summaryError}</Text>
                ) : null}
              </View>
            )}
            {(news as any).url && (
              <TouchableOpacity onPress={() => Linking.openURL((news as any).url)} style={{ marginTop: 12 }}>
                <Text style={{ color: '#2979FF', fontWeight: 'bold', fontSize: 16 }}>Read Full Article</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Floating Summarize Button */}
        {!showSummary && !summarizing && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleSummarize}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Summarize</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.bottomItem} onPress={() => {
            setLiked((prev) => {
              const newLiked = !prev;
              setLikeCount((count) => newLiked ? count + 1 : count - 1);
              return newLiked;
            });
          }}>
            <FontAwesome name="heart" size={20} color={liked ? "#E5397B" : "#aaa"} style={{ marginRight: 6 }} />
            <Text style={styles.bottomText}>{likeCount >= 1000 ? (likeCount/1000).toFixed(1) + 'K' : likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomItem, { marginLeft: 18 }]} onPress={openSheet}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.bottomText}>{news && (news as any).comments ? (news as any).comments : '1K'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bottomItem} onPress={handleBookmark}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? '#2563eb' : '#2563eb'} />
        </TouchableOpacity>
        {bookmarkError && <Text style={{ color: 'red', marginLeft: 8 }}>{bookmarkError}</Text>}
      </View>
      {/* Comments Bottom Sheet */}
      <RBSheet
        ref={rbSheetRef}
        height={Platform.OS === 'ios' ? 600 : 520}
        openDuration={250}
        customStyles={{
          container: {
            backgroundColor: '#23252B',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            paddingBottom: 0,
          },
          draggableIcon: {
            backgroundColor: '#444',
          },
        }}
      >
        <View style={styles.sheetHeaderRow}>
          <TouchableOpacity onPress={closeSheet}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your comment"
            placeholderTextColor="#aaa"
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </RBSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  authorName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorTime: {
    color: '#B0B3B8',
    fontSize: 13,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  newsImage: {
    width: '92%',
    height: 180,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 12,
    backgroundColor: '#23252B',
  },
  contentBox: {
    marginHorizontal: 16,
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  category: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 2,
  },
  source: {
    color: '#B0B3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  time: {
    color: '#B0B3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  body: {
    color: '#B0B3B8',
    fontSize: 16,
    marginBottom: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingBottom: 12,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Bottom sheet styles
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  commentUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentText: {
    color: '#fff',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 4,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  commentTime: {
    color: '#B0B3B8',
    fontSize: 13,
  },
  commentLikes: {
    color: '#B0B3B8',
    fontSize: 13,
    marginRight: 8,
    marginLeft: 2,
  },
  replyBtn: {
    color: '#B0B3B8',
    fontSize: 13,
    marginLeft: 8,
  },
  seeMore: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 2,
  },
  // Reply styles
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 32,
    marginBottom: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  replyUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  replyText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
});
