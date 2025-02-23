// src/screens/AICoursesScreen.js
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';

// Child Components
import CustomHeader from '../components/CustomHeader';
import CourseCard from '../components/CourseCard';
import FeaturedReel from '../components/FeaturedReel';
import AdsSection from '../components/AdsSection';

import {
  fetchCourses,
  searchCoursesAPI,
} from '../services/api';

// Pagination limit for courses
const PAGE_LIMIT = 10;
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

  // ----------------------- Ads Refresh Signal -----------------------
  const [adsRefresh, setAdsRefresh] = useState(0);

  // ----------------------- Search State -----------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef(null);

  // Animations & Layout
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
  const cardWidth = useMemo(() => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  }, [width, numColumns]);

  // ---------------------------------------------------------------------------
  // fetch courses only (ads now handled in AdsSection)
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setPage(1);
          setHasMore(true);
          // Also trigger ads refresh
          setAdsRefresh(prev => prev + 1);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const currentPage = isRefresh ? 1 : page;
        const coursesResponse = await fetchCourses(currentPage, PAGE_LIMIT);
        console.log('fetchCourses response', coursesResponse.data);
        
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
    [page, fadeAnim]
  );

  // Refresh all
  const refreshAll = useCallback(() => {
    setHasMore(true);
    fetchData(true);
  }, [fetchData]);

  // on mount
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
  // Render suggestion (rich card view)
  // ---------------------------------------------------------------------------
  const renderSuggestion = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <View style={styles.suggestionImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.suggestionImage} />
          ) : (
            <Ionicons name="book-outline" size={32} color="#555" />
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.suggestionContent}>
          <Text style={[styles.suggestionTitle, { color: currentTheme.textColor }]}>
            {item.title}
          </Text>
          <Text
            style={[styles.suggestionDescription, { color: currentTheme.textColor }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.suggestionStats}>
            <Text style={[styles.suggestionRating, { color: currentTheme.textColor }]}>
              {item.rating}⭐
            </Text>
            <Text style={[styles.suggestionReviews, { color: currentTheme.textColor }]}>
              {item.reviews} reviews
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [currentTheme, handleSuggestionPress]
  );

  // ---------------------------------------------------------------------------
  // Load more courses
  // ---------------------------------------------------------------------------
  const handleLoadMoreCourses = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchData();
    }
  }, [loadingMore, hasMore, fetchData]);

  // UI Handler for ads
  const handleAdPress = useCallback((ad) => {
    Alert.alert('Ad Pressed', ad.title);
  }, []);

  // Render items
  const renderCourse = useCallback(
    ({ item }) => (
      <CourseCard course={item} cardWidth={cardWidth} currentTheme={currentTheme} />
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
      {/* Featured Courses */}
      <FeaturedReel currentTheme={currentTheme} />

      {/* Ads Section now fully separated */}
      <AdsSection
        currentTheme={currentTheme}
        onAdPress={handleAdPress}
        refreshSignal={adsRefresh}
        categoryFilter= 'New Course'
      />

      {/* All Courses title */}
      {courses.length > 0 && (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
            All Courses
          </Text>
          <View style={styles.sectionDivider} />
        </View>
      )}
    </View>
  ), [currentTheme, handleAdPress, courses.length, adsRefresh]);

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
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
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
      {/* Custom Header */}
      <CustomHeader />

      {/* Hero/Gradient Header */}
      <View style={styles.headerArea}>
        <LinearGradient
          colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
          style={styles.headerGradient}
          start={[0, 0]}
          end={[0, 1]}
        >
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
            AI Courses
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
            Elevate your skills with modern AI education
          </Text>
          {/* Enhanced Search Bar */}
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
            renderItem={renderSuggestion}
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
        <View style={[styles.loadingOverlay, { backgroundColor: currentTheme.backgroundColor + 'cc' }]}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AICoursesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    marginBottom: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
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
  suggestionsContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT + 40,
    left: 30,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 25,
    elevation: 6,
    padding: 10,
    zIndex: 999,
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: '#ddd',
  },
  suggestionImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  featuredBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    // paddingVertical: 2,
    borderRadius: 10,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  suggestionStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  suggestionRating: {
    fontSize: 12,
    marginRight: 10,
  },
  suggestionReviews: {
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
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












// // src/screens/AICoursesScreen.js
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

// // Child Components
// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import AdsSection from '../components/AdsSection';

// import {
//   fetchCourses,
//   searchCoursesAPI,
// } from '../services/api';

// // Pagination limit for courses
// const PAGE_LIMIT = 10;
// const HEADER_HEIGHT = 220;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const navigation = useNavigation();
//   const { width } = useWindowDimensions();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- Ads Refresh Signal -----------------------
//   const [adsRefresh, setAdsRefresh] = useState(0);

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // Animations & Layout
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ---------------------------------------------------------------------------
//   // fetch courses only (ads now handled in AdsSection)
//   // ---------------------------------------------------------------------------
//   const fetchData = useCallback(
//     async (isRefresh = false) => {
//       try {
//         if (isRefresh) {
//           setRefreshing(true);
//           setPage(1);
//           setHasMore(true);
//           // Also trigger ads refresh
//           setAdsRefresh(prev => prev + 1);
//         } else if (page === 1) {
//           setLoading(true);
//         } else {
//           setLoadingMore(true);
//         }

//         const currentPage = isRefresh ? 1 : page;
//         const coursesResponse = await fetchCourses(currentPage, PAGE_LIMIT);
//         console.log('fetchCourses response', coursesResponse.data);
        
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));

