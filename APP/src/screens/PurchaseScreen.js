import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

import {
  fetchCourseById,
  fetchPaymentIntent,
  enrollInCourseAPI,
  getMyEnrollmentsAPI,
} from '../services/api';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import AdsSection from '../components/AdsSection';

// Get window width for layout
const { width } = Dimensions.get('window');

// A simple sub-component that displays detailed course info
const ReceiptCard = ({ course, theme }) => (
  <View
    style={[
      styles.receiptCard,
      {
        backgroundColor: theme.cardBackground,
        borderColor: theme.primaryColor,
      },
    ]}
  >
    <Text style={[styles.receiptTitle, { color: theme.textColor }]}>
      {course.title}
    </Text>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Instructor:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.instructor}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Category:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.category}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Price:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        ${course.price}
      </Text>
    </View>

    {course.saleEnabled && (
      <View style={styles.receiptRow}>
        <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
          Sale Price:
        </Text>
        <Text style={[styles.receiptValue, { color: theme.textColor }]}>
          ${course.salePrice}
        </Text>
      </View>
    )}

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Rating:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.rating}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Difficulty:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.difficultyLevel}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Language:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.language}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Lectures:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.numberOfLectures}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Duration:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {course.totalDuration} hrs
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Description:
      </Text>
      <Text
        style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}
      >
        {course.description}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Requirements:
      </Text>
      <Text
        style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}
      >
        {course.requirements.join(', ')}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Topics:
      </Text>
      <Text
        style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}
      >
        {course.topics.join(', ')}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        What You'll Learn:
      </Text>
      <Text
        style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}
      >
        {course.whatYouWillLearn.join(', ')}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Created At:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {new Date(course.createdAt).toLocaleDateString()}
      </Text>
    </View>

    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: theme.textColor }]}>
        Updated At:
      </Text>
      <Text style={[styles.receiptValue, { color: theme.textColor }]}>
        {new Date(course.updatedAt).toLocaleDateString()}
      </Text>
    </View>
  </View>
);

const PurchaseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Fetch course data
  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchCourseById(courseId);
      if (result.success) {
        setCourse(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // On mount, load course
  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Check if user is already enrolled
  const checkEnrollmentStatus = useCallback(async () => {
    if (course) {
      try {
        const enrollmentsResult = await getMyEnrollmentsAPI();
        if (enrollmentsResult.success && enrollmentsResult.data.enrollments) {
          const alreadyEnrolled = enrollmentsResult.data.enrollments.some(
            (enrollment) =>
              enrollment.course &&
              enrollment.course._id.toString() === courseId
          );
          setIsEnrolled(alreadyEnrolled);
        }
      } catch (err) {
        console.error('Enrollment check error:', err);
      }
    }
  }, [course, courseId]);

  useEffect(() => {
    checkEnrollmentStatus();
  }, [course, checkEnrollmentStatus]);

  // Purchase or Enroll logic
  const handlePurchase = async () => {
    if (isEnrolled) {
      Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
      return;
    }

    // Free course => enroll directly
    if (course.price === 0) {
      try {
        setPurchaseInProgress(true);
        const enrollResult = await enrollInCourseAPI(courseId);
        if (enrollResult.success) {
          Alert.alert(
            'Enrollment Successful',
            'You have been enrolled in this course!',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Enrollment Failed', enrollResult.message);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setPurchaseInProgress(false);
      }
      return;
    }

    // Paid course => Payment with Stripe
    try {
      setPurchaseInProgress(true);
      // 1. Get Payment Intent
      const clientSecret = await fetchPaymentIntent(course.price);
      if (!clientSecret) {
        Alert.alert('Error', 'Could not initiate payment.');
        return;
      }

      // 2. Init PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Your App Name',
      });
      if (initError) {
        Alert.alert('Payment Error', initError.message);
        return;
      }

      // 3. Present PaymentSheet
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        Alert.alert('Payment Failed', paymentError.message);
        return;
      }

      // 4. If success, enroll user
      const enrollResult = await enrollInCourseAPI(courseId);
      if (enrollResult.success) {
        Alert.alert(
          'Enrollment Successful',
          'You have been enrolled in this course!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Enrollment Failed', enrollResult.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setPurchaseInProgress(false);
    }
  };

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourse();
    setRefreshing(false);
  };

  // Ads press
  const handleAdPress = useCallback(
    (ad) => {
      if (ad.adProdtype === 'Course') {
        navigation.navigate('CourseDetailScreen', { courseId: ad.adProdId });
      } else {
        navigation.navigate('ProductPage', { productId: ad.adProdId });
      }
    },
    [navigation]
  );

  // Loading State
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
            Loading course...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State or missing course
  if (error || !course) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>
            {error || 'Course not found.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCourse}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { title, price, description, image } = course;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}
    >
      <LinearGradient
        colors={currentTheme.headerBackground}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
          Purchase Course
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.mainContent}>
          {/* Ads with heading */}
          <View style={styles.adsWrapper}>
            <Text style={[styles.adsTitle, { color: currentTheme.textColor }]}>
              Get More Excited Course
            </Text>
            <AdsSection
              currentTheme={currentTheme}
              onAdPress={handleAdPress}
              refreshSignal={0}
              templateFilter="newCourse"
            />
          </View>

          {/* Course Card */}
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: currentTheme.cardBackground,
                shadowColor: currentTheme.shadowColor,
              },
            ]}
          >
            {image && (
              <Image
                source={{ uri: image }}
                style={styles.courseImage}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.courseTitle, { color: currentTheme.textColor }]}>
              {title}
            </Text>
            {price > 0 && (
              <Text style={[styles.coursePrice, { color: currentTheme.primaryColor }]}>
                ${price.toFixed(2)}
              </Text>
            )}
            {description && (
              <Text
                style={[styles.courseDescription, { color: currentTheme.textColor }]}
              >
                {description}
              </Text>
            )}

            {/* Full Course Details Card */}
            <ReceiptCard course={course} theme={currentTheme} />

            {/* Purchase Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.footerPriceButton, { borderColor: currentTheme.primaryColor }]}
                disabled
              >
                <Text style={[styles.footerPriceText, { color: currentTheme.textColor }]}>
                  {price && price > 0 ? `$${price.toFixed(2)}` : 'Free'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.footerEnrollButton,
                  { backgroundColor: currentTheme.primaryColor },
                ]}
                onPress={handlePurchase}
                disabled={purchaseInProgress}
              >
                {purchaseInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.footerEnrollText}>
                    {price === 0 ? 'Enroll Now' : 'Buy Now'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Ads */}
          <View style={styles.adsWrapper} />
          <Text
            style={[
              styles.adsTitle,
              { color: currentTheme.textColor, marginBottom: -40 },
            ]}
          >
            Try our New Sale
          </Text>
          <AdsSection
            currentTheme={currentTheme}
            onAdPress={handleAdPress}
            refreshSignal={0}
            templateFilter="sale"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PurchaseScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  scrollContainer: {
    paddingBottom: 140,
  },
  header: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 15,
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  adsWrapper: {
    width: '100%',
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  adsTitle: {
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardContainer: {
    width: width * 0.96,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 20,
  },
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  coursePrice: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  courseDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },

  // ReceiptCard styling
  receiptCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 0.4,
  },
  receiptValue: {
    fontSize: 14,
    flex: 0.6,
  },

  // Footer Buttons
  buttonContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 20,
    width: '100%',
  },
  footerPriceButton: {
    width: 70,
    height: 50,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  footerPriceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerEnrollButton: {
    flex: 1,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerEnrollText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});












// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   StyleSheet, 
//   SafeAreaView, 
//   Dimensions,
//   Image,
//   Alert,
//   ScrollView,
//   RefreshControl,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useStripe } from '@stripe/stripe-react-native';

// import { fetchCourseById, fetchPaymentIntent, enrollInCourseAPI, getMyEnrollmentsAPI } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import AdsSection from '../components/AdsSection';

// const { width } = Dimensions.get('window');

