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
// Import updated API functions
import { fetchCourses, fetchFeaturedReels, fetchAds } from '../services/api';

const AICoursesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();

  // State for courses, featured reels, ads, etc.
  const [courses, setCourses] = useState([]);
  const [reels, setReels] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animated value for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch courses (with pagination) and featured reels separately
  const fetchData = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);

      // Fetch courses (lightweight fields only)
      const coursesResponse = await fetchCourses(1, 10);
      if (coursesResponse.success) {
        const allCourses = coursesResponse.data.map(course => ({
          id: course._id,
          title: course.title,
          description: course.description,
          image: course.image,
          rating: course.rating,
          reviews: course.reviews,
        }));
        setCourses(allCourses);
      } else {
        setError(coursesResponse.message);
      }

      // Fetch featured reels (dedicated endpoint)
      const reelsResponse = await fetchFeaturedReels();
      if (reelsResponse.success) {
        setReels(reelsResponse.data);
      } else {
        setReels([]); // Fallback if reels not available
      }

      // Fetch ads
      const adsResponse = await fetchAds();
      if (adsResponse.success) {
        setAds(adsResponse.data);
      } else {
        setAds([]);
      }

      // Start fade-in animation after data loads
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setError(null);
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

  // Responsive grid: 1 column on narrow screens, 2 columns on wider screens
  const getNumberOfColumns = () => (width < 600 ? 1 : 2);
  const numColumns = getNumberOfColumns();
  const getCardWidth = () => {
    const totalMargin = 20 * (numColumns + 1);
    return (width - totalMargin) / numColumns;
  };

  const handleEnroll = course =>
    Alert.alert('Enrollment', `You have enrolled in "${course.title}"!`);
  const handleFeaturedPress = course =>
    Alert.alert('Course Details', `Featured Course: ${course.title}`);
  const handleAdPress = ad =>
    Alert.alert('New Courses', `Ad clicked: ${ad.title}`);

  // Render a course card
  const renderCourse = useCallback(
    ({ item }) => (
      <CourseCard
        course={item}
        cardWidth={getCardWidth()}
        currentTheme={currentTheme}
        onEnroll={handleEnroll}
      />
    ),
    [currentTheme, width]
  );

  // Render header containing featured reels and ads
  const renderHeader = () => (
    <View>
      {/* Featured Reels Carousel */}
      <View style={styles.featuredSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
          Featured Courses
        </Text>
        <FlatList
          data={reels}
          keyExtractor={item => item._id || item.id}
          renderItem={({ item }) => (
            <FeaturedReel
              course={item}
              reelWidth={width * 0.35}
              reelHeight={240}
              onPress={() => handleFeaturedPress(item)}
              currentTheme={currentTheme}
              reelsData={reels}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reelsContainer}
        />
      </View>

      {/* Ads Carousel */}
      <View style={styles.adSection}>
        <NewCourseAdsList
          ads={ads}
          onAdPress={handleAdPress}
          currentTheme={currentTheme}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
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
        backgroundColor={currentTheme.headerBackground ? currentTheme.headerBackground[1] : currentTheme.primaryColor}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />

      {/* Modern Header */}
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
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          <FlatList
            data={courses}
            keyExtractor={item => item.id}
            renderItem={renderCourse}
            numColumns={numColumns}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  container: { flex: 1 },
  header: {
    height: 190,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 36, fontWeight: '800' },
  headerSubtitle: { fontSize: 18, marginTop: 8 },
  contentContainer: { flex: 1 },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginVertical: 15, marginHorizontal: 15 },
  listContent: { paddingBottom: 40, paddingHorizontal: 10 },
  featuredSection: { marginBottom: 20 },
  reelsContainer: { paddingLeft: 15, paddingBottom: 10 },
  adSection: { marginHorizontal: 15, marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, marginBottom: 10 },
  retryButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  retryButtonText: { color: '#fff', fontSize: 16 },
  emptyContainer: { flex: 1, marginTop: 50, alignItems: 'center' },
  emptyText: { fontSize: 18 },
});

export default AICoursesScreen;











// // src/screens/AICoursesScreen.js
// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import NewCourseAdsList from '../components/NewCourseAdsList';
// // Import API functions including ads
// import { fetchCourses, fetchAds } from '../services/api';

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();

//   // State for courses, reels, ads, etc.
//   const [courses, setCourses] = useState([]);
//   const [reels, setReels] = useState([]);
//   const [ads, setAds] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // Persisted animated value for fade-in effect
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // Function to fetch courses and ads from the backend API
//   const fetchData = async (isRefreshing = false) => {
//     try {
//       isRefreshing ? setRefreshing(true) : setLoading(true);