//           if (isRefresh) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newCourses.filter(
//                 (item) => !existingIds.has(item.id)
//               );
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

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
//     [page, fadeAnim]
//   );

//   // Refresh all
//   const refreshAll = useCallback(() => {
//     setHasMore(true);
//     fetchData(true);
//   }, [fetchData]);

//   // on mount
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

//   // UI Handler for ads
//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('Ad Pressed', ad.title);
//   }, []);

//   // Render items
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

//   // ---------------------------------------------------------------------------
//   // Conditional Sections in Header
//   // ---------------------------------------------------------------------------
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* Featured Courses */}
//       {/* <View style={styles.sectionWrapper}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <View style={styles.sectionDivider} /> */}
//         <FeaturedReel currentTheme={currentTheme} />
//       {/* </View> */}

//       {/* Ads Section now fully separated */}
//       <AdsSection
//         currentTheme={currentTheme}
//         onAdPress={handleAdPress}
//         refreshSignal={adsRefresh}
//       />

//       {/* All Courses title */}
//       {courses.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             All Courses
//           </Text>
//           <View style={styles.sectionDivider} />
//         </View>
//       )}
//     </View>
//   ), [currentTheme, handleAdPress, courses.length, adsRefresh]);

//   const renderEmptyComponent = useCallback(
//     () => (
//       <View style={styles.emptyContainer}>
//         <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//           No courses available.
//         </Text>
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

//   // If no data at all (initial load)
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>
//           Loading courses...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[0]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Custom Header */}
//       <CustomHeader />

//       {/* Hero/Gradient Header */}
//       <View style={styles.headerArea}>
//         <LinearGradient
//           colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
//           style={styles.headerGradient}
//           start={[0, 0]}
//           end={[0, 1]}
//         >
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             AI Courses
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Elevate your skills with modern AI education
//           </Text>
//           {/* Enhanced Search Bar */}
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
//               <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
//                 <Ionicons name="book-outline" size={18} color="#555" style={{ marginRight: 8 }} />
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
//           contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
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

