import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const SLIDES = [
  {
    key: '1',
    image: require('../../public/scroll-image-1.png'),
    text: 'Welcome to Newsly! Stay updated with the latest news and trending topics from around the world, delivered right to your fingertips.',
  },
  {
    key: '2',
    image: require('../../public/scroll-image-2.png'),
    text: 'Personalize your feed and get news that matters to you. Choose your favorite categories and follow topics you care about most.',
  },
  {
    key: '3',
    image: require('../../public/scroll-image-3.png'),
    text: 'Get started now and never miss an important update! Save articles for later and share your favorite stories with friends.',
  },
];

export default function WelcomeCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const intervalRef = useRef<number | null>(null);
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  // Auto-scroll effect
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev === SLIDES.length - 1 ? 0 : prev + 1;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: next, animated: true });
        }
        return next;
      });
    }, 3000) as unknown as number;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Sync currentIndex on manual scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number' && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
      }
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/signin');
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Image
              source={item.image}
              style={[
                styles.image,
                { top: 0, left: 0, right: 0, position: 'absolute', width: width, height: height * 0.65 + statusBarHeight, zIndex: 1 },
              ]}
              resizeMode="cover"
            />
            <View style={{ width, marginTop: height * 0.65 + statusBarHeight, alignItems: 'center', zIndex: 2 }}>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          </View>
        )}
        style={{ flexGrow: 0 }}
      />
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, currentIndex === idx && styles.activeDot]}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{currentIndex === SLIDES.length - 1 ? 'Done' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#181B20',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 32,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#2979FF',
    width: 18,
  },
  button: {
    backgroundColor: '#2979FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    width: width - 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