//       // Fetch courses
//       const coursesResponse = await fetchCourses();
//       if (coursesResponse.success) {
//         const allCourses = coursesResponse.data.map(course => ({
//           id: course._id,
//           title: course.title,
//           description: course.description,
//           image: course.image,
//           rating: course.rating,
//           reviews: course.reviews,
//           videoUrl:
//             course.isFeatured && course.shortVideoLink
//               ? course.shortVideoLink
//               : undefined,
//         }));
//         setCourses(allCourses);
//         setReels(allCourses.filter(course => course.videoUrl));
//       } else {
//         setError(coursesResponse.message);
//       }

//       // Fetch ads from BE
//       const adsResponse = await fetchAds();
//       if (adsResponse.success) {
//         setAds(adsResponse.data);
//       } else {
//         // Optionally, you could leave ads empty or set a fallback.
//         setAds([]);
//       }

//       // Animate fade-in once data is loaded
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 500,
//         useNativeDriver: true,
//       }).start();

//       // Clear error on success
//       setError(null);
//     } catch (err) {
//       setError(err.message || 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Responsive grid: 1 column on narrow screens, 2 columns on wider ones
//   const getNumberOfColumns = () => (width < 600 ? 1 : 2);
//   const numColumns = getNumberOfColumns();
//   const getCardWidth = () => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   };

//   const handleEnroll = course =>
//     Alert.alert('Enrollment', `You have enrolled in "${course.title}"!`);
//   const handleFeaturedPress = course =>
//     Alert.alert('Course Details', `Featured Course: ${course.title}`);
//   const handleAdPress = ad =>
//     Alert.alert('New Courses', `Ad clicked: ${ad.title}`);

//   // Render a course card
//   const renderCourse = useCallback(
//     ({ item }) => (
//       <CourseCard
//         course={item}
//         cardWidth={getCardWidth()}
//         currentTheme={currentTheme}
//         onEnroll={handleEnroll}
//       />
//     ),
//     [currentTheme, width]
//   );

//   // Render header containing featured reels and ads
//   const renderHeader = () => (
//     <View>
//       {/* Featured Reels Carousel */}
//       <View style={styles.featuredSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <FlatList
//           data={reels}
//           keyExtractor={item => item.id}
//           renderItem={({ item }) => (
//             <FeaturedReel
//               course={item}
//               reelWidth={width * 0.35}
//               reelHeight={240}
//               onPress={() => handleFeaturedPress(item)}
//               currentTheme={currentTheme}
//               reelsData={reels}
//             />
//           )}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.reelsContainer}
//         />
//       </View>

//       {/* Ads Carousel */}
//       <View style={styles.adSection}>
//         <NewCourseAdsList
//           ads={ads}
//           onAdPress={handleAdPress}
//           currentTheme={currentTheme}
//         />
//       </View>

//       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//         All Courses
//       </Text>
//     </View>
//   );

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//         No courses available.
//       </Text>
//     </View>
//   );

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}
//     >
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[1]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       {/* Modern Header */}
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

//       {loading && !refreshing ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         </View>
//       ) : error ? (
//         <View style={styles.errorContainer}>
//           <Text style={[styles.errorText, { color: currentTheme.errorTextColor }]}>
//             {error}
//           </Text>
//           <TouchableOpacity
//             style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
//             onPress={() => fetchData()}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//           <FlatList
//             data={courses}
//             keyExtractor={item => item.id}
//             renderItem={renderCourse}
//             numColumns={numColumns}
//             ListHeaderComponent={renderHeader}
//             ListEmptyComponent={renderEmptyComponent}
//             contentContainerStyle={styles.listContent}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={() => fetchData(true)}
//                 tintColor={currentTheme.primaryColor}
//               />
//             }
//           />
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     height: 190,
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
//   },
//   headerSubtitle: {
//     fontSize: 18,
//     marginTop: 8,
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
//     marginBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   retryButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 30,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     marginTop: 50,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 18,
//   },
// });

// export default AICoursesScreen;












// // src/screens/AICoursesScreen.js
// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';

// import CourseCard from '../components/CourseCard';
// import FeaturedReel from '../components/FeaturedReel';
// import NewCourseAdsList from '../components/NewCourseAdsList';
// // Import the new API function
// import { fetchCourses } from '../services/api';

// const AICoursesScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const { width } = useWindowDimensions();

//   // State variables for courses, reels, etc.
//   const [courses, setCourses] = useState([]);
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // Sample new ads data for the carousel
//   const newAds = [
//     {
//       id: 'ad1',
//       image: 'https://via.placeholder.com/150x100.png?text=Ad+1',
//       title: 'Boost Your Career!',
//       subtitle: 'Enroll in our latest AI courses.',
//     },
//     {
//       id: 'ad2',
//       image: 'https://via.placeholder.com/150x100.png?text=Ad+2',
//       title: 'Special Offer',
//       subtitle: 'Up to 50% off on new courses.',
//     },
//     {
//       id: 'ad3',
//       image: 'https://via.placeholder.com/150x100.png?text=Ad+3',
//       title: 'Fresh Content!',
//       subtitle: 'Discover cutting-edge topics in AI.',
//     },
//   ];