// export default AICoursesScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 40,
//     borderBottomRightRadius: 40,
//     borderTopLeftRadius: 40,
//     borderTopRightRadius: 40,
//     // marginBottom: 20,
//     marginTop: -8,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 5 },
//   },
//   headerGradient: {
//     flex: 1,
//     paddingHorizontal: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 36,
//     fontWeight: '800',
//     marginBottom: 6,
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   headerSubtitle: {
//     fontSize: 18,
//     marginBottom: 12,
//     opacity: 0.9,
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     paddingHorizontal: 15,
//     height: 50,
//     width: '100%',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     paddingVertical: 0,
//   },
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
//     zIndex: 99,
//   },
//   // headerArea: {
//   //   height: HEADER_HEIGHT,
//   //   overflow: 'hidden',
//   //   borderBottomLeftRadius: 30,
//   //   borderBottomRightRadius: 30,
//   //   marginBottom: 2,
//   //   elevation: 6,
//   //   shadowColor: '#000',
//   //   shadowOpacity: 0.2,
//   //   shadowRadius: 8,
//   //   shadowOffset: { width: 0, height: 4 },
//   // },
//   // headerGradient: {
//   //   flex: 1,
//   //   paddingHorizontal: 20,
//   //   justifyContent: 'center',
//   // },
//   // headerTitle: {
//   //   fontSize: 34,
//   //   fontWeight: '700',
//   //   marginBottom: 4,
//   // },
//   // headerSubtitle: {
//   //   fontSize: 16,
//   //   opacity: 0.9,
//   // },
//   // searchBarContainer: {
//   //   flexDirection: 'row',
//   //   alignItems: 'center',
//   //   marginTop: 14,
//   //   backgroundColor: '#fff',
//   //   borderRadius: 20,
//   //   paddingHorizontal: 10,
//   //   height: 44,
//   // },
//   // searchInput: {
//   //   flex: 1,
//   //   fontSize: 14,
//   //   padding: 0,
//   // },
//   suggestionsContainer: {
//     position: 'absolute',
//     top: HEADER_HEIGHT + 40,
//     left: 30,
//     right: 30,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     elevation: 6,
//     paddingHorizontal: 8,
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
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginTop: 15,
//   },
//   sectionDivider: {
//     height: 2,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//     marginVertical: 8,
//     borderRadius: 2,
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












// // src/screens/AICoursesScreen.js
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

// // Child Components
// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import AdsSection from '../components/AdsSection';

// import {
//   fetchCourses,
//   searchCoursesAPI,
// } from '../services/api';

// const PAGE_LIMIT = 10;
// const HEADER_HEIGHT = 220;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const navigation = useNavigation();
//   const { width } = useWindowDimensions();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // Ads refresh signal (passed to AdsSection to trigger a refetch)
//   const [adsRefreshSignal, setAdsRefreshSignal] = useState(0);

//   // Animation for fade-in
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const numColumns = useMemo(() => (width < 600 ? 1 : 2), [width]);
//   const cardWidth = useMemo(() => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   }, [width, numColumns]);

//   // ---------------------------------------------------------------------------
//   // Refresh: Loads the first page (used on mount and pull-to-refresh)
//   // ---------------------------------------------------------------------------
//   const refreshCourses = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       const coursesResponse = await fetchCourses(1, PAGE_LIMIT);
//       if (coursesResponse.success) {
//         const newCourses = coursesResponse.data.map((c) => ({
//           ...c,
//           id: c._id,
//         }));
//         setCourses(newCourses);
//         setPage(2);
//         setHasMore(newCourses.length >= PAGE_LIMIT);
//       }
//       // Trigger ads refresh
//       setAdsRefreshSignal((prev) => prev + 1);
//       // Fade-in animation after refresh
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } catch (err) {
//       console.log('refreshCourses error', err);
//     } finally {
//       setRefreshing(false);
//       setLoading(false);
//     }
//   }, [fadeAnim]);

//   // ---------------------------------------------------------------------------
//   // Load More: Loads subsequent pages
//   // ---------------------------------------------------------------------------
//   const loadMoreCourses = useCallback(async () => {
//     if (!hasMore || loadingMore) return;
//     setLoadingMore(true);
//     try {
//       const coursesResponse = await fetchCourses(page, PAGE_LIMIT);
//       if (coursesResponse.success) {
//         const newCourses = coursesResponse.data.map((c) => ({
//           ...c,
//           id: c._id,
//         }));
//         setCourses((prev) => {
//           const existingIds = new Set(prev.map((item) => item.id));
//           const filtered = newCourses.filter((item) => !existingIds.has(item.id));
//           return [...prev, ...filtered];
//         });
//         setPage(page + 1);
//         if (newCourses.length < PAGE_LIMIT) {
//           setHasMore(false);
//         }
//       }
//     } catch (err) {
//       console.log('loadMoreCourses error', err);
//     } finally {
//       setLoadingMore(false);
//     }
//   }, [hasMore, loadingMore, page]);

//   // On mount, load the first page
//   useEffect(() => {
//     setLoading(true);
//     refreshCourses();
//   }, [refreshCourses]);

//   // ---------------------------------------------------------------------------
//   // Search (debounced 200ms)
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
//   // Load More Trigger (for FlatList onEndReached)
//   // ---------------------------------------------------------------------------
//   const handleLoadMoreCourses = useCallback(() => {
//     if (!loadingMore && hasMore) {
//       loadMoreCourses();
//     }
//   }, [loadingMore, hasMore, loadMoreCourses]);

//   // UI Handler for ad presses
//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('Ad Pressed', ad.title);
//   }, []);

//   // Render Course item
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

//   // ---------------------------------------------------------------------------
//   // Header Sections
//   // ---------------------------------------------------------------------------
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* Featured Reel Section */}
//       <View style={styles.sectionWrapper}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <View style={styles.sectionDivider} />
//         <FeaturedReel currentTheme={currentTheme} />
//       </View>