// // ReceiptCard displays full course details in a professional "receipt" style.
// const ReceiptCard = ({ course, theme }) => (
//   <View style={[styles.receiptCard, { backgroundColor: theme.cardBackground, borderColor: theme.primaryColor }]}>
//     <Text style={[styles.receiptTitle, { color: theme.textColor }]}>{course.title}</Text>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Instructor:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.instructor}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Category:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.category}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Price:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>${course.price}</Text>
//     </View>
//     {course.saleEnabled && (
//       <View style={styles.receiptRow}>
//         <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Sale Price:</Text>
//         <Text style={[styles.receiptValue, { color: theme.textColor }]}>${course.salePrice}</Text>
//       </View>
//     )}
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Rating:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.rating}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Difficulty:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.difficultyLevel}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Language:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.language}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Lectures:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.numberOfLectures}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Duration:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{course.totalDuration} hrs</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Description:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}>{course.description}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Requirements:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}>{course.requirements.join(', ')}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Topics:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}>{course.topics.join(', ')}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>What You'll Learn:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor, flex: 1 }]}>{course.whatYouWillLearn.join(', ')}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Created At:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{new Date(course.createdAt).toLocaleDateString()}</Text>
//     </View>
//     <View style={styles.receiptRow}>
//       <Text style={[styles.receiptLabel, { color: theme.textColor }]}>Updated At:</Text>
//       <Text style={[styles.receiptValue, { color: theme.textColor }]}>{new Date(course.updatedAt).toLocaleDateString()}</Text>
//     </View>
//   </View>
// );

// const PurchaseScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { courseId } = route.params;
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [purchaseInProgress, setPurchaseInProgress] = useState(false);
//   const [error, setError] = useState(null);
//   const [isEnrolled, setIsEnrolled] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const { initPaymentSheet, presentPaymentSheet } = useStripe();

//   const loadCourse = useCallback(async () => {
//     try {
//       setLoading(true);
//       const result = await fetchCourseById(courseId);
//       if (result.success) {
//         console.log('Fetched course:', result.data);
//         setCourse(result.data);
//         setError(null);
//       } else {
//         setError(result.message);
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [courseId]);

//   useEffect(() => {
//     loadCourse();
//   }, [loadCourse]);

//   const checkEnrollmentStatus = useCallback(async () => {
//     if (course) {
//       try {
//         const enrollmentsResult = await getMyEnrollmentsAPI();
//         if (enrollmentsResult.success && enrollmentsResult.data.enrollments) {
//           const alreadyEnrolled = enrollmentsResult.data.enrollments.some(
//             enrollment =>
//               enrollment.course &&
//               enrollment.course._id.toString() === courseId
//           );
//           setIsEnrolled(alreadyEnrolled);
//         }
//       } catch (err) {
//         console.error('Enrollment check error:', err);
//       }
//     }
//   }, [course, courseId]);

//   useEffect(() => {
//     checkEnrollmentStatus();
//   }, [course, checkEnrollmentStatus]);

//   const handlePurchase = async () => {
//     if (isEnrolled) {
//       Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
//       return;
//     }
    
//     // If the course is free, enroll directly
//     if (course.price === 0) {
//       try {
//         setPurchaseInProgress(true);
//         const enrollResult = await enrollInCourseAPI(courseId);
//         if (enrollResult.success) {
//           Alert.alert('Enrollment Successful', 'You have been enrolled in this course!', [
//             { text: 'OK', onPress: () => navigation.goBack() },
//           ]);
//         } else {
//           Alert.alert('Enrollment Failed', enrollResult.message);
//         }
//       } catch (error) {
//         Alert.alert('Error', error.message);
//       } finally {
//         setPurchaseInProgress(false);
//       }
//       return;
//     }

