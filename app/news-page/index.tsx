import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import RBSheet from 'react-native-raw-bottom-sheet';

export default function NewsPage() {
  // Mock data
  const author = {
    name: 'BBC News',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022_%28Alt%29.svg',
    time: '14m ago',
    following: true,
  };
  const news = {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    category: 'Europe',
    title: `Ukraine's President Zelensky to BBC: Blood money being paid for Russian oil`,
    body: `Ukrainian President Volodymyr Zelensky has accused European countries that continue to buy Russian oil of "earning their money in other people's blood".\n\nIn an interview with the BBC, President Zelensky singled out Germany and Hungary, accusing them of blocking efforts to embargo energy sales, from which Russia stands to make up to £250bn ($326bn) this year.`,
    likes: 24500,
    comments: '1K',
    bookmarked: false,
  };
  const [bookmarked, setBookmarked] = useState(news.bookmarked);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(news.likes);
  const [comment, setComment] = useState('');
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
        {/* News Image */}
        <Image source={{ uri: news.image }} style={styles.newsImage} />
        {/* News Content */}
        <View style={styles.contentBox}>
          <Text style={styles.category}>{news.category}</Text>
          <Text style={styles.title}>{news.title}</Text>
          <Text style={styles.body}>{news.body}</Text>
        </View>
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
            <Text style={styles.bottomText}>{news.comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bottomItem} onPress={() => setBookmarked(b => !b)}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color="#2563eb" />
        </TouchableOpacity>
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
});