//       {/* Ads Section using AdsSection component */}
//       <AdsSection
//         currentTheme={currentTheme}
//         onAdPress={handleAdPress}
//         refreshSignal={adsRefreshSignal}
//       />

//       {/* All Courses Title */}
//       {courses.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             All Courses
//           </Text>
//           <View style={styles.sectionDivider} />
//         </View>
//       )}
//     </View>
//   ), [currentTheme, courses.length, handleAdPress, adsRefreshSignal]);

//   const renderEmptyComponent = useCallback(
//     () => (
//       <View style={styles.emptyContainer}>
//         <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//           No courses available.
//         </Text>
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

//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>
//           Loading courses...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[0]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Custom Header */}
//       <CustomHeader />

//       {/* Hero/Gradient Header */}
//       <View style={styles.headerArea}>
//         <LinearGradient
//           colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
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
//                 <Ionicons name="book-outline" size={18} color="#555" style={{ marginRight: 8 }} />
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
//           contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={refreshCourses}
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

// export default AICoursesScreen;

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

//   // Modern Hero Header
//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   headerGradient: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 34,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     opacity: 0.9,
//   },
//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 14,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 44,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   // Suggestions
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

//   // Main Content
//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },

//   // Sections
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginTop: 15,
//   },
//   sectionDivider: {
//     height: 2,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//     marginVertical: 8,
//     borderRadius: 2,
//   },

//   // Empty
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














// // src/screens/AICoursesScreen.js

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

// // Child Components
// import CustomHeader from '../components/CustomHeader';
// import CourseCard from '../components/CourseCard';
// import NewCourseAdsList from '../components/NewCourseAdsList';

// //   <-- The new single-file approach:
// import FeaturedReel from '../components/FeaturedReel';

// import {
//   fetchCourses,
//   fetchAds,
//   searchCoursesAPI,
// } from '../services/api';

// // Pagination limit for courses
// const PAGE_LIMIT = 10;
// const HEADER_HEIGHT = 220;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const navigation = useNavigation();
//   const { width } = useWindowDimensions();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // ----------------------- Ads State -----------------------
//   const [ads, setAds] = useState([]);
//   const [fetchedAdsOnce, setFetchedAdsOnce] = useState(false);

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // Animations & Layout
//   const fadeAnim = useRef(new Animated.Value(0)).current;
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
//         const coursesPromise = fetchCourses(currentPage, PAGE_LIMIT);
//         // Fetch ads only once or on refresh
//         const adsPromise = !fetchedAdsOnce || isRefresh ? fetchAds() : null;