//     try {
//       setPurchaseInProgress(true);
//       const clientSecret = await fetchPaymentIntent(course.price);
//       if (!clientSecret) {
//         Alert.alert('Error', 'Could not initiate payment.');
//         return;
//       }
//       const { error: initError } = await initPaymentSheet({
//         paymentIntentClientSecret: clientSecret,
//         merchantDisplayName: 'Your App Name',
//       });
//       if (initError) {
//         Alert.alert('Payment Error', initError.message);
//         return;
//       }
//       const { error: paymentError } = await presentPaymentSheet();
//       if (paymentError) {
//         Alert.alert('Payment Failed', paymentError.message);
//         return;
//       }
//       const enrollResult = await enrollInCourseAPI(courseId);
//       if (enrollResult.success) {
//         Alert.alert('Enrollment Successful', 'You have been enrolled in this course!', [
//           { text: 'OK', onPress: () => navigation.goBack() },
//         ]);
//       } else {
//         Alert.alert('Enrollment Failed', enrollResult.message);
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setPurchaseInProgress(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadCourse();
//     setRefreshing(false);
//   };

//   const handleAdPress = useCallback((ad) => {  
//     if (ad.adProdtype === 'Course') {
//       navigation.navigate('CourseDetailScreen', { courseId: ad.adProdId });
//     } else {
//       navigation.navigate('ProductPage', { productId: ad.adProdId });
//     }
//   }, [navigation]);

//   if (loading) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
//             Loading course...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error || !course) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centerContainer}>
//           <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>
//             {error || 'Course not found.'}
//           </Text>
//           <TouchableOpacity style={styles.retryButton} onPress={loadCourse}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const { title, price, description, image } = course;

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       {/* Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 0, y: 1 }}
//       >
//         <TouchableOpacity
//           style={styles.headerBackButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//           Purchase Course
//         </Text>
//       </LinearGradient>

//       <ScrollView 
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       >
//         <View style={styles.mainContent}>
//           {/* Course Card */}
//           <View style={[styles.cardContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadowColor }]}>
//             <View style={styles.adsWrapper}>
//               <Text style={[styles.adsTitle, { color: currentTheme.textColor }]}>
//                 Get More Excited Course
//               </Text>
//               <AdsSection 
//                 currentTheme={currentTheme} 
//                 onAdPress={handleAdPress} 
//                 refreshSignal={0} 
//                 templateFilter='newCourse'
//               />
//             </View>
//             {image && (
//               <Image
//                 source={{ uri: image }}
//                 style={styles.courseImage}
//                 resizeMode="cover"
//               />
//             )}
//             <Text style={[styles.courseTitle, { color: currentTheme.textColor }]}>{title}</Text>
//             {price > 0 && (
//               <Text style={[styles.coursePrice, { color: currentTheme.primaryColor }]}>
//                 ${price.toFixed(2)}
//               </Text>
//             )}
//             {description && (
//               <Text style={[styles.courseDescription, { color: currentTheme.textColor }]}>
//                 {description}
//               </Text>
//             )}
//             {/* Receipt Card with full course details */}
//             <ReceiptCard course={course} theme={currentTheme} />
//             {/* Button container using the original button style */}
//             <View style={styles.buttonContainer}>
//               <TouchableOpacity
//                 style={[styles.footerPriceButton, { borderColor: currentTheme.primaryColor }]}
//                 disabled
//               >
//                 <Text style={[styles.footerPriceText, { color: currentTheme.textColor }]}>
//                   {price && price > 0 ? `$${price.toFixed(2)}` : 'Free'}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.footerEnrollButton, { backgroundColor: currentTheme.primaryColor }]}
//                 onPress={handlePurchase}
//                 disabled={purchaseInProgress}
//               >
//                 {purchaseInProgress ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={styles.footerEnrollText}>
//                     {price === 0 ? 'Enroll Now' : 'Buy Now'}
//                   </Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.adsWrapper} />
//           <Text style={[styles.adsTitle, { color: currentTheme.textColor, marginBottom: -40 }]}>
//             Try our New Sale
//           </Text>
//           <AdsSection 
//             currentTheme={currentTheme} 
//             onAdPress={handleAdPress} 
//             refreshSignal={0} 
//             templateFilter='sale'
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default PurchaseScreen;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1 },
//   centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText: { marginTop: 10, fontSize: 16 },
//   errorText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
//   retryButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#007bff', borderRadius: 8 },
//   retryButtonText: { color: '#fff', fontSize: 16 },
//   scrollContainer: { paddingBottom: 140 },
//   header: {
//     width: '100%',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     marginBottom: 15,
//   },
//   headerBackButton: { position: 'absolute', left: 20, padding: 8 },
//   headerTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
//   mainContent: { alignItems: 'center', paddingHorizontal: 20 },
//   adsWrapper: {
//     width: '100%',
//     marginVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   cardContainer: {
//     width: width * 0.96,
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//     elevation: 8,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     marginBottom: 20,
//   },
//   adsTitle: { fontSize: 25, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
//   courseImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
//   courseTitle: { fontSize: 24, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
//   coursePrice: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
//   courseDescription: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 20 },
//   // ReceiptCard styles
//   receiptCard: {
//     width: '100%',
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 15,
//     marginVertical: 15,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   receiptTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
//   receiptRow: { flexDirection: 'row', marginBottom: 8 },
//   receiptLabel: { fontSize: 14, fontWeight: '600', flex: 0.4 },
//   receiptValue: { fontSize: 14, flex: 0.6 },
//   // Button container remains inline with original button style
//   buttonContainer: { 
//     flexDirection: 'row', 
//     paddingVertical: 10, 
//     paddingHorizontal: 15, 
//     marginTop: 20, 
//     width: '100%' 
//   },
//   footerPriceButton: {
//     width: 70,
//     height: 50,
//     borderRadius: 20,
//     borderWidth: 1.5,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   footerPriceText: { fontSize: 16, fontWeight: '600' },
//   footerEnrollButton: {
//     flex: 1,
//     height: 50,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   footerEnrollText: { color: '#fff', fontSize: 18, fontWeight: '600' },
// });






