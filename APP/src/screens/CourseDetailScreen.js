// src/screens/CourseDetailScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

import { fetchCourseById } from '../services/api';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import ReviewPopup from '../components/ReviewPopup';

const { width, height } = Dimensions.get('window');

const CourseDetailScreen = () => {
  const route = useRoute();
  const { courseId } = route.params;
  const navigation = useNavigation();

  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  // Local state for course details
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Video controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // For Reviews Popup
  const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);

  // Fetch course data on mount
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={{ marginTop: 10, color: currentTheme.textColor }}>
          Loading course details...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.textColor }}>Course not found.</Text>
      </View>
    );
  }

  // Destructure course details
  const {
    title,
    rating,
    reviews,
    description,
    image,
    videos,
    shortVideoLink,
    difficultyLevel,
    language,
    topics,
    totalDuration,
    numberOfLectures,
    category,
    tags,
    requirements,
    whatYouWillLearn,
    price
  } = course;

  // Choose main media (video if available, else image)
  const mainVideoUrl = shortVideoLink || (videos && videos.length > 0 && videos[0].url);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={currentTheme.headerBackground[1]}
        barStyle={currentTheme.statusBarStyle}
      />

      {/* Enhanced Hero Header */}
      <LinearGradient colors={currentTheme.headerBackground} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1}>
            {title}
          </Text>
          {category && (
            <Text
              style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category} {language && `- ${language}`}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Media Section (Video or Image) */}
        {mainVideoUrl ? (
          <View style={styles.mediaContainer}>
            <Video
              source={{ uri: mainVideoUrl }}
              style={styles.media}
              resizeMode="cover"
              shouldPlay={isPlaying}
              isLooping
              isMuted={isMuted}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'transparent']}
              style={styles.mediaGradient}
            />
            <View style={styles.videoControls}>
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.controlButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.controlButton}>
                <Ionicons name={isMuted ? 'volume-off' : 'volume-high'} size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: image }} style={styles.media} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'transparent']}
              style={styles.mediaGradient}
            />
          </View>
        )}

        {/* Course Info Card */}
        <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <Text style={[styles.title, { color: currentTheme.cardTextColor }]}>{title}</Text>

          {/* Rating & Reviews */}
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }, (_, index) => {
              const filled = index < Math.floor(rating);
              return (
                <Ionicons
                  key={index}
                  name={filled ? 'star' : 'star-outline'}
                  size={20}
                  color={filled ? '#FFD700' : '#FFD70099'}
                  style={styles.starIcon}
                />
              );
            })}
            <TouchableOpacity onPress={() => setReviewPopupVisible(true)}>
              <Text style={[styles.ratingText, { color: currentTheme.textColor }]}>
                ({reviews || 0} reviews)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description?.length > 0 && (
            <Text style={[styles.description, { color: currentTheme.textColor }]}>{description}</Text>
          )}

          {/* Course Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.primaryColor }]}>
              Course Details
            </Text>
            {difficultyLevel && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Difficulty:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>
                  {difficultyLevel}
                </Text>
              </View>
            )}
            {language && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Language:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{language}</Text>
              </View>
            )}
            {category && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Category:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{category}</Text>
              </View>
            )}
            {totalDuration > 0 && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>
                  Total Duration:
                </Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>
                  {totalDuration} minutes
                </Text>
              </View>
            )}
            {numberOfLectures > 0 && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Lectures:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>
                  {numberOfLectures}
                </Text>
              </View>
            )}
            {tags && tags.length > 0 && (
              <View style={styles.detailGroup}>
                <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Tags:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>
                  {tags.join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* Requirements */}
          {!!requirements?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
                Requirements / Prerequisites
              </Text>
              {requirements.map((req, idx) => (
                <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
                  • {req}
                </Text>
              ))}
            </View>
          )}

          {/* What You'll Learn */}
          {!!whatYouWillLearn?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
                What You'll Learn
              </Text>
              {whatYouWillLearn.map((item, idx) => (
                <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
                  ✓ {item}
                </Text>
              ))}
            </View>
          )}

          {/* Topics Covered */}
          {!!topics?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
                Topics Covered
              </Text>
              {topics.map((topic, idx) => (
                <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
                  - {topic}
                </Text>
              ))}
            </View>
          )}

          {videos && videos.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
                Course Curriculum
              </Text>
              {videos.map((video, i) => (
                <View key={i} style={styles.videoItem}>
                  <Text style={[styles.videoTitle, { color: currentTheme.textColor }]}>
                    {i + 1}. {video.title}
                  </Text>
                  <Text style={[styles.videoDuration, { color: currentTheme.textColor }]}>
                    Duration: {video.duration || 0} sec
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => {
              // If the course is paid, navigate to purchase logic; otherwise enroll directly.
              if (price && price > 0) {
                // Replace 'PurchaseScreen' with your purchase flow screen, if needed.
                navigation.navigate('PurchaseScreen', { courseId: course._id });
              } else {
                // Handle free course enrollment logic
                // enrollCourse(course._id);
                console.log('Enrolling for free course:', course._id);
              }
            }}
          >
            <LinearGradient
              colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollButtonGradient}
            >
              <Text style={styles.enrollButtonText}>
                {price && price > 0 ? `Buy for $${price.toFixed(2)}` : 'Enroll Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Enroll Button */}
          {/* <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => {
              // Enrollment or purchase logic here
            }}
          >
            <LinearGradient
              colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollButtonGradient}
            >
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </LinearGradient>
          </TouchableOpacity> */}
        </View>
      </ScrollView>

      {/* Review Popup Modal */}
      <Modal
        visible={isReviewPopupVisible}
        animationType="slide"
        onRequestClose={() => setReviewPopupVisible(false)}
        transparent={true}
      >
        <ReviewPopup
          closePopup={() => setReviewPopupVisible(false)}
          reviewableId={course._id}
          reviewableType="Course"
        />
      </Modal>
    </SafeAreaView>
  );
};

export default CourseDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 4,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    padding: 8,
    zIndex: 10,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    width: width * 0.65,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Media
  mediaContainer: {
    height: 250,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    // marginTop: 10,
    marginBottom: 20,
    marginHorizontal: -8,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  videoControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 30,
    marginLeft: 10,
  },

  // Course Info Container
  detailsContainer: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginHorizontal: -8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    width: width * 0.6,
    textAlign: 'center',
  },
  // Sections
  section: {
    marginTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.7,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailGroup: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: '600',
    width: 130,
    marginRight: 5,
  },
  detailValue: {
    flex: 1,
  },
  bulletItem: {
    fontSize: 15,
    marginLeft: 10,
    marginBottom: 4,
  },

  // Enroll Button
  enrollButton: {
    marginTop: 20,
    marginBottom: 60,
  },
  enrollButtonGradient: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});