//         const [coursesResponse, adsResponse] = await Promise.all([
//           coursesPromise,
//           adsPromise,
//         ]);

//         // handle courses
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));

//           if (isRefresh) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newCourses.filter(
//                 (item) => !existingIds.has(item.id)
//               );
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

//         // handle ads
//         if (adsPromise) {
//           if (adsResponse?.success) {
//             setAds(adsResponse.data);
//             setFetchedAdsOnce(true);
//           } else {
//             setAds([]);
//           }
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

//   // Refresh all
//   const refreshAll = useCallback(() => {
//     setHasMore(true);
//     setFetchedAdsOnce(false);
//     setAds([]);
//     fetchData(true);
//   }, [fetchData]);

//   // on mount
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

//   // UI Handlers
//   const handleAdPress = useCallback((ad) => {
//     Alert.alert('Ad Pressed', ad.title);
//   }, []);

//   // Render items
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

//   // ---------------------------------------------------------------------------
//   // Conditional Sections in Header
//   // ---------------------------------------------------------------------------
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* Our new self-fetching FeaturedReel */}
//       <View style={styles.sectionWrapper}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <View style={styles.sectionDivider} />
//         <FeaturedReel currentTheme={currentTheme} />
//       </View>

//       {/* If ads exist, show Sponsored Ads section */}
//       {ads.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Sponsored Ads
//           </Text>
//           <View style={styles.sectionDivider} />
//           <NewCourseAdsList
//             ads={ads}
//             onAdPress={handleAdPress}
//             currentTheme={currentTheme}
//           />
//         </View>
//       )}

//       {/* If courses exist, show All Courses title */}
//       {courses.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             All Courses
//           </Text>
//           <View style={styles.sectionDivider} />
//         </View>
//       )}
//     </View>
//   ), [ads, courses, currentTheme, handleAdPress]);

//   const renderEmptyComponent = useCallback(
//     () => (
//       <View style={styles.emptyContainer}>
//         <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//           No courses available.
//         </Text>
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

//   // If no data at all (initial load)
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView
//         style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}
//       >
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>
//           Loading courses...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[0]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Custom Header (logo, side icons, etc.) */}
//       <CustomHeader />

//       {/* Hero/Gradient Header */}
//       <View style={styles.headerArea}>
//         <LinearGradient
//           colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
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
//           contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
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
//         <View
//           style={[
//             styles.loadingOverlay,
//             { backgroundColor: currentTheme.backgroundColor + 'cc' },
//           ]}
//         >
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// export default AICoursesScreen;

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

//   // Modern Hero Header
//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   headerGradient: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 34,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     opacity: 0.9,
//   },
//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 14,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 44,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   // Suggestions
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

//   // Main Content
//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },

//   // Sections
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginTop: 15,
//   },
//   sectionDivider: {
//     height: 2,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//     marginVertical: 8,
//     borderRadius: 2,
//   },

//   // Empty
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

// // Child Components (make sure these use React.memo if possible)
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

// // Pagination limits
// const PAGE_LIMIT = 10;
// const REELS_LIMIT = 5;
// const HEADER_HEIGHT = 220;

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const navigation = useNavigation();
//   const { width } = useWindowDimensions();

//   // ----------------------- Course State -----------------------
//   const [courses, setCourses] = useState([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Loading states
//   const [loading, setLoading] = useState(false);
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

//   // ----------------------- Search State -----------------------
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchSuggestions, setSearchSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const searchTimeout = useRef(null);

//   // ----------------------- Animations & Layout -----------------------
//   const fadeAnim = useRef(new Animated.Value(0)).current;
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
//         const coursesPromise = fetchCourses(currentPage, PAGE_LIMIT);
//         // Fetch ads only once or on refresh
//         const adsPromise = !fetchedAdsOnce || isRefresh ? fetchAds() : null;

