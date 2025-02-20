import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';

import CustomHeader from '../components/CustomHeader';
import CourseCard from '../components/CourseCard';
import FeaturedReel from '../components/FeaturedReel';
import NewCourseAdsList from '../components/NewCourseAdsList';
import {
  fetchCourses,
  fetchFeaturedReels,
  fetchAds,
  searchCoursesAPI,
} from '../services/api';

const PAGE_LIMIT = 10;
const REELS_LIMIT = 5;

const AICoursesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  // Courses
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reels
  const [reels, setReels] = useState([]);
  const [reelsPage, setReelsPage] = useState(1);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [loadingMoreReels, setLoadingMoreReels] = useState(false);

  // Ads
  const [ads, setAds] = useState([]);

  // Fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Layout calculations
  const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
  const cardWidth = useMemo(() => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  }, [width, numColumns]);

  // 1) fetchData for courses + ads
  const fetchData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (isRefreshing) {
          setRefreshing(true);
          setPage(1);
          setHasMore(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const currentPage = isRefreshing ? 1 : page;
        const [coursesResponse, adsResponse] = await Promise.all([
          fetchCourses(currentPage, PAGE_LIMIT),
          fetchAds(),
        ]);

        if (coursesResponse.success) {
          const newCourses = coursesResponse.data.map((course) => ({
            id: course._id,
            title: course.title,
            description: course.description,
            image: course.image,
            rating: course.rating,
            reviews: course.reviews,
            videoUrl: course.isFeatured ? course.shortVideoLink : undefined,
          }));

          if (isRefreshing) {
            setCourses(newCourses);
            setPage(2);
          } else {
            setCourses((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const filtered = newCourses.filter((c) => !existingIds.has(c.id));
              return [...prev, ...filtered];
            });
            setPage(currentPage + 1);
          }
          if (newCourses.length < PAGE_LIMIT) {
            setHasMore(false);
          }
        }

        if (adsResponse.success) {
          setAds(adsResponse.data);
        } else {
          setAds([]);
        }

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        console.error('fetchData error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [page, fadeAnim]
  );

  // 2) fetchReels
  const fetchReels = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setReelsPage(1);
          setHasMoreReels(true);
        }
        setLoadingMoreReels(true);

        const currentPage = isRefresh ? 1 : reelsPage;
        const reelsResponse = await fetchFeaturedReels(currentPage, REELS_LIMIT);

        if (reelsResponse.success) {
          const newReels = reelsResponse.data.map((item) => ({
            ...item,
            id: item._id,
          }));

          if (isRefresh) {
            setReels(newReels);
            setReelsPage(2);
          } else {
            const deduped = newReels.filter((r) => !reels.some((ex) => ex.id === r.id));
            if (deduped.length === 0) {
              setHasMoreReels(false);
            } else {
              setReels((prev) => [...prev, ...deduped]);
              setReelsPage(currentPage + 1);
            }
          }
          if (newReels.length < REELS_LIMIT) {
            setHasMoreReels(false);
          }
        }
      } catch (err) {
        console.error('fetchReels error:', err);
      } finally {
        setLoadingMoreReels(false);
      }
    },
    [reels, reelsPage]
  );

  // 3) refreshAll
  const refreshAll = useCallback(() => {
    setHasMore(true);
    setHasMoreReels(true);
    fetchData(true);
    fetchReels(true);
  }, [fetchData, fetchReels]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Search by button press
  // ---------------------------------------------------------------------------
  const handleSearchPress = useCallback(async () => {
    if (!searchTerm) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const result = await searchCoursesAPI(searchTerm);
      if (result.success && result.data) {
        setSearchSuggestions(result.data);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('search error', err);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Tapping a suggestion -> navigate
  const handleSuggestionPress = useCallback((course) => {
    setSearchTerm(course.title);
    setShowSuggestions(false);
    navigation.navigate('CourseDetailScreen', { course });
  }, [navigation]);

  // If user changes text, we only set it locally. We do NOT fetch suggestions automatically.
  const handleTextChange = useCallback((text) => {
    setSearchTerm(text);
    // If user clears text, hide suggestions
    if (!text) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load more
  // ---------------------------------------------------------------------------
  const handleLoadMoreCourses = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchData();
    }
  }, [loadingMore, hasMore, fetchData]);

  const handleLoadMoreReels = useCallback(() => {
    if (!loadingMoreReels && hasMoreReels) {
      fetchReels();
    }
  }, [loadingMoreReels, hasMoreReels, fetchReels]);

  // ---------------------------------------------------------------------------
  // UI handlers
  // ---------------------------------------------------------------------------
  const handleFeaturedPress = useCallback((course) => {
    Alert.alert('Course Details', `Featured Course: ${course.title}`);
  }, []);

  const handleAdPress = useCallback((ad) => {
    Alert.alert('New Courses', `Ad clicked: ${ad.title}`);
  }, []);

  // Render Items
  const renderCourse = useCallback(
    ({ item }) => (
      <CourseCard course={item} cardWidth={cardWidth} currentTheme={currentTheme} />
    ),
    [cardWidth, currentTheme]
  );

  const getItemLayout = useCallback((_, index) => {
    const CARD_HEIGHT = 300;
    const row = Math.floor(index / numColumns);
    return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
  }, [numColumns]);

  // Header
  const renderHeader = useCallback(() => (
    <View>
      {/* Featured Reels */}
      <View style={styles.featuredSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
          Featured Courses
        </Text>
        <FlatList
          data={reels}
          horizontal
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={({ item }) => (
            <FeaturedReel
              course={item}
              reelWidth={width * 0.35}
              reelHeight={220}
              onPress={() => handleFeaturedPress(item)}
              currentTheme={currentTheme}
              reelsData={reels}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reelsContainer}
          onEndReached={handleLoadMoreReels}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMoreReels ? (
              <ActivityIndicator size="small" color={currentTheme.primaryColor} />
            ) : null
          }
        />
      </View>

      {/* Ads */}
      <View style={styles.adsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
          Sponsored Ads
        </Text>
        <View style={{ marginTop: 0 }}>
          <NewCourseAdsList ads={ads} onAdPress={handleAdPress} currentTheme={currentTheme} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
        All Courses
      </Text>
    </View>
  ), [
    reels,
    currentTheme,
    width,
    handleFeaturedPress,
    handleLoadMoreReels,
    loadingMoreReels,
    ads,
    handleAdPress,
  ]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
        No courses available.
      </Text>
    </View>
  ), [currentTheme]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
      </View>
    );
  }, [loadingMore, currentTheme]);

  // If no data
  if (loading && courses.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
      </SafeAreaView>
    );
  }

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
      {/* Custom Header */}
      <CustomHeader />

      {/* Gradient Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={currentTheme.headerBackground || ['#3a7bd5', '#00d2ff']}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
            AI Courses
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
            Elevate your skills with modern AI education
          </Text>

          {/* Search bar with "Search" button */}
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Search..."
              placeholderTextColor="#999"
              style={[styles.searchInput, { color: currentTheme.textColor }]}
              value={searchTerm}
              onChangeText={handleTextChange}
            />
            <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* If we have suggestions & showSuggestions = true */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={{ color: currentTheme.textColor }}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={courses}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderCourse}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshAll}
              tintColor={currentTheme.primaryColor}
            />
          }
          onEndReached={handleLoadMoreCourses}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={5}
          getItemLayout={getItemLayout}
        />
      </Animated.View>

      {/* Overlay loader if we're fetching in background */}
      {loading && courses.length > 0 && (
        <View style={[styles.loadingOverlay, { backgroundColor: currentTheme.backgroundColor + 'cc' }]}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  header: {
    height: 180,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    position: 'relative',
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 2,
  },

  // Search bar with separate search button
  searchBar: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#3b5998',
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },

  // Suggestions
  suggestionContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    maxHeight: 200,
    borderRadius: 8,
    padding: 5,
    zIndex: 100,
    elevation: 5,
  },
  suggestionItem: {
    padding: 8,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },

  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 15,
    marginHorizontal: 15,
  },
  featuredSection: {
    marginBottom: 20,
  },
  reelsContainer: {
    paddingLeft: 15,
    paddingBottom: 10,
  },
  adsSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default AICoursesScreen;