// // src/screens/CourseDetailScreen.js

// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av';

// import { fetchCourseById } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import ReviewPopup from '../components/ReviewPopup';

// const { width } = Dimensions.get('window');

// const CourseDetailScreen = () => {
//   const route = useRoute();
//   const { courseId } = route.params;
//   const navigation = useNavigation();
  
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Local state for course details
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Video controls
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isMuted, setIsMuted] = useState(false);

//   // For Reviews Popup
//   const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);

//   // Fetch course data on mount
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

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ marginTop: 10, color: currentTheme.textColor }}>Loading course details...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ color: 'red' }}>{error}</Text>
//       </View>
//     );
//   }

//   if (!course) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ color: currentTheme.textColor }}>Course not found.</Text>
//       </View>
//     );
//   }

//   // Destructure course details
//   const {
//     title,
//     rating,
//     reviews,
//     description,
//     image,
//     videos,
//     shortVideoLink,
//     difficultyLevel,
//     language,
//     topics,
//     totalDuration,
//     numberOfLectures,
//     category,
//     tags,
//     requirements,
//     whatYouWillLearn,
//   } = course;

//   // Choose main media (video if available, else image)
//   const mainVideoUrl = shortVideoLink || (videos && videos.length > 0 && videos[0].url);

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={currentTheme.statusBarStyle}
//       />

//       {/* Enhanced Header with curved bottom */}
//       <LinearGradient colors={currentTheme.headerBackground} style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1}>
//             {title}
//           </Text>
//         </View>
//       </LinearGradient>

