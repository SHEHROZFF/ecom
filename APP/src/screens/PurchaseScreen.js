// src/screens/PurchaseScreen.js
import React, { useState, useEffect, useContext } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

import { fetchCourseById, fetchPaymentIntent, enrollInCourseAPI, getMyEnrollmentsAPI } from '../services/api';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
// AdsSection Component
import AdsSection from '../components/AdsSection';

const { width } = Dimensions.get('window');

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

  // Stripe hooks
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    const loadCourse = async () => {
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
    };
    loadCourse();
  }, [courseId]);

  // Check if user is already enrolled in the course
  useEffect(() => {
    if (course) {
      const checkEnrollmentStatus = async () => {
        const enrollmentsResult = await getMyEnrollmentsAPI();
        if (enrollmentsResult.success && enrollmentsResult.data.enrollments) {
          const alreadyEnrolled = enrollmentsResult.data.enrollments.some(enrollment =>
            enrollment.course &&
            enrollment.course._id.toString() === courseId
          );
          setIsEnrolled(alreadyEnrolled);
        }
      };
      checkEnrollmentStatus();
    }
  }, [course, courseId]);

  const handlePurchase = async () => {
    if (isEnrolled) {
      Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
      return;
    }
    setPurchaseInProgress(true);
    // Get Payment Intent from backend for this course's price
    const clientSecret = await fetchPaymentIntent(course.price);
    if (!clientSecret) {
      Alert.alert('Error', 'Could not initiate payment.');
      setPurchaseInProgress(false);
      return;
    }
    // Initialize the Payment Sheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Your App Name',
    });
    if (initError) {
      Alert.alert('Payment Error', initError.message);
      setPurchaseInProgress(false);
      return;
    }
    // Present the Payment Sheet to the user
    const { error: paymentError } = await presentPaymentSheet();
    if (paymentError) {
      Alert.alert('Payment Failed', paymentError.message);
      setPurchaseInProgress(false);
      return;
    }
    // Payment succeeded, enroll the user in the course
    const enrollResult = await enrollInCourseAPI(courseId);
    if (enrollResult.success) {
      Alert.alert('Enrollment Successful', 'You have been enrolled in this course!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Enrollment Failed', enrollResult.message);
    }
    setPurchaseInProgress(false);
  };

  const handleAdPress = (ad) => {
    Alert.alert('Ad Pressed', ad.title);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
            Loading course...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>
            {error || 'Course not found.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { title, price, description, image } = course;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Header */}
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
      >
        <View style={styles.mainContent}>


          {/* Course Card */}
          <View style={[styles.cardContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadowColor }]}>
            <AdsSection 
              currentTheme={currentTheme} 
              onAdPress={handleAdPress} 
              refreshSignal={0} 
              templateFilter='newCourse'
            />
            {image && (
              <Image
                source={{ uri: image }}
                style={styles.courseImage}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.courseTitle, { color: currentTheme.textColor }]}>{title}</Text>
            {price > 0 && (
              <Text style={[styles.coursePrice, { color: currentTheme.primaryColor }]}>
                ${price.toFixed(2)}
              </Text>
            )}
            {description && (
              <Text style={[styles.courseDescription, { color: currentTheme.textColor }]}>
                {description}
              </Text>
            )}
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
              disabled={purchaseInProgress}
            >
              <LinearGradient
                colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {purchaseInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Buy for ${price.toFixed(2)}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.adsWrapper} />
          <AdsSection 
              currentTheme={currentTheme} 
              onAdPress={handleAdPress} 
              refreshSignal={0} 
              templateFilter='sale'
            />
            <View />
          
          {/* Alternate Back Button */}
          {/* <TouchableOpacity 
            style={styles.altBackButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={currentTheme.primaryColor} />
            <Text style={[styles.altBackText, { color: currentTheme.primaryColor }]}>Back</Text>
          </TouchableOpacity> */}
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
  scrollContainer: {
    paddingBottom: 30,
  },
  // Header styles
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
  // Main content container
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Ads wrapper
  adsWrapper: {
    width: '100%',
    marginVertical: -40,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
    paddingBottom: 20,
  },
  // Card container styles
  cardContainer: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 20,
  },
  // Course image styles
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  // Course title
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Price styling
  coursePrice: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  // Description styling
  courseDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Purchase button styling
  purchaseButton: {
    width: '100%',
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Alternate back button styling
  altBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  altBackText: {
    marginLeft: 8,
    fontSize: 16,
  },
  // Loading and error styles
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
});