// import React, {
//   useState,
//   useEffect,
//   useContext,
//   useCallback,
//   useRef,
//   useMemo,
// } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   StatusBar,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
//   TouchableOpacity,
//   useWindowDimensions,
//   Animated,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import NewCourseAdsList from '../components/NewCourseAdsList';
// import { fetchCourses, fetchFeaturedReels, fetchAds } from '../services/api';

// const PAGE_LIMIT = 10;
// const REELS_LIMIT = 5;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();

//   // ---------------------------------------------------------------------------
//   // State: Courses
//   // ---------------------------------------------------------------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);

//   // ---------------------------------------------------------------------------
//   // State: Reels
//   // ---------------------------------------------------------------------------
//   const [reels, setReels] = useState([]);
//   const [reelsPage, setReelsPage] = useState(1);
//   const [hasMoreReels, setHasMoreReels] = useState(true);
//   const [loadingMoreReels, setLoadingMoreReels] = useState(false);

//   // ---------------------------------------------------------------------------
//   // State: Ads
//   // ---------------------------------------------------------------------------
//   const [ads, setAds] = useState([]);

//   // ---------------------------------------------------------------------------
//   // Animated fade-in
//   // ---------------------------------------------------------------------------
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // ---------------------------------------------------------------------------
//   // Responsive card calculations
//   // ---------------------------------------------------------------------------
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ---------------------------------------------------------------------------
//   // Fetch Courses & Ads (bundled in Promise.all)
//   // ---------------------------------------------------------------------------
//   const fetchData = useCallback(
//     async (isRefreshing = false) => {
//       try {
//         if (isRefreshing) {
//           setRefreshing(true);
//           setPage(1);
//           setHasMore(true);
//         } else if (page === 1) {
//           setLoading(true);
//         } else {
//           setLoadingMore(true);
//         }