//       <ScrollView 
//         contentContainerStyle={styles.scrollContent} 
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Media Section */}
//         {mainVideoUrl ? (
//           <View style={styles.mediaContainer}>
//             <Video
//               source={{ uri: mainVideoUrl }}
//               style={styles.media}
//               resizeMode="cover"
//               shouldPlay={isPlaying}
//               isLooping
//               isMuted={isMuted}
//             />
//             <LinearGradient
//               colors={['rgba(0,0,0,0.3)', 'transparent']}
//               style={styles.mediaGradient}
//             />
//             <View style={styles.videoControls}>
//               <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.controlButton}>
//                 <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.controlButton}>
//                 <Ionicons name={isMuted ? 'volume-off' : 'volume-high'} size={24} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         ) : (
//           <View style={styles.mediaContainer}>
//             <Image source={{ uri: image }} style={styles.media} resizeMode="cover" />
//             <LinearGradient
//               colors={['rgba(0,0,0,0.3)', 'transparent']}
//               style={styles.mediaGradient}
//             />
//           </View>
//         )}

//         {/* Details Container */}
//         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
//           <Text style={[styles.title, { color: currentTheme.cardTextColor }]}>{title}</Text>

//           {/* Rating & Reviews */}
//           <View style={styles.ratingContainer}>
//             {Array.from({ length: 5 }, (_, index) => (
//               <Ionicons
//                 key={index}
//                 name={index < Math.floor(rating) ? 'star' : 'star-outline'}
//                 size={20}
//                 color="#FFD700"
//               />
//             ))}
//             <TouchableOpacity onPress={() => setReviewPopupVisible(true)}>
//               <Text style={[styles.ratingText, { color: currentTheme.textColor }]}>
//                 ({reviews || 0} reviews)
//               </Text>
//             </TouchableOpacity>
//           </View>

//           <Text style={[styles.description, { color: currentTheme.textColor }]}>{description}</Text>

//           {/* Enhanced Content Headings */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, { color: currentTheme.primaryColor }]}>
//               Course Details
//             </Text>
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Difficulty:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{difficultyLevel}</Text>
//             </View>
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Language:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{language}</Text>
//             </View>
//             {category && (
//               <View style={styles.detailGroup}>
//                 <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Category:</Text>
//                 <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{category}</Text>
//               </View>
//             )}
//             {totalDuration > 0 && (
//               <View style={styles.detailGroup}>
//                 <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Total Duration:</Text>
//                 <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{totalDuration} minutes</Text>
//               </View>
//             )}
//             {numberOfLectures > 0 && (
//               <View style={styles.detailGroup}>
//                 <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Lectures:</Text>
//                 <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{numberOfLectures}</Text>
//               </View>
//             )}
//             {tags && tags.length > 0 && (
//               <View style={styles.detailGroup}>
//                 <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Tags:</Text>
//                 <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{tags.join(', ')}</Text>
//               </View>
//             )}
//           </View>

