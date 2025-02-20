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

// Child Components (make sure these use React.memo if possible)
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

// Pagination limits
const PAGE_LIMIT = 10;
const REELS_LIMIT = 5;
const HEADER_HEIGHT = 220;

const AICoursesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // ----------------------- Course State -----------------------
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------- Reels State -----------------------
  const [reels, setReels] = useState([]);
  const [reelsPage, setReelsPage] = useState(1);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [loadingMoreReels, setLoadingMoreReels] = useState(false);

  // ----------------------- Ads State -----------------------
  const [ads, setAds] = useState([]);
  const [fetchedAdsOnce, setFetchedAdsOnce] = useState(false);

  // ----------------------- Search State -----------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef(null);

  // ----------------------- Animations & Layout -----------------------
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
  const cardWidth = useMemo(() => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  }, [width, numColumns]);

  // ---------------------------------------------------------------------------
  // fetch courses (and optionally ads)
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setPage(1);
          setHasMore(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const currentPage = isRefresh ? 1 : page;
        const coursesPromise = fetchCourses(currentPage, PAGE_LIMIT);
        // Fetch ads only once or on refresh
        const adsPromise = !fetchedAdsOnce || isRefresh ? fetchAds() : null;

        const [coursesResponse, adsResponse] = await Promise.all([
          coursesPromise,
          adsPromise,
        ]);

        // handle courses
        if (coursesResponse.success) {
          const newCourses = coursesResponse.data.map((c) => ({
            ...c,
            id: c._id,
          }));

          if (isRefresh) {
            setCourses(newCourses);
            setPage(2);
          } else {
            setCourses((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const filtered = newCourses.filter(
                (item) => !existingIds.has(item.id)
              );
              return [...prev, ...filtered];
            });
            setPage(currentPage + 1);
          }

          if (newCourses.length < PAGE_LIMIT) {
            setHasMore(false);
          }
        }

        // handle ads
        if (adsPromise) {
          if (adsResponse?.success) {
            setAds(adsResponse.data);
            setFetchedAdsOnce(true);
          } else {
            setAds([]);
          }
        }

        // fade-in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        console.log('fetchData error', err);
      } finally {
        setRefreshing(false);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, fadeAnim, fetchedAdsOnce]
  );

  // ---------------------------------------------------------------------------
  // fetch Reels (allow repeated loads for infinite scroll)
  // ---------------------------------------------------------------------------
  const fetchReelsData = useCallback(async () => {
    try {
      setLoadingMoreReels(true);

      const reelsResponse = await fetchFeaturedReels(reelsPage, REELS_LIMIT);
      if (reelsResponse.success) {
        const newReels = reelsResponse.data.map((r) => ({
          ...r,
          id: r._id,
        }));
        setReels((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = newReels.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filtered];
        });

        if (newReels.length < REELS_LIMIT) {
          setHasMoreReels(false);
        } else {
          setHasMoreReels(true);
        }
        setReelsPage((prev) => prev + 1);
      }
    } catch (err) {
      console.log('fetchReelsData error', err);
    } finally {
      setLoadingMoreReels(false);
    }
  }, [reelsPage]);

  // ---------------------------------------------------------------------------
  // refresh all
  // ---------------------------------------------------------------------------
  const refreshAll = useCallback(() => {
    setHasMore(true);
    setHasMoreReels(true);
    setReelsPage(1);
    setReels([]);
    setAds([]);
    setFetchedAdsOnce(false);

    fetchData(true);
    fetchReelsData();
  }, [fetchData, fetchReelsData]);

  // ---------------------------------------------------------------------------
  // on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // search (debounced 200ms)
  // ---------------------------------------------------------------------------
  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text.trim());
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!text.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const result = await searchCoursesAPI(text.trim());
        if (result.success && result.data) {
          const mapped = result.data.map((c) => ({
            ...c,
            id: c._id,
          }));
          setSearchSuggestions(mapped);
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.log('search error', err);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  }, []);

  const handleSuggestionPress = useCallback(
    (course) => {
      setSearchTerm(course.title);
      setShowSuggestions(false);
      navigation.navigate('CourseDetailScreen', { courseId: course.id });
    },
    [navigation]
  );

  // ---------------------------------------------------------------------------
  // Load more courses
  // ---------------------------------------------------------------------------
  const handleLoadMoreCourses = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchData();
    }
  }, [loadingMore, hasMore, fetchData]);

  // Load more reels
  const handleLoadMoreReels = useCallback(() => {
    if (!loadingMoreReels && hasMoreReels) {
      fetchReelsData();
    }
  }, [loadingMoreReels, hasMoreReels, fetchReelsData]);

  // ---------------------------------------------------------------------------
  // UI Handlers
  // ---------------------------------------------------------------------------
  const handleFeaturedPress = useCallback((course) => {
    Alert.alert('Featured Press', course.title);
  }, []);

  const handleAdPress = useCallback((ad) => {
    Alert.alert('Ad Pressed', ad.title);
  }, []);

  // ---------------------------------------------------------------------------
  // Render items
  // ---------------------------------------------------------------------------
  const renderCourse = useCallback(
    ({ item }) => (
      <CourseCard
        course={item}
        cardWidth={cardWidth}
        currentTheme={currentTheme}
      />
    ),
    [cardWidth, currentTheme]
  );

  const getItemLayout = useCallback(
    (_, index) => {
      const CARD_HEIGHT = 300;
      const row = Math.floor(index / numColumns);
      return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
    },
    [numColumns]
  );

  // ---------------------------------------------------------------------------
  // Conditional Sections in Header
  // ---------------------------------------------------------------------------
  const renderHeader = useCallback(() => (
    <View>
      {/* If reels exist, show Featured Courses section */}
      {reels.length > 0 && (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
            Featured Courses
          </Text>
          <View style={styles.sectionDivider} />
          <FlatList
            data={reels}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FeaturedReel
                course={item}
                reelWidth={width * 0.35}
                reelHeight={220}
                onPress={() => handleFeaturedPress(item)}
                currentTheme={currentTheme}
                reelsData={reels}
                onRequestMoreReels={handleLoadMoreReels}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reelsContainer}
          />
        </View>
      )}

      {/* If ads exist, show Sponsored Ads section */}
      {ads.length > 0 && (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
            Sponsored Ads
          </Text>
          <View style={styles.sectionDivider} />
          <NewCourseAdsList
            ads={ads}
            onAdPress={handleAdPress}
            currentTheme={currentTheme}
          />
        </View>
      )}

      {/* If courses exist, show All Courses title */}
      {courses.length > 0 && (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
            All Courses
          </Text>
          <View style={styles.sectionDivider} />
        </View>
      )}
    </View>
  ), [
    reels,
    ads,
    courses,
    currentTheme,
    width,
    handleFeaturedPress,
    handleAdPress,
    handleLoadMoreReels,
  ]);

  // For an empty course list
  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
          No courses available.
        </Text>
      </View>
    ),
    [currentTheme]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
      </View>
    );
  }, [loadingMore, currentTheme]);

  // If no data at all (initial load)
  if (loading && courses.length === 0 && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}
      >
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>
          Loading courses...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={
          currentTheme.headerBackground
            ? currentTheme.headerBackground[0]
            : currentTheme.primaryColor
        }
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      {/* Custom Header (logo, side icons, etc.) */}
      <CustomHeader />

      {/* Hero/Gradient Header */}
      <View style={styles.headerArea}>
        <LinearGradient
          colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
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
      </View>

      {/* Suggestion dropdown */}
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
                <Ionicons
                  name="book-outline"
                  size={18}
                  color="#555"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.suggestionText, { color: currentTheme.textColor }]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={5}
            maxToRenderPerBatch={8}
            windowSize={11}
          />
        </View>
      )}

      {/* Content */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
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
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
        />
      </Animated.View>

      {/* Overlay loader if loading in background */}
      {loading && courses.length > 0 && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: currentTheme.backgroundColor + 'cc' },
          ]}
        >
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
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

  // Modern Hero Header
  headerArea: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT + 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 6,
    zIndex: 999,
    maxHeight: 220,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.6,
    borderBottomColor: '#ddd',
  },
  suggestionText: {
    fontSize: 14,
  },

  // Main Content
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  },

  // Sections
  sectionWrapper: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 15,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
    borderRadius: 2,
  },
  reelsContainer: {
    paddingLeft: 15,
    paddingBottom: 10,
  },

  // Empty
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
//   TextInput,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// // Memoized versions of your components
// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';      // Ensure React.memo
// import FeaturedReel from '../components/FeaturedReel';  // Ensure React.memo
// import NewCourseAdsList from '../components/NewCourseAdsList';

// import {
//   fetchCourses,
//   fetchFeaturedReels,
//   fetchAds,
//   searchCoursesAPI,
// } from '../services/api';

// // Pagination limits
// const PAGE_LIMIT = 10;
// const REELS_LIMIT = 5;
// const HEADER_HEIGHT = 180;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();
//   const navigation = useNavigation();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);       // for initial load
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- Reels State -----------------------
//   const [reels, setReels] = useState([]);
//   const [reelsPage, setReelsPage] = useState(1);
//   const [hasMoreReels, setHasMoreReels] = useState(true);
//   const [loadingMoreReels, setLoadingMoreReels] = useState(false);

//   // ----------------------- Ads State -----------------------
//   const [ads, setAds] = useState([]);
//   const [fetchedAdsOnce, setFetchedAdsOnce] = useState(false);

//   // Fade-in animation
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // ----------------------- Layout & Memo -----------------------
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ---------------------------------------------------------------------------
//   // fetch courses (and optionally ads)
//   // ---------------------------------------------------------------------------
//   const fetchData = useCallback(
//     async (isRefresh = false) => {
//       try {
//         if (isRefresh) {
//           setRefreshing(true);
//           setPage(1);
//           setHasMore(true);
//         } else if (page === 1) {
//           setLoading(true);
//         } else {
//           setLoadingMore(true);
//         }

