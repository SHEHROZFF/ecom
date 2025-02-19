// src/screens/AICoursesScreen.js
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';

import CourseCard from '../components/CourseCard';
import FeaturedReel from '../components/FeaturedReel';
import NewCourseAdsList from '../components/NewCourseAdsList';

const AICoursesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();

  // Separate state variables for courses and reels
  const [courses, setCourses] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sample new ads data for the carousel
  const newAds = [
    {
      id: 'ad1',
      image: 'https://via.placeholder.com/150x100.png?text=Ad+1',
      title: 'Boost Your Career!',
      subtitle: 'Enroll in our latest AI courses.',
    },
    {
      id: 'ad2',
      image: 'https://via.placeholder.com/150x100.png?text=Ad+2',
      title: 'Special Offer',
      subtitle: 'Up to 50% off on new courses.',
    },
    {
      id: 'ad3',
      image: 'https://via.placeholder.com/150x100.png?text=Ad+3',
      title: 'Fresh Content!',
      subtitle: 'Discover cutting-edge topics in AI.',
    },
  ];

  // Persisted animated value for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Simulated fetch function for courses and reels separately
  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulated data for courses (all courses, including those without video)
      const fetchedCourses = [
        {
          id: '1',
          title: 'Introduction to AI',
          description: 'Learn the basics of Artificial Intelligence and its applications.',
          image: 'https://via.placeholder.com/400x200.png?text=Introduction+to+AI',
          // No videoUrl means this will show as a course only
          rating: 4.5,
          reviews: 120,
        },
        {
          id: '2',
          title: 'Deep Learning Fundamentals',
          description: 'Dive deep into neural networks and deep learning techniques.',
          image: 'https://via.placeholder.com/400x200.png?text=Deep+Learning+Fundamentals',
          rating: 4.7,
          reviews: 95,
        },
        {
          id: '3',
          title: 'Machine Learning in Practice',
          description: 'Hands-on course covering practical machine learning algorithms.',
          image: 'https://via.placeholder.com/400x200.png?text=Machine+Learning+in+Practice',
          videoUrl: 'https://www.w3schools.com/html/movie.mp4',
          rating: 4.6,
          reviews: 150,
        },
        {
          id: '4',
          title: 'Natural Language Processing',
          description: 'Explore how AI understands and processes human language.',
          image: 'https://via.placeholder.com/400x200.png?text=Natural+Language+Processing',
          rating: 4.4,
          reviews: 80,
        },
        {
          id: '5',
          title: 'Advanced Neural Networks',
          description: 'Master the art of deep neural networks and advanced architectures.',
          image: 'https://via.placeholder.com/400x200.png?text=Advanced+Neural+Networks',
          rating: 4.8,
          reviews: 200,
        },
      ];

      // Simulated data for reels (featured courses with videos)
      const fetchedReels = [
        {
          id: '3',
          title: 'Machine Learning in Practice',
          image: 'https://via.placeholder.com/400x200.png?text=Machine+Learning+in+Practice',
          videoUrl: 'https://www.w3schools.com/html/movie.mp4',
          rating: 4.6,
          reviews: 150,
        },
        {
          id: '6',
          title: 'Introduction to AI',
          image: 'https://via.placeholder.com/400x200.png?text=Introduction+to+AI',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          rating: 4.5,
          reviews: 120,
        },
        {
          id: '8',
          title: 'Machine Learning in Practice',
          image: 'https://via.placeholder.com/400x200.png?text=Machine+Learning+in+Practice',
          videoUrl: 'https://www.w3schools.com/html/movie.mp4',
          rating: 4.6,
          reviews: 150,
        },
      ];

      setCourses(fetchedCourses);
      setReels(fetchedReels);
      setError(null);

      // Animate fade-in once data is loaded
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Responsive grid: 1 column on narrow screens, 2 columns on wider ones
  const getNumberOfColumns = () => (width < 600 ? 1 : 2);
  const numColumns = getNumberOfColumns();
  const getCardWidth = () => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  };

  const handleEnroll = (course) => {
    Alert.alert('Enrollment', `You have enrolled in "${course.title}"!`);
  };

  const handleFeaturedPress = (course) => {
    Alert.alert('Course Details', `Featured Course: ${course.title}`);
  };

  const handleAdPress = (ad) => {
    Alert.alert('New Courses', `Ad clicked: ${ad.title}`);
  };

  // Render a course card
  const renderCourse = useCallback(({ item }) => (
    <CourseCard
      course={item}
      cardWidth={getCardWidth()}
      currentTheme={currentTheme}
      onEnroll={handleEnroll}
    />
  ), [currentTheme, width]);

  // Render header containing featured reels and new course ads
  const renderHeader = () => (
    <View>
      {/* Featured Reels Carousel */}
      <View style={styles.featuredSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor, marginLeft: 15 }]}>
          Featured Courses
        </Text>
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeaturedReel
              course={item}
              reelWidth={width * 0.8}
              reelHeight={200}
              onPress={() => handleFeaturedPress(item)}
              currentTheme={currentTheme}
              reelsData={reels} // Pass separate reels data
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 10 }}
        />
      </View>

      {/* New Course Ads Carousel */}
      <View style={styles.adSection}>
        <NewCourseAdsList ads={newAds} onAdPress={handleAdPress} currentTheme={currentTheme} />
      </View>

      <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor, marginLeft: 15 }]}>
        All Courses
      </Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
        No courses available.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={
          currentTheme.headerBackground
            ? currentTheme.headerBackground[1]
            : currentTheme.primaryColor
        }
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      <View style={styles.header}>
        <LinearGradient
          colors={currentTheme.headerBackground || ['#4c669f', '#3b5998']}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
            AI Courses
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
            Elevate your skills with modern AI education
          </Text>
        </LinearGradient>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: currentTheme.errorTextColor }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => fetchData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
            numColumns={numColumns}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchData(true)}
                tintColor={currentTheme.primaryColor}
              />
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  featuredSection: {
    marginBottom: 10,
  },
  adSection: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
});

export default AICoursesScreen;