//           {requirements && requirements.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
//                 Requirements / Prerequisites
//               </Text>
//               {requirements.map((req, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   • {req}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {whatYouWillLearn && whatYouWillLearn.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
//                 What You'll Learn
//               </Text>
//               {whatYouWillLearn.map((item, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   ✓ {item}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {topics && topics.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.secondaryColor }]}>
//                 Topics Covered
//               </Text>
//               {topics.map((topic, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   - {topic}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {/* Enroll Button */}
//           <TouchableOpacity style={styles.enrollButton} onPress={() => {
//             // Enrollment or purchase logic here
//           }}>
//             <LinearGradient
//               colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.enrollButtonGradient}
//             >
//               <Text style={styles.enrollButtonText}>Enroll Now</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       {/* Review Popup Modal */}
//       <Modal
//         visible={isReviewPopupVisible}
//         animationType="slide"
//         onRequestClose={() => setReviewPopupVisible(false)}
//         transparent={true}
//       >
//         <ReviewPopup
//           closePopup={() => setReviewPopupVisible(false)}
//           reviewableId={course._id}
//           reviewableType="Course"
//         />
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default CourseDetailScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     width: '100%',
//     paddingVertical: 12,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     padding: 8,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     width: width * 0.7,
//     textAlign: 'center',
//   },
//   scrollContent: {
//     paddingBottom: 20,
//     paddingHorizontal: 15,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mediaContainer: {
//     height: 250,
//     backgroundColor: '#000',
//     overflow: 'hidden',
//     borderRadius: 15,
//     marginVertical: 10,
//   },
//   media: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 15,
//   },
//   mediaGradient: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 80,
//     borderBottomLeftRadius: 15,
//     borderBottomRightRadius: 15,
//   },
//   videoControls: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   controlButton: {
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 10,
//     borderRadius: 50,
//     marginHorizontal: 5,
//   },
//   detailsContainer: {
//     marginTop: -20,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 20,
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     marginBottom: 12,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   ratingText: {
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     marginBottom: 20,
//   },
//   detailGroup: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   detailLabel: {
//     fontWeight: '600',
//     marginRight: 5,
//     width: 120,
//   },
//   detailValue: {
//     flex: 1,
//   },
//   section: {
//     marginTop: 20,
//     marginBottom: 10,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     marginBottom: 8,
//     textTransform: 'uppercase',
//     letterSpacing: 1,
//   },
//   bulletItem: {
//     fontSize: 14,
//     marginLeft: 10,
//     marginVertical: 3,
//   },
//   enrollButton: {
//     marginTop: 20,
//     marginBottom: 30,
//   },
//   enrollButtonGradient: {
//     paddingVertical: 14,
//     borderRadius: 30,
//     alignItems: 'center',
//   },
//   enrollButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });









// // src/screens/CourseDetailScreen.js

// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av';

// import { fetchCourseById } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import ReviewPopup from '../components/ReviewPopup';

// const { width } = Dimensions.get('window');

// const CourseDetailScreen = () => {
//   const route = useRoute();
//   const { courseId } = route.params;
//   const navigation = useNavigation();
  
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Local state for course details
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Video controls
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isMuted, setIsMuted] = useState(false);

//   // For Reviews Popup
//   const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);

//   // Fetch course data on mount
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

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         <Text style={{ marginTop: 10, color: currentTheme.textColor }}>Loading course details...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ color: 'red' }}>{error}</Text>
//       </View>
//     );
//   }

//   if (!course) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ color: currentTheme.textColor }}>Course not found.</Text>
//       </View>
//     );
//   }

//   // Destructure course details
//   const {
//     title,
//     rating,
//     reviews,
//     description,
//     image,
//     videos,
//     shortVideoLink,
//     difficultyLevel,
//     language,
//     topics,
//     totalDuration,
//     numberOfLectures,
//     category,
//     tags,
//     requirements,
//     whatYouWillLearn,
//   } = course;

//   // Choose main media (video if available, else image)
//   const mainVideoUrl = shortVideoLink || (videos && videos.length > 0 && videos[0].url);

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={currentTheme.statusBarStyle}
//       />

//       {/* Header */}
//       <LinearGradient colors={currentTheme.headerBackground} style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1}>
//             {title}
//           </Text>
//         </View>
//       </LinearGradient>

//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Media Section */}
//         {mainVideoUrl ? (
//           <View style={styles.mediaContainer}>
//             <Video
//               source={{ uri: mainVideoUrl }}
//               style={styles.media}
//               resizeMode="cover"
//               shouldPlay={isPlaying}
//               isLooping
//               isMuted={isMuted}
//             />
//             <LinearGradient
//               colors={['rgba(0,0,0,0.3)', 'transparent']}
//               style={styles.mediaGradient}
//             />
//             <View style={styles.videoControls}>
//               <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.controlButton}>
//                 <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.controlButton}>
//                 <Ionicons name={isMuted ? 'volume-off' : 'volume-high'} size={24} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         ) : (
//           <View style={styles.mediaContainer}>
//             <Image source={{ uri: image }} style={styles.media} resizeMode="cover" />
//             <LinearGradient
//               colors={['rgba(0,0,0,0.3)', 'transparent']}
//               style={styles.mediaGradient}
//             />
//           </View>
//         )}