//         const [coursesResponse, adsResponse] = await Promise.all([
//           coursesPromise,
//           adsPromise,
//         ]);

//         // handle courses
//         if (coursesResponse.success) {
//           const newCourses = coursesResponse.data.map((c) => ({
//             ...c,
//             id: c._id,
//           }));

//           if (isRefresh) {
//             setCourses(newCourses);
//             setPage(2);
//           } else {
//             setCourses((prev) => {
//               const existingIds = new Set(prev.map((item) => item.id));
//               const filtered = newCourses.filter(
//                 (item) => !existingIds.has(item.id)
//               );
//               return [...prev, ...filtered];
//             });
//             setPage(currentPage + 1);
//           }

//           if (newCourses.length < PAGE_LIMIT) {
//             setHasMore(false);
//           }
//         }

//         // handle ads
//         if (adsPromise) {
//           if (adsResponse?.success) {
//             setAds(adsResponse.data);
//             setFetchedAdsOnce(true);
//           } else {
//             setAds([]);
//           }
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

//   // ---------------------------------------------------------------------------
//   // Conditional Sections in Header
//   // ---------------------------------------------------------------------------
//   const renderHeader = useCallback(() => (
//     <View>
//       {/* If reels exist, show Featured Courses section */}
//       {reels.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Featured Courses
//           </Text>
//           <View style={styles.sectionDivider} />
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
//                 onRequestMoreReels={handleLoadMoreReels}
//               />
//             )}
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.reelsContainer}
//           />
//         </View>
//       )}

//       {/* If ads exist, show Sponsored Ads section */}
//       {ads.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             Sponsored Ads
//           </Text>
//           <View style={styles.sectionDivider} />
//           <NewCourseAdsList
//             ads={ads}
//             onAdPress={handleAdPress}
//             currentTheme={currentTheme}
//           />
//         </View>
//       )}

//       {/* If courses exist, show All Courses title */}
//       {courses.length > 0 && (
//         <View style={styles.sectionWrapper}>
//           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//             All Courses
//           </Text>
//           <View style={styles.sectionDivider} />
//         </View>
//       )}
//     </View>
//   ), [
//     reels,
//     ads,
//     courses,
//     currentTheme,
//     width,
//     handleFeaturedPress,
//     handleAdPress,
//     handleLoadMoreReels,
//   ]);

//   // For an empty course list
//   const renderEmptyComponent = useCallback(
//     () => (
//       <View style={styles.emptyContainer}>
//         <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//           No courses available.
//         </Text>
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

//   // If no data at all (initial load)
//   if (loading && courses.length === 0 && !refreshing) {
//     return (
//       <SafeAreaView
//         style={[styles.loadingScreen, { backgroundColor: currentTheme.backgroundColor }]}
//       >
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>
//           Loading courses...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[0]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Custom Header (logo, side icons, etc.) */}
//       <CustomHeader />

//       {/* Hero/Gradient Header */}
//       <View style={styles.headerArea}>
//         <LinearGradient
//           colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
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
//           contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
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
//         <View
//           style={[
//             styles.loadingOverlay,
//             { backgroundColor: currentTheme.backgroundColor + 'cc' },
//           ]}
//         >
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={{ color: currentTheme.textColor, marginTop: 10 }}>Loading...</Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1 
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

//   // Modern Hero Header
//   headerArea: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     marginBottom: 2,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   headerGradient: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 34,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     opacity: 0.9,
//   },

//   searchBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 14,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     height: 44,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },

//   // Suggestions
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

//   // Main Content
//   contentContainer: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 40,
//     paddingHorizontal: 10,
//   },

//   // Sections
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginTop: 15,
//   },
//   sectionDivider: {
//     height: 2,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//     marginVertical: 8,
//     borderRadius: 2,
//   },
//   reelsContainer: {
//     paddingLeft: 15,
//     paddingBottom: 10,
//   },

//   // Empty
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