//   // Persisted animated value for fade-in effect
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // Function to fetch courses from the backend API
//   const fetchData = async (isRefreshing = false) => {
//     try {
//       isRefreshing ? setRefreshing(true) : setLoading(true);
//       const response = await fetchCourses();
//       if (response.success) {
//         // Map each course so that it has an "id" (from _id) and a videoUrl if featured.
//         const allCourses = response.data.map(course => ({
//           id: course._id,
//           title: course.title,
//           description: course.description,
//           image: course.image,
//           rating: course.rating,
//           reviews: course.reviews,
//           videoUrl:
//             course.isFeatured && course.shortVideoLink
//               ? course.shortVideoLink
//               : undefined,
//         }));
//         setCourses(allCourses);
//         // Filter featured courses (with a valid short video link) for the reels carousel.
//         setReels(allCourses.filter(course => course.videoUrl));
//         setError(null);
//       } else {
//         setError(response.message);
//       }

//       // Animate fade-in once data is loaded
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 500,
//         useNativeDriver: true,
//       }).start();
//     } catch (err) {
//       setError(err.message || 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Responsive grid: 1 column on narrow screens, 2 columns on wider ones
//   const getNumberOfColumns = () => (width < 600 ? 1 : 2);
//   const numColumns = getNumberOfColumns();
//   const getCardWidth = () => {
//     const totalMargin = 20 * (numColumns + 1);
//     return (width - totalMargin) / numColumns;
//   };

//   const handleEnroll = course =>
//     Alert.alert('Enrollment', `You have enrolled in "${course.title}"!`);
//   const handleFeaturedPress = course =>
//     Alert.alert('Course Details', `Featured Course: ${course.title}`);
//   const handleAdPress = ad =>
//     Alert.alert('New Courses', `Ad clicked: ${ad.title}`);

//   // Render a course card
//   const renderCourse = useCallback(
//     ({ item }) => (
//       <CourseCard
//         course={item}
//         cardWidth={getCardWidth()}
//         currentTheme={currentTheme}
//         onEnroll={handleEnroll}
//       />
//     ),
//     [currentTheme, width]
//   );

//   // Render header containing featured reels and new course ads
//   const renderHeader = () => (
//     <View>
//       {/* Featured Reels Carousel */}
//       <View style={styles.featuredSection}>
//         <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//           Featured Courses
//         </Text>
//         <FlatList
//           data={reels}
//           keyExtractor={item => item.id}
//           renderItem={({ item }) => (
//             <FeaturedReel
//               course={item}
//               reelWidth={width * 0.35}
//               reelHeight={240}
//               onPress={() => handleFeaturedPress(item)}
//               currentTheme={currentTheme}
//               reelsData={reels}
//             />
//           )}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.reelsContainer}
//         />
//       </View>

//       {/* New Course Ads Carousel */}
//       <View style={styles.adSection}>
//         <NewCourseAdsList
//           ads={newAds}
//           onAdPress={handleAdPress}
//           currentTheme={currentTheme}
//         />
//       </View>

//       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//         All Courses
//       </Text>
//     </View>
//   );

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//         No courses available.
//       </Text>
//     </View>
//   );

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}
//     >
//       <StatusBar
//         backgroundColor={
//           currentTheme.headerBackground
//             ? currentTheme.headerBackground[1]
//             : currentTheme.primaryColor
//         }
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       {/* Modern Header */}
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

//       {loading && !refreshing ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         </View>
//       ) : error ? (
//         <View style={styles.errorContainer}>
//           <Text style={[styles.errorText, { color: currentTheme.errorTextColor }]}>
//             {error}
//           </Text>
//           <TouchableOpacity
//             style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
//             onPress={() => fetchData()}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//           <FlatList
//             data={courses}
//             keyExtractor={item => item.id}
//             renderItem={renderCourse}
//             numColumns={numColumns}
//             ListHeaderComponent={renderHeader}
//             ListEmptyComponent={renderEmptyComponent}
//             contentContainerStyle={styles.listContent}
//             showsVerticalScrollIndicator={false}  // Scrollbar hidden here
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={() => fetchData(true)}
//                 tintColor={currentTheme.primaryColor}
//               />
//             }
//           />
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     height: 190,
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
//   },
//   headerSubtitle: {
//     fontSize: 18,
//     marginTop: 8,
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
//     marginBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   retryButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 30,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     marginTop: 50,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 18,
//   },
// });

// export default AICoursesScreen;