// // src/screens/PurchaseScreen.js
// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   StyleSheet, 
//   SafeAreaView, 
//   Dimensions,
//   Image,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useStripe } from '@stripe/stripe-react-native';

// import { fetchCourseById, fetchPaymentIntent, enrollInCourseAPI, getMyEnrollmentsAPI } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// // AdsSection Component
// import AdsSection from '../components/AdsSection';

// const { width } = Dimensions.get('window');

// const PurchaseScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { courseId } = route.params;
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [purchaseInProgress, setPurchaseInProgress] = useState(false);
//   const [error, setError] = useState(null);
//   const [isEnrolled, setIsEnrolled] = useState(false);

//   // Stripe hooks
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();

//   useEffect(() => {
//     const loadCourse = async () => {
//       try {
//         setLoading(true);
//         const result = await fetchCourseById(courseId);
//         if (result.success) {
//           setCourse(result.data);
//           setError(null);
//         } else {
//           setError(result.message);
//         }
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadCourse();
//   }, [courseId]);

//   // Check if user is already enrolled in the course
//   useEffect(() => {
//     if (course) {
//       const checkEnrollmentStatus = async () => {
//         const enrollmentsResult = await getMyEnrollmentsAPI();
//         if (enrollmentsResult.success && enrollmentsResult.data.enrollments) {
//           const alreadyEnrolled = enrollmentsResult.data.enrollments.some(enrollment =>
//             enrollment.course &&
//             enrollment.course._id.toString() === courseId
//           );
//           setIsEnrolled(alreadyEnrolled);
//         }
//       };
//       checkEnrollmentStatus();
//     }
//   }, [course, courseId]);

//   const handlePurchase = async () => {
//     if (isEnrolled) {
//       Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
//       return;
//     }
//     setPurchaseInProgress(true);
//     // Get Payment Intent from backend for this course's price
//     const clientSecret = await fetchPaymentIntent(course.price);
//     if (!clientSecret) {
//       Alert.alert('Error', 'Could not initiate payment.');
//       setPurchaseInProgress(false);
//       return;
//     }
//     // Initialize the Payment Sheet
//     const { error: initError } = await initPaymentSheet({
//       paymentIntentClientSecret: clientSecret,
//       merchantDisplayName: 'Your App Name',
//     });
//     if (initError) {
//       Alert.alert('Payment Error', initError.message);
//       setPurchaseInProgress(false);
//       return;
//     }
//     // Present the Payment Sheet to the user
//     const { error: paymentError } = await presentPaymentSheet();
//     if (paymentError) {
//       Alert.alert('Payment Failed', paymentError.message);
//       setPurchaseInProgress(false);
//       return;
//     }
//     // Payment succeeded, enroll the user in the course
//     const enrollResult = await enrollInCourseAPI(courseId);
//     if (enrollResult.success) {
//       Alert.alert('Enrollment Successful', 'You have been enrolled in this course!', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     } else {
//       Alert.alert('Enrollment Failed', enrollResult.message);
//     }
//     setPurchaseInProgress(false);
//   };

//   const handleAdPress = useCallback((ad) => {
//     // console.log('handleAdPress', ad.adProdtype);  
    
//     if (ad.adProdtype === 'Course') {
//       navigation.navigate('CourseDetailScreen', { courseId: ad.adProdId });
//     } else {
//       navigation.navigate('ProductPage', { productId: ad.adProdId });
//     }
    
//   }, []);

//   if (loading) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//           <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
//             Loading course...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error || !course) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centerContainer}>
//           <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>
//             {error || 'Course not found.'}
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const { title, price, description, image } = course;

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       {/* Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 0, y: 1 }}
//       >
//         <TouchableOpacity
//           style={styles.headerBackButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//           Purchase Course
//         </Text>
//       </LinearGradient>

//       <ScrollView 
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.mainContent}>


//           {/* Course Card */}
//           <View style={[styles.cardContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadowColor }]}>
//             <View style={styles.adsWrapper}>
//               <Text style={[styles.adsTitle, { color: currentTheme.textColor }]}>Get More Excited Course</Text>
//               <AdsSection 
//                 currentTheme={currentTheme} 
//                 onAdPress={handleAdPress} 
//                 refreshSignal={0} 
//                 templateFilter='newCourse'
//               />
//             </View>
//             {image && (
//               <Image
//                 source={{ uri: image }}
//                 style={styles.courseImage}
//                 resizeMode="cover"
//               />
//             )}
//             <Text style={[styles.courseTitle, { color: currentTheme.textColor }]}>{title}</Text>
//             {price > 0 && (
//               <Text style={[styles.coursePrice, { color: currentTheme.primaryColor }]}>
//                 ${price.toFixed(2)}
//               </Text>
//             )}
//             {description && (
//               <Text style={[styles.courseDescription, { color: currentTheme.textColor }]}>
//                 {description}
//               </Text>
//             )}
//             <TouchableOpacity
//               style={styles.purchaseButton}
//               onPress={handlePurchase}
//               disabled={purchaseInProgress}
//             >
//               <LinearGradient
//                 colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//                 style={styles.buttonGradient}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//               >
//                 {purchaseInProgress ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Buy for ${price.toFixed(2)}</Text>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.adsWrapper } />
//           <Text style={[styles.adsTitle, { color: currentTheme.textColor, marginBottom: -40 }]}>Try our New sale</Text>
//           <AdsSection 
//               currentTheme={currentTheme} 
//               onAdPress={handleAdPress} 
//               refreshSignal={0} 
//               templateFilter='sale'
//             />
//             <View />
          
//           {/* Alternate Back Button */}
//           {/* <TouchableOpacity 
//             style={styles.altBackButton} 
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={24} color={currentTheme.primaryColor} />
//             <Text style={[styles.altBackText, { color: currentTheme.primaryColor }]}>Back</Text>
//           </TouchableOpacity> */}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default PurchaseScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   scrollContainer: {
//     paddingBottom: 30,
//   },
//   // Header styles
//   header: {
//     width: '100%',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     marginBottom: 15,
//   },
//   headerBackButton: {
//     position: 'absolute',
//     left: 20,
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   // Main content container
//   mainContent: {
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   // Ads wrapper
//   adsWrapper: {
//     width: '100%',
//     marginVertical: 30,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//     // paddingBottom: 20,

//   },
//   // Card container styles
//   cardContainer: {
//     width: width * 0.9,
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//     elevation: 8,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     marginBottom: 20,
//   },
//   adsTitle: {
//     fontSize: 25,
//     fontWeight: '900',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   // Course image styles
//   courseImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   // Course title
//   courseTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   // Price styling
//   coursePrice: {
//     fontSize: 20,
//     fontWeight: '600',
//     marginBottom: 10,
//   },
//   // Description styling
//   courseDescription: {
//     fontSize: 16,
//     lineHeight: 24,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   // Purchase button styling
//   purchaseButton: {
//     width: '100%',
//     marginBottom: 20,
//   },
//   buttonGradient: {
//     paddingVertical: 14,
//     borderRadius: 30,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   // Alternate back button styling
//   altBackButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 15,
//   },
//   altBackText: {
//     marginLeft: 8,
//     fontSize: 16,
//   },
//   // Loading and error styles
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//   },
//   errorText: {
//     fontSize: 16,
//   },
// });