//         const currentPage = isRefreshing ? 1 : page;

//         // Fire both courses & ads in parallel
//         const [coursesResponse, adsResponse] = await Promise.all([
//           fetchCourses(currentPage, PAGE_LIMIT),
//           fetchAds(),
//         ]);

//         // Handle courses
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map(course => ({
//             id: course._id,
//             title: course.title,
//             description: course.description,
//             image: course.image,
//             rating: course.rating,
//             reviews: course.reviews,
//             videoUrl:
//               course.isFeatured && course.shortVideoLink
//                 ? course.shortVideoLink
//                 : undefined,
//           }));

//           if (isRefreshing) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses(prev => {
//               const existingIds = new Set(prev.map(c => c.id));
//               const filtered = newCourses.filter(c => !existingIds.has(c.id));
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         } else {
//           setError(coursesResponse.message);
//         }

//         // Handle ads
//         if (adsResponse.success) {
//           setAds(adsResponse.data);
//         } else {
//           setAds([]);
//         }

//         // Animate fade in for content
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError(err.message || 'Failed to fetch data');
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//         setRefreshing(false);
//       }
//     },
//     [page, fadeAnim]
//   );

//   // ---------------------------------------------------------------------------
//   // Fetch Reels
//   // ---------------------------------------------------------------------------
//   const fetchReels = useCallback(
//     async (isRefreshing = false) => {
//       try {
//         if (isRefreshing) {
//           setReelsPage(1);
//           setHasMoreReels(true);
//         }
//         setLoadingMoreReels(true);

//         const currentPage = isRefreshing ? 1 : reelsPage;
//         const reelsResponse = await fetchFeaturedReels(currentPage, REELS_LIMIT);

//         if (reelsResponse.success) {
//           const fetchedReels = reelsResponse.data.map(item => ({
//             ...item,
//             id: item._id, // so we have a consistent 'id' field
//           }));

//           if (isRefreshing) {
//             setReels(fetchedReels);
//             setReelsPage(2);
//           } else {
//             // Deduplicate
//             const newItems = fetchedReels.filter(
//               r => !reels.some(existing => existing.id === r.id)
//             );
//             if (newItems.length === 0) {
//               setHasMoreReels(false);
//             } else {
//               setReels(prev => [...prev, ...newItems]);
//               setReelsPage(currentPage + 1);
//             }
//           }
//           // If fewer than the limit, no more reels to load
//           if (fetchedReels.length < REELS_LIMIT) {
//             setHasMoreReels(false);
//           }
//         } else {
//           // If it fails, we assume no reels
//           if (isRefreshing) setReels([]);
//           setHasMoreReels(false);
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoadingMoreReels(false);
//       }
//     },
//     [reels, reelsPage]
//   );

//   // ---------------------------------------------------------------------------
//   // Refresh all
//   // ---------------------------------------------------------------------------
//   const refreshAll = useCallback(() => {
//     setHasMore(true);
//     setHasMoreReels(true);
//     fetchData(true);
//     fetchReels(true);
//   }, [fetchData, fetchReels]);

//   useEffect(() => {
//     refreshAll();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Handlers
//   // ---------------------------------------------------------------------------
//   const handleLoadMoreCourses = useCallback(() => {
//     if (!loadingMore && hasMore) {
//       fetchData();
//     }
//   }, [loadingMore, hasMore, fetchData]);

//   const handleLoadMoreReels = useCallback(() => {
//     if (!loadingMoreReels && hasMoreReels) {
//       fetchReels();
//     }
//   }, [loadingMoreReels, hasMoreReels, fetchReels]);

//   const handleFeaturedPress = useCallback(course => {
//     Alert.alert('Course Details', `Featured Course: ${course.title}`);
//   }, []);

//   const handleAdPress = useCallback(ad => {
//     Alert.alert('New Courses', `Ad clicked: ${ad.title}`);
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Render items
//   // ---------------------------------------------------------------------------
//   const renderCourse = useCallback(
//     ({ item }) => (
//       <CourseCard
//         course={item}
//         cardWidth={cardWidth}
//         currentTheme={currentTheme}
//       />
//     ),
//     [cardWidth, currentTheme]
//   );

//   const getItemLayout = useCallback(
//     (data, index) => {
//       const CARD_HEIGHT = 300; // Adjust to your card’s approximate height
//       const row = Math.floor(index / numColumns);
//       return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
//     },
//     [numColumns]
//   );

//   // ---------------------------------------------------------------------------
//   // Header / Footer / Empty
//   // ---------------------------------------------------------------------------
//   const renderHeader = useCallback(() => {
//     return (
//       <View>
//         {/* Featured Reels Carousel */}
//         <View style={styles.featuredSection}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Featured Courses
//           </Text>
//           <FlatList
//             data={reels}
//             keyExtractor={(item, index) => `${item.id}-${index}`}
//             renderItem={({ item }) => (
//               <FeaturedReel
//                 course={item}
//                 reelWidth={width * 0.35}
//                 reelHeight={220}
//                 onPress={() => handleFeaturedPress(item)}
//                 currentTheme={currentTheme}
//                 reelsData={reels}
//               />
//             )}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.reelsContainer}
//             onEndReached={handleLoadMoreReels}
//             onEndReachedThreshold={0.1}
//             ListFooterComponent={
//               loadingMoreReels ? (
//                 <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//               ) : null
//             }
//           />
//         </View>

//         {/* Ads Carousel */}
//         <View style={styles.adsSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Sponsored Ads
//         </Text>
//         <View style={{ marginTop: 0 }}>
//           <NewCourseAdsList ads={ads} onAdPress={handleAdPress} currentTheme={currentTheme} />
//         </View>
//       </View>

//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           All Courses
//         </Text>
//       </View>
//     );
//   }, [
//     reels,
//     currentTheme,
//     width,
//     handleFeaturedPress,
//     handleLoadMoreReels,
//     loadingMoreReels,
//     ads,
//     handleAdPress,
//   ]);

//   const renderEmptyComponent = useCallback(
//     () => (
//       <View style={styles.emptyContainer}>
//         <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No courses available.</Text>
//       </View>
//     ),
//     [currentTheme]
//   );

//   const renderFooter = useCallback(() => {
//     if (!loadingMore) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }, [loadingMore, currentTheme]);

//   // ---------------------------------------------------------------------------
//   // Loading screen if no data
//   // ---------------------------------------------------------------------------
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
//       </SafeAreaView>
//     );
//   }

//   // ---------------------------------------------------------------------------
//   // Main return
//   // ---------------------------------------------------------------------------
//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[1]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Custom Header */}
//       <CustomHeader />

//       {/* Gradient Header */}
//       <View style={styles.header}>
//         <LinearGradient
//           colors={currentTheme.headerBackground || ['#3a7bd5', '#00d2ff']}
//           style={styles.headerGradient}
//         >
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             AI Courses
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Elevate your skills with modern AI education
//           </Text>
//         </LinearGradient>
//       </View>

//       {/* Content */}
//       <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//         <FlatList
//           data={courses}
//           keyExtractor={(item, index) => `${item.id}-${index}`}
//           renderItem={renderCourse}
//           numColumns={numColumns}
//           ListHeaderComponent={renderHeader}
//           ListEmptyComponent={renderEmptyComponent}
//           ListFooterComponent={renderFooter}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={refreshAll}
//               tintColor={currentTheme.primaryColor}
//             />
//           }
//           onEndReached={handleLoadMoreCourses}
//           onEndReachedThreshold={0.5}
//           removeClippedSubviews
//           initialNumToRender={6}
//           windowSize={5}
//           getItemLayout={getItemLayout}
//         />
//       </Animated.View>

//       {/* Overlay Loader for “background” pagination */}
//       {loading && courses.length > 0 && (
//         <View style={[styles.loadingOverlay, { backgroundColor: currentTheme.backgroundColor + 'cc' }]}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   loadingScreen: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   header: {
//     height: 150,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 5 },
//   },
//   headerGradient: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 36,
//     fontWeight: '800',
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 18,
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginVertical: 15,
//     marginHorizontal: 15,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },
//   featuredSection: {
//     marginBottom: 20,
//   },
//   reelsContainer: {
//     paddingLeft: 15,
//     paddingBottom: 10,
//   },
//   adSection: {
//     marginHorizontal: 15,
//   },
//   emptyContainer: {
//     flex: 1,
//     marginTop: 50,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 18,
//   },
//   footer: {
//     paddingVertical: 20,
//     alignItems: 'center',
//   },
// });

// export default AICoursesScreen;