//         {/* Details Container */}
//         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
//           <Text style={[styles.title, { color: currentTheme.cardTextColor }]}>{title}</Text>

//           {/* Rating & Reviews */}
//           <View style={styles.ratingContainer}>
//             {Array.from({ length: 5 }, (_, index) => (
//               <Ionicons
//                 key={index}
//                 name={index < Math.floor(rating) ? 'star' : 'star-outline'}
//                 size={20}
//                 color="#FFD700"
//               />
//             ))}
//             <TouchableOpacity onPress={() => setReviewPopupVisible(true)}>
//               <Text style={[styles.ratingText, { color: currentTheme.textColor }]}>
//                 ({reviews || 0} reviews)
//               </Text>
//             </TouchableOpacity>
//           </View>

//           <Text style={[styles.description, { color: currentTheme.textColor }]}>{description}</Text>

//           <View style={styles.detailGroup}>
//             <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Difficulty:</Text>
//             <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{difficultyLevel}</Text>
//           </View>

//           <View style={styles.detailGroup}>
//             <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Language:</Text>
//             <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{language}</Text>
//           </View>

//           {category && (
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Category:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{category}</Text>
//             </View>
//           )}

//           {totalDuration > 0 && (
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Total Duration:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{totalDuration} minutes</Text>
//             </View>
//           )}

//           {numberOfLectures > 0 && (
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Lectures:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{numberOfLectures}</Text>
//             </View>
//           )}

//           {tags && tags.length > 0 && (
//             <View style={styles.detailGroup}>
//               <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Tags:</Text>
//               <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{tags.join(', ')}</Text>
//             </View>
//           )}

//           {requirements && requirements.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//                 Requirements / Prerequisites
//               </Text>
//               {requirements.map((req, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   • {req}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {whatYouWillLearn && whatYouWillLearn.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//                 What You'll Learn
//               </Text>
//               {whatYouWillLearn.map((item, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   ✓ {item}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {topics && topics.length > 0 && (
//             <View style={styles.section}>
//               <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//                 Topics Covered
//               </Text>
//               {topics.map((topic, idx) => (
//                 <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
//                   - {topic}
//                 </Text>
//               ))}
//             </View>
//           )}

//           {/* Enroll Button */}
//           <TouchableOpacity style={styles.enrollButton} onPress={() => {
//             // Enrollment or purchase logic here
//           }}>
//             <LinearGradient
//               colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.enrollButtonGradient}
//             >
//               <Text style={styles.enrollButtonText}>Enroll Now</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       {/* Review Popup Modal */}
//       <Modal
//         visible={isReviewPopupVisible}
//         animationType="slide"
//         onRequestClose={() => setReviewPopupVisible(false)}
//         transparent={true}
//       >
//         <ReviewPopup
//           closePopup={() => setReviewPopupVisible(false)}
//           reviewableId={course._id}
//           reviewableType="Course"
//         />
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default CourseDetailScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     width: '100%',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 4,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     padding: 8,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     width: width * 0.7,
//     textAlign: 'center',
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mediaContainer: {
//     height: 250,
//     backgroundColor: '#000',
//     overflow: 'hidden',
//   },
//   media: {
//     width: '100%',
//     height: '100%',
//   },
//   mediaGradient: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 80,
//   },
//   videoControls: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   controlButton: {
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 10,
//     borderRadius: 100,
//     marginHorizontal: 5,
//   },
//   detailsContainer: {
//     marginTop: -20,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     marginBottom: 10,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   ratingText: {
//     marginLeft: 8,
//     fontSize: 16,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     marginBottom: 15,
//   },
//   detailGroup: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   detailLabel: {
//     fontWeight: '600',
//     marginRight: 5,
//   },
//   detailValue: {},
//   section: {
//     marginTop: 15,
//     marginBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 5,
//   },
//   bulletItem: {
//     fontSize: 14,
//     marginLeft: 10,
//     marginVertical: 3,
//   },
//   enrollButton: {
//     marginTop: 20,
//     marginBottom: 30,
//   },
//   enrollButtonGradient: {
//     paddingVertical: 14,
//     borderRadius: 30,
//     alignItems: 'center',
//   },
//   enrollButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });
