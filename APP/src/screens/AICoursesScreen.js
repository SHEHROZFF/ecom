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

import { useNavigation } from '@react-navigation/native'; // for navigating to detail

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

  // 1) Main states for courses
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 2) Reels
  const [reels, setReels] = useState([]);
  const [reelsPage, setReelsPage] = useState(1);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [loadingMoreReels, setLoadingMoreReels] = useState(false);

  // 3) Ads
  const [ads, setAds] = useState([]);

  // 4) Animated fade
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 5) Searching for suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce timer
  const searchTimeout = useRef(null);

  // For layout
  const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
  const cardWidth = useMemo(() => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  }, [width, numColumns]);

  // ---------------------------------------------------------------------------
  // fetchData (courses + ads) same as your original
  // ---------------------------------------------------------------------------
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

        // fetch courses + ads
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

  // ---------------------------------------------------------------------------
  // fetchReels same as your original
  // ---------------------------------------------------------------------------
  const fetchReels = useCallback(
    async (isRefreshing = false) => {
      try {
        if (isRefreshing) {
          setReelsPage(1);
          setHasMoreReels(true);
        }
        setLoadingMoreReels(true);

        const currentPage = isRefreshing ? 1 : reelsPage;
        const reelsResponse = await fetchFeaturedReels(currentPage, REELS_LIMIT);

        if (reelsResponse.success) {
          const fetchedReels = reelsResponse.data.map((item) => ({
            ...item,
            id: item._id,
          }));

          if (isRefreshing) {
            setReels(fetchedReels);
            setReelsPage(2);
          } else {
            const newItems = fetchedReels.filter(
              (r) => !reels.some((existing) => existing.id === r.id)
            );
            if (newItems.length === 0) {
              setHasMoreReels(false);
            } else {
              setReels((prev) => [...prev, ...newItems]);
              setReelsPage(currentPage + 1);
            }
          }
          if (fetchedReels.length < REELS_LIMIT) {
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

  // ---------------------------------------------------------------------------
  // Refresh all
  // ---------------------------------------------------------------------------
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
  // Suggestions: server-side search on each keystroke (debounced)
  // ---------------------------------------------------------------------------
  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.length === 0) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce: only search after 400ms
    searchTimeout.current = setTimeout(async () => {
      try {
        const result = await searchCoursesAPI(text);
        if (result.success && result.data) {
          setSearchSuggestions(result.data); // an array of course suggestions
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('search error', err);
        setSearchSuggestions([]);
      }
    }, 400);
  }, []);

  // When user taps on a suggestion, navigate to detail
  const handleSuggestionPress = useCallback((course) => {
    setSearchTerm(course.title);
    setShowSuggestions(false);

    // Navigate to detail, pass full course object
    navigation.navigate('CourseDetailScreen', { course });
  }, [navigation]);

  // ---------------------------------------------------------------------------
  // Infinite scroll
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
  // UI Handlers
  // ---------------------------------------------------------------------------
  const handleFeaturedPress = useCallback((course) => {
    Alert.alert('Course Details', `Featured Course: ${course.title}`);
  }, []);

  const handleAdPress = useCallback((ad) => {
    Alert.alert('New Courses', `Ad clicked: ${ad.title}`);
  }, []);

  // ---------------------------------------------------------------------------
  // Render Items
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  const renderHeader = useCallback(() => {
    return (
      <View>
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
        {/* Ads Carousel */}
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
    );
  }, [
    reels,
    currentTheme,
    width,
    handleFeaturedPress,
    handleLoadMoreReels,
    loadingMoreReels,
    ads,
    handleAdPress,
  ]);

  // ---------------------------------------------------------------------------
  // Empty & Footer
  // ---------------------------------------------------------------------------
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No courses available.</Text>
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

  // Loading screen if no data initially
  if (loading && courses.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Return
  // ---------------------------------------------------------------------------
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

      {/* Gradient Header with search bar */}
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

          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#999" style={{ marginHorizontal: 8 }} />
            <TextInput
              placeholder="Search courses..."
              placeholderTextColor="#999"
              style={[styles.searchInput, { color: currentTheme.textColor }]}
              value={searchTerm}
              onChangeText={handleSearchChange}
            />
          </View>
        </LinearGradient>

        {/* Suggestion List (conditional) */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={[styles.suggestionText, { color: currentTheme.textColor }]}>
                    {item.title}
                  </Text>
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

      {/* Overlay loader if loading in background */}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
  },
  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: 130,       // just below the search bar
    left: 20,
    right: 20,
    maxHeight: 200, 
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    zIndex: 100,    // above the gradient
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  suggestionText: {
    fontSize: 14,
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