//         const currentPage = isRefresh ? 1 : page;

//         // We'll fetch courses, ads only once (or on refresh)
//         const coursesPromise = fetchCourses(currentPage, PAGE_LIMIT);
//         const adsPromise = !fetchedAdsOnce || isRefresh ? fetchAds() : null;

//         const [coursesResponse, adsResponse] = await Promise.all([
//           coursesPromise,
//           adsPromise,
//         ]);

//         // handle courses
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((c) => ({
//             ...c,
//             id: c._id, // unify the ID field
//           }));

//           if (isRefresh) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newCourses.filter((item) => !existingIds.has(item.id));
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

//         // handle ads if we have an adsPromise
//         if (adsPromise && adsResponse?.success) {
//           setAds(adsResponse.data);
//           setFetchedAdsOnce(true);
//         } else if (adsPromise && !adsResponse?.success) {
//           setAds([]);
//         }

//         // fade-in
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       } catch (err) {
//         console.log('fetchData error', err);
//       } finally {
//         setRefreshing(false);
//         setLoading(false);
//         setLoadingMore(false);
//       }
//     },
//     [page, fadeAnim, fetchedAdsOnce]
//   );

//   // ---------------------------------------------------------------------------
//   // fetch Reels (allow repeated loads for infinite scroll)
//   // ---------------------------------------------------------------------------
//   const fetchReelsData = useCallback(async () => {
//     try {
//       setLoadingMoreReels(true);

//       const reelsResponse = await fetchFeaturedReels(reelsPage, REELS_LIMIT);
//       if (reelsResponse.success) {
//         const newReels = reelsResponse.data.map((r) => ({
//           ...r,
//           id: r._id,
//         }));
//         setReels((prev) => {
//           const existingIds = new Set(prev.map((item) => item.id));
//           const filtered = newReels.filter((item) => !existingIds.has(item.id));
//           return [...prev, ...filtered];
//         });

//         if (newReels.length < REELS_LIMIT) {
//           setHasMoreReels(false);
//         } else {
//           setHasMoreReels(true);
//         }
//         setReelsPage((prev) => prev + 1);
//       }
//     } catch (err) {
//       console.log('fetchReelsData error', err);
//     } finally {
//       setLoadingMoreReels(false);
//     }
//   }, [reelsPage]);

//   // ---------------------------------------------------------------------------
//   // refresh all
//   // ---------------------------------------------------------------------------
//   const refreshAll = useCallback(() => {
//     setHasMore(true);
//     setHasMoreReels(true);
//     setReelsPage(1);
//     setReels([]);
//     setAds([]);
//     setFetchedAdsOnce(false);

//     fetchData(true);
//     // Reels start from 1 again
//     fetchReelsData();
//   }, [fetchData, fetchReelsData]);

//   // ---------------------------------------------------------------------------
//   // on mount
//   // ---------------------------------------------------------------------------
//   useEffect(() => {
//     refreshAll();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------------------------------------------------------------------------
//   // search (debounced 200ms)
//   // ---------------------------------------------------------------------------
//   const handleSearchChange = useCallback((text) => {
//     setSearchTerm(text.trim());

//     if (searchTimeout.current) {
//       clearTimeout(searchTimeout.current);
//     }

//     if (!text.trim()) {
//       setSearchSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }

//     searchTimeout.current = setTimeout(async () => {
//       try {
//         const result = await searchCoursesAPI(text.trim());
//         if (result.success && result.data) {
//           const mapped = result.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));
//           setSearchSuggestions(mapped);
//           setShowSuggestions(true);
//         } else {
//           setSearchSuggestions([]);
//           setShowSuggestions(false);
//         }
//       } catch (err) {
//         console.log('search error', err);
//         setSearchSuggestions([]);
//         setShowSuggestions(false);
//       }
//     }, 200);
//   }, []);

//   const handleSuggestionPress = useCallback(
//     (course) => {
//       setSearchTerm(course.title);
//       setShowSuggestions(false);
//       navigation.navigate('CourseDetailScreen', { courseId: course.id });
//     },
//     [navigation]
//   );

//   // ---------------------------------------------------------------------------
//   // Load more courses
//   // ---------------------------------------------------------------------------
//   const handleLoadMoreCourses = useCallback(() => {
//     if (!loadingMore && hasMore) {
//       fetchData();
//     }
//   }, [loadingMore, hasMore, fetchData]);

//   // Load more reels
//   const handleLoadMoreReels = useCallback(() => {
//     if (!loadingMoreReels && hasMoreReels) {
//       fetchReelsData();
//     }
//   }, [loadingMoreReels, hasMoreReels, fetchReelsData]);

//   // ---------------------------------------------------------------------------
//   // UI Handlers
//   // ---------------------------------------------------------------------------
//   const handleFeaturedPress = useCallback((course) => {
//     Alert.alert('Featured Press', course.title);
//   }, []);

//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('Ad Pressed', ad.title);
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
//     (_, index) => {
//       const CARD_HEIGHT = 300;
//       const row = Math.floor(index / numColumns);
//       return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
//     },
//     [numColumns]
//   );

//   // Header
//   const renderHeader = useCallback(() => {
//     return (
//       <View>
//         {/* Featured Reels */}
//         <View style={styles.featuredSection}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Featured Courses
//           </Text>
//           <FlatList
//             data={reels}
//             horizontal
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <FeaturedReel
//                 course={item}
//                 reelWidth={width * 0.35}
//                 reelHeight={220}
//                 onPress={() => handleFeaturedPress(item)}
//                 currentTheme={currentTheme}
//                 reelsData={reels}
//                 // Let the reel component request more reels
//                 onRequestMoreReels={handleLoadMoreReels}
//               />
//             )}
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.reelsContainer}
//             // We'll let the vertical scroll in the modal handle infinite reels
//             // so you can remove onEndReached from here or leave it if you want horizontal fetch
//             onEndReachedThreshold={0.5}
//           />
//         </View>

//         {/* Ads */}
//         <View style={styles.adsSection}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Sponsored Ads
//           </Text>
//           <View style={{ marginTop: 0 }}>
//             <NewCourseAdsList
//               ads={ads}
//               onAdPress={handleAdPress}
//               currentTheme={currentTheme}
//             />
//           </View>
//         </View>

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
//     ads,
//     handleAdPress,
//     handleLoadMoreReels,
//   ]);

//   const renderEmptyComponent = useCallback(() => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No courses available.</Text>
//     </View>
//   ), [currentTheme]);

//   const renderFooter = useCallback(() => {
//     if (!loadingMore) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }, [loadingMore, currentTheme]);

//   // If no data initially
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
//       </SafeAreaView>
//     );
//   }

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

//       {/* Header with gradient + search */}
//       <View style={styles.headerArea}>
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

//           {/* Search bar */}
//           <View style={styles.searchBarContainer}>
//             <Ionicons name="search" size={20} color="#999" style={{ marginHorizontal: 8 }} />
//             <TextInput
//               placeholder="Search courses..."
//               placeholderTextColor="#999"
//               style={[styles.searchInput, { color: currentTheme.textColor }]}
//               value={searchTerm}
//               onChangeText={handleSearchChange}
//             />
//           </View>
//         </LinearGradient>
//       </View>

//       {/* Suggestion dropdown */}
//       {showSuggestions && searchSuggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           <FlatList
//             data={searchSuggestions}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={styles.suggestionItem}
//                 onPress={() => handleSuggestionPress(item)}
//               >
//                 <Ionicons
//                   name="book-outline"
//                   size={18}
//                   color="#555"
//                   style={{ marginRight: 8 }}
//                 />
//                 <Text style={[styles.suggestionText, { color: currentTheme.textColor }]}>
//                   {item.title}
//                 </Text>
//               </TouchableOpacity>
//             )}
//             keyboardShouldPersistTaps="handled"
//             initialNumToRender={5}
//             maxToRenderPerBatch={8}
//             windowSize={11}
//           />
//         </View>
//       )}

//       {/* Content */}
//       <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//         <FlatList
//           data={courses}
//           keyExtractor={(item) => item.id}
//           renderItem={renderCourse}
//           numColumns={numColumns}
//           ListHeaderComponent={renderHeader}
//           ListEmptyComponent={renderEmptyComponent}
//           ListFooterComponent={renderFooter}
//           contentContainerStyle={[styles.listContent,
//             { paddingBottom: 100 } 
//           ]}
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
//           maxToRenderPerBatch={10}
//           updateCellsBatchingPeriod={50}
//           getItemLayout={getItemLayout}
//         />
//       </Animated.View>

//       {/* Overlay loader if loading in background */}
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
//     top: 0, left: 0, right: 0, bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 99,
//   },

//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
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
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     marginTop: 2,
//   },

//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 40,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   suggestionsContainer: {
//     position: 'absolute',
//     top: HEADER_HEIGHT + 40,
//     left: 20,
//     right: 20,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     elevation: 6,
//     zIndex: 999,
//     maxHeight: 220,
//     overflow: 'hidden',
//     alignSelf: 'center',
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderBottomWidth: 0.6,
//     borderBottomColor: '#ddd',
//   },
//   suggestionText: {
//     fontSize: 14,
//   },

//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginVertical: 15,
//     marginHorizontal: 15,
//   },
//   featuredSection: {
//     marginBottom: 20,
//   },
//   reelsContainer: {
//     paddingLeft: 15,
//     paddingBottom: 10,
//   },
//   adsSection: {
//     marginHorizontal: 15,
//     marginBottom: 20,
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
//   TextInput,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// // Memoized versions of your components
// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';      // Make sure CourseCard is exported with React.memo
// import FeaturedReel from '../components/FeaturedReel';  // Also exported with React.memo
// import NewCourseAdsList from '../components/NewCourseAdsList';

// import {
//   fetchCourses,
//   fetchFeaturedReels,
//   fetchAds,
//   searchCoursesAPI,
// } from '../services/api';

// // Pagination limits
// const PAGE_LIMIT = 10;
// const REELS_LIMIT = 5;
// const HEADER_HEIGHT = 180;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();
//   const navigation = useNavigation();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);       // for initial load
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- Reels State -----------------------
//   const [reels, setReels] = useState([]);
//   const [reelsPage, setReelsPage] = useState(1);
//   const [hasMoreReels, setHasMoreReels] = useState(true);
//   const [loadingMoreReels, setLoadingMoreReels] = useState(false);
//   const [fetchedReelsOnce, setFetchedReelsOnce] = useState(false);

//   // ----------------------- Ads State -----------------------
//   const [ads, setAds] = useState([]);
//   const [fetchedAdsOnce, setFetchedAdsOnce] = useState(false);

//   // Fade-in animation
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // ----------------------- Layout & Memo -----------------------
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ---------------------------------------------------------------------------
//   // fetch courses (and optionally ads) - we fetch ads once unless refreshing
//   // ---------------------------------------------------------------------------
//   const fetchData = useCallback(
//     async (isRefresh = false) => {
//       try {
//         if (isRefresh) {
//           setRefreshing(true);
//           setPage(1);
//           setHasMore(true);
//         } else if (page === 1) {
//           setLoading(true);
//         } else {
//           setLoadingMore(true);
//         }

//         const currentPage = isRefresh ? 1 : page;

//         // We'll fetch courses always, ads only once or if refreshing
//         const coursesPromise = fetchCourses(currentPage, PAGE_LIMIT);
//         const adsPromise = !fetchedAdsOnce || isRefresh ? fetchAds() : null;

//         const [coursesResponse, adsResponse] = await Promise.all([
//           coursesPromise,
//           adsPromise,
//         ]);

//         // handle courses
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((c) => ({
//             ...c,
//             id: c._id, // unify the ID field
//           }));

//           if (isRefresh) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newCourses.filter((item) => !existingIds.has(item.id));
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

//         // handle ads if we have an adsPromise
//         if (adsPromise && adsResponse?.success) {
//           setAds(adsResponse.data);
//           setFetchedAdsOnce(true);
//         } else if (adsPromise && !adsResponse?.success) {
//           setAds([]);
//         }

//         // fade-in
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       } catch (err) {
//         console.log('fetchData error', err);
//       } finally {
//         setRefreshing(false);
//         setLoading(false);
//         setLoadingMore(false);
//       }
//     },
//     [page, fadeAnim, fetchedAdsOnce]
//   );

//   // ---------------------------------------------------------------------------
//   // fetch Reels - only once unless refreshing
//   // ---------------------------------------------------------------------------
//   const fetchReelsData = useCallback(
//     async (isRefresh = false) => {
//       try {
//         if (isRefresh) {
//           setReelsPage(1);
//           setHasMoreReels(true);
//         } else if (fetchedReelsOnce) {
//           return; // skip if we've already fetched once
//         }
//         setLoadingMoreReels(true);

//         const currentPage = isRefresh ? 1 : reelsPage;
//         const reelsResponse = await fetchFeaturedReels(currentPage, REELS_LIMIT);

//         if (reelsResponse.success) {
//           const newReels = reelsResponse.data.map((r) => ({
//             ...r,
//             id: r._id,
//           }));
//           if (isRefresh) {
//             setReels(newReels);
//             setReelsPage(2);
//           } else {
//             setReels((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newReels.filter((item) => !existingIds.has(item.id));
//               return [...prev, ...filtered];
//             });
//             setReelsPage(currentPage + 1);
//             setFetchedReelsOnce(true);
//           }
//           if (newReels.length < REELS_LIMIT) {
//             setHasMoreReels(false);
//           }
//         }
//       } catch (err) {
//         console.log('fetchReelsData error', err);
//       } finally {
//         setLoadingMoreReels(false);
//       }
//     },
//     [reelsPage, fetchedReelsOnce]
//   );

//   // ---------------------------------------------------------------------------
//   // refresh all
//   // ---------------------------------------------------------------------------
//   const refreshAll = useCallback(() => {
//     setHasMore(true);
//     setHasMoreReels(true);
//     setFetchedReelsOnce(false);
//     setFetchedAdsOnce(false);
//     fetchData(true);
//     fetchReelsData(true);
//   }, [fetchData, fetchReelsData]);

//   // ---------------------------------------------------------------------------
//   // on mount
//   // ---------------------------------------------------------------------------
//   useEffect(() => {
//     refreshAll();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------------------------------------------------------------------------
//   // search (debounced 200ms)
//   // ---------------------------------------------------------------------------
//   const handleSearchChange = useCallback((text) => {
//     setSearchTerm(text.trim());

//     if (searchTimeout.current) {
//       clearTimeout(searchTimeout.current);
//     }

//     if (!text.trim()) {
//       setSearchSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }

//     // shorter debounce for faster feedback
//     searchTimeout.current = setTimeout(async () => {
//       try {
//         const result = await searchCoursesAPI(text.trim());
//         if (result.success && result.data) {
//           const mapped = result.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));
//           setSearchSuggestions(mapped);
//           setShowSuggestions(true);
//         } else {
//           setSearchSuggestions([]);
//           setShowSuggestions(false);
//         }
//       } catch (err) {
//         console.log('search error', err);
//         setSearchSuggestions([]);
//         setShowSuggestions(false);
//       }
//     }, 200);
//   }, []);

//   const handleSuggestionPress = useCallback((course) => {
//     setSearchTerm(course.title);
//     setShowSuggestions(false);
//     navigation.navigate('CourseDetailScreen', { courseId: course.id });
//   }, [navigation]);

//   // ---------------------------------------------------------------------------
//   // Load more courses
//   // ---------------------------------------------------------------------------
//   const handleLoadMoreCourses = useCallback(() => {
//     if (!loadingMore && hasMore) {
//       fetchData();
//     }
//   }, [loadingMore, hasMore, fetchData]);

//   // Load more reels
//   const handleLoadMoreReels = useCallback(() => {
//     // only load more if we haven't fetched reels once or if refreshing
//     if (!loadingMoreReels && hasMoreReels && !fetchedReelsOnce) {
//       fetchReelsData();
//     }
//   }, [loadingMoreReels, hasMoreReels, fetchedReelsOnce, fetchReelsData]);

//   // ---------------------------------------------------------------------------
//   // UI Handlers
//   // ---------------------------------------------------------------------------
//   const handleFeaturedPress = useCallback((course) => {
//     Alert.alert('Featured Press', course.title);
//   }, []);

//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('Ad Pressed', ad.title);
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Render items
//   // ---------------------------------------------------------------------------
//   const renderCourse = useCallback(
//     ({ item }) => (
//       <CourseCard course={item} cardWidth={cardWidth} currentTheme={currentTheme} />
//     ),
//     [cardWidth, currentTheme]
//   );

//   const getItemLayout = useCallback(
//     (_, index) => {
//       const CARD_HEIGHT = 300;
//       const row = Math.floor(index / numColumns);
//       return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
//     },
//     [numColumns]
//   );

//   // Header
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* Featured Reels */}
//       <View style={styles.featuredSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <FlatList
//           data={reels}
//           horizontal
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <FeaturedReel
//               course={item}
//               reelWidth={width * 0.35}
//               reelHeight={220}
//               onPress={() => handleFeaturedPress(item)}
//               currentTheme={currentTheme}
//               reelsData={reels}
//             />
//           )}
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.reelsContainer}
//           onEndReached={handleLoadMoreReels}
//           onEndReachedThreshold={0.1}
//           ListFooterComponent={
//             loadingMoreReels ? (
//               <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//             ) : null
//           }
//         />
//       </View>

//       {/* Ads */}
//       <View style={styles.adsSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Sponsored Ads
//         </Text>
//         <View style={{ marginTop: 0 }}>
//           <NewCourseAdsList ads={ads} onAdPress={handleAdPress} currentTheme={currentTheme} />
//         </View>
//       </View>

//       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//         All Courses
//       </Text>
//     </View>
//   ), [
//     reels,
//     currentTheme,
//     width,
//     handleFeaturedPress,
//     handleLoadMoreReels,
//     loadingMoreReels,
//     ads,
//     handleAdPress,
//   ]);

//   const renderEmptyComponent = useCallback(() => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No courses available.</Text>
//     </View>
//   ), [currentTheme]);

//   const renderFooter = useCallback(() => {
//     if (!loadingMore) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }, [loadingMore, currentTheme]);

//   // If no data initially
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
//       </SafeAreaView>
//     );
//   }

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

//       {/* Header with gradient + search */}
//       <View style={styles.headerArea}>
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

//           {/* Search bar */}
//           <View style={styles.searchBarContainer}>
//             <Ionicons name="search" size={20} color="#999" style={{ marginHorizontal: 8 }} />
//             <TextInput
//               placeholder="Search courses..."
//               placeholderTextColor="#999"
//               style={[styles.searchInput, { color: currentTheme.textColor }]}
//               value={searchTerm}
//               onChangeText={handleSearchChange}
//             />
//           </View>
//         </LinearGradient>
//       </View>

//       {/* Suggestion dropdown */}
//       {showSuggestions && searchSuggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           <FlatList
//             data={searchSuggestions}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={styles.suggestionItem}
//                 onPress={() => handleSuggestionPress(item)}
//               >
//                 <Ionicons
//                   name="book-outline"
//                   size={18}
//                   color="#555"
//                   style={{ marginRight: 8 }}
//                 />
//                 <Text style={[styles.suggestionText, { color: currentTheme.textColor }]}>
//                   {item.title}
//                 </Text>
//               </TouchableOpacity>
//             )}
//             // optional performance props
//             keyboardShouldPersistTaps="handled"
//             initialNumToRender={5}
//             maxToRenderPerBatch={8}
//             windowSize={11}
//           />
//         </View>
//       )}

//       {/* Content */}
//       <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//         <FlatList
//           data={courses}
//           keyExtractor={(item) => item.id}
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
//           maxToRenderPerBatch={10}
//           updateCellsBatchingPeriod={50}
//           getItemLayout={getItemLayout}
//         />
//       </Animated.View>

//       {/* Overlay loader if loading in background */}
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
//     top: 0, left: 0, right: 0, bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 99,
//   },

//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
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
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     marginTop: 2,
//   },

//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 40,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   suggestionsContainer: {
//     position: 'absolute',
//     top: HEADER_HEIGHT + 40,
//     left: 20,
//     right: 20,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     elevation: 6,
//     zIndex: 999,
//     maxHeight: 220,
//     overflow: 'hidden',
//     alignSelf: 'center',
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderBottomWidth: 0.6,
//     borderBottomColor: '#ddd',
//   },
//   suggestionText: {
//     fontSize: 14,
//   },

//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginVertical: 15,
//     marginHorizontal: 15,
//   },
//   featuredSection: {
//     marginBottom: 20,
//   },
//   reelsContainer: {
//     paddingLeft: 15,
//     paddingBottom: 10,
//   },
//   adsSection: {
//     marginHorizontal: 15,
//     marginBottom: 20,
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
//   TextInput,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import NewCourseAdsList from '../components/NewCourseAdsList';

// import {
//   fetchCourses,
//   fetchFeaturedReels,
//   fetchAds,
//   searchCoursesAPI,
// } from '../services/api';

// const PAGE_LIMIT = 10;
// const REELS_LIMIT = 5;
// const HEADER_HEIGHT = 180; // for reference in absolute positioning

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();
//   const navigation = useNavigation();

//   // ----------------------- State: Courses -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- State: Reels -----------------------
//   const [reels, setReels] = useState([]);
//   const [reelsPage, setReelsPage] = useState(1);
//   const [hasMoreReels, setHasMoreReels] = useState(true);
//   const [loadingMoreReels, setLoadingMoreReels] = useState(false);

//   // ----------------------- State: Ads -----------------------
//   const [ads, setAds] = useState([]);

//   // ----------------------- Animated fade-in -----------------------
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // ----------------------- Search Suggestions -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   const searchTimeout = useRef(null);

//   // ----------------------- Layout Calculations -----------------------
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ----------------------- Fetch Courses & Ads -----------------------
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
//         const [coursesResponse, adsResponse] = await Promise.all([
//           fetchCourses(currentPage, PAGE_LIMIT),
//           fetchAds(),
//         ]);

//         // Transform courses: assign item.id = item._id
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((course) => ({
//             ...course,
//             id: course._id, // store _id in id
//           }));

//           if (isRefreshing) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((c) => c.id));
//               const filtered = newCourses.filter((c) => !existingIds.has(c.id));
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }
//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

//         // Ads
//         if (adsResponse.success) {
//           setAds(adsResponse.data);
//         } else {
//           setAds([]);
//         }

//         // Animate
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       } catch (err) {
//         console.error('fetchData error:', err);
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//         setRefreshing(false);
//       }
//     },
//     [page, fadeAnim]
//   );

//   // ----------------------- Fetch Reels -----------------------
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
//           // assign item.id = item._id
//           const fetchedReels = reelsResponse.data.map((r) => ({
//             ...r,
//             id: r._id,
//           }));

//           if (isRefreshing) {
//             setReels(fetchedReels);
//             setReelsPage(2);
//           } else {
//             // Deduplicate
//             const newItems = fetchedReels.filter(
//               (r) => !reels.some((existing) => existing.id === r.id)
//             );
//             if (newItems.length === 0) {
//               setHasMoreReels(false);
//             } else {
//               setReels((prev) => [...prev, ...newItems]);
//               setReelsPage(currentPage + 1);
//             }
//           }

//           if (fetchedReels.length < REELS_LIMIT) {
//             setHasMoreReels(false);
//           }
//         }
//       } catch (err) {
//         console.error('fetchReels error:', err);
//       } finally {
//         setLoadingMoreReels(false);
//       }
//     },
//     [reels, reelsPage]
//   );

//   // ----------------------- Refresh All -----------------------
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

//   // ----------------------- Search (Debounced) -----------------------
//   const handleSearchChange = useCallback((text) => {
//     setSearchTerm(text);

//     // Clear previous timer
//     if (searchTimeout.current) {
//       clearTimeout(searchTimeout.current);
//     }

//     // If user cleared text, hide suggestions
//     if (!text) {
//       setSearchSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }

//     // Wait 400ms, then call search
//     searchTimeout.current = setTimeout(async () => {
//       try {
//         const result = await searchCoursesAPI(text);
//         if (result.success && result.data) {
//           // Convert each to { id: _id, ... }
//           const mapped = result.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));
//           setSearchSuggestions(mapped);
//           setShowSuggestions(true);
//         } else {
//           setSearchSuggestions([]);
//           setShowSuggestions(false);
//         }
//       } catch (err) {
//         console.error('search error', err);
//         setSearchSuggestions([]);
//         setShowSuggestions(false);
//       }
//     }, 400);
//   }, []);

//   // When user taps on a suggestion
//   const handleSuggestionPress = useCallback((course) => {
//     setSearchTerm(course.title);
//     setShowSuggestions(false);
//     navigation.navigate('CourseDetailScreen', { courseId: course._id});
//   }, [navigation]);

//   // ----------------------- Load More: Courses / Reels -----------------------
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

//   // ----------------------- UI Handlers -----------------------
//   const handleFeaturedPress = useCallback((course) => {
//     Alert.alert('Course Details', `Featured Course: ${course.title}`);
//   }, []);

//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('New Courses', `Ad clicked: ${ad.title}`);
//   }, []);

//   // Render each course
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
//     (_, index) => {
//       const CARD_HEIGHT = 300;
//       const row = Math.floor(index / numColumns);
//       return { length: CARD_HEIGHT, offset: row * CARD_HEIGHT, index };
//     },
//     [numColumns]
//   );

//   // Header: Reels + Ads
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* Featured Reels */}
//       <View style={styles.featuredSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <FlatList
//           data={reels}
//           horizontal
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <FeaturedReel
//               course={item}
//               reelWidth={width * 0.35}
//               reelHeight={220}
//               onPress={() => handleFeaturedPress(item)}
//               currentTheme={currentTheme}
//               reelsData={reels}
//             />
//           )}
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.reelsContainer}
//           onEndReached={handleLoadMoreReels}
//           onEndReachedThreshold={0.1}
//           ListFooterComponent={
//             loadingMoreReels ? (
//               <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//             ) : null
//           }
//         />
//       </View>

//       {/* Ads */}
//       <View style={styles.adsSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Sponsored Ads
//         </Text>
//         <View style={{ marginTop: 0 }}>
//           <NewCourseAdsList ads={ads} onAdPress={handleAdPress} currentTheme={currentTheme} />
//         </View>
//       </View>

//       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//         All Courses
//       </Text>
//     </View>
//   ), [
//     reels,
//     currentTheme,
//     width,
//     handleFeaturedPress,
//     handleLoadMoreReels,
//     loadingMoreReels,
//     ads,
//     handleAdPress,
//   ]);

//   const renderEmptyComponent = useCallback(() => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No courses available.</Text>
//     </View>
//   ), [currentTheme]);

//   const renderFooter = useCallback(() => {
//     if (!loadingMore) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }, [loadingMore, currentTheme]);

//   // If no data initially
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading courses...</Text>
//       </SafeAreaView>
//     );
//   }

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

//       {/* Gradient Header + Search */}
//       <View style={styles.headerArea}>
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

//           {/* Search bar */}
//           <View style={styles.searchBarContainer}>
//             <Ionicons name="search" size={20} color="#999" style={{ marginHorizontal: 8 }} />
//             <TextInput
//               placeholder="Search courses..."
//               placeholderTextColor="#999"
//               style={[styles.searchInput, { color: currentTheme.textColor }]}
//               value={searchTerm}
//               onChangeText={handleSearchChange}
//             />
//           </View>
//         </LinearGradient>
//       </View>

//       {/* Suggestion dropdown - placed *AFTER* the header so it's not clipped */}
//       {showSuggestions && searchSuggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           <FlatList
//             data={searchSuggestions}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={styles.suggestionItem}
//                 onPress={() => handleSuggestionPress(item)}
//               >
//                 <Ionicons
//                   name="book-outline"
//                   size={18}
//                   color="#555"
//                   style={{ marginRight: 8 }}
//                 />
//                 <Text style={[styles.suggestionText, { color: currentTheme.textColor }]}>
//                   {item.title}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           />
//         </View>
//       )}

//       {/* Main Content */}
//       <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//         <FlatList
//           data={courses}
//           keyExtractor={(item) => item.id}
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

//       {/* Overlay loader if loading more in background */}
//       {loading && courses.length > 0 && (
//         <View style={[styles.loadingOverlay, { backgroundColor: currentTheme.backgroundColor + 'cc' }]}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// // ---------------------------------------------------------------------------
// // Styles
// // ---------------------------------------------------------------------------
// // const HEADER_HEIGHT = 180; // matches the style's headerArea height

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loadingScreen: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0, left: 0, right: 0, bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 99,
//   },

//   // The top header area
//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
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
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     marginTop: 2,
//   },

//   // Search bar
//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 40,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   // Now we position the suggestions absolutely BELOW the header
//   suggestionsContainer: {
//     position: 'absolute',
//     top: HEADER_HEIGHT + 40, // below the header
//     left: 20,
//     right: 20,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     elevation: 6,
//     zIndex: 999,          // ensure it sits on top
//     maxHeight: 220,
//     overflow: 'hidden',
//     alignSelf: 'center',
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderBottomWidth: 0.6,
//     borderBottomColor: '#ddd',
//   },
//   suggestionText: {
//     fontSize: 14,
//   },

//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginVertical: 15,
//     marginHorizontal: 15,
//   },
//   featuredSection: {
//     marginBottom: 20,
//   },
//   reelsContainer: {
//     paddingLeft: 15,
//     paddingBottom: 10,
//   },
//   adsSection: {
//     marginHorizontal: 15,
//     marginBottom: 20,
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
