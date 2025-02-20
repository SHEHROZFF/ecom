// src/screens/CourseDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Video } from 'expo-av';

import { fetchCourseById } from '../services/api'; // Make sure this fetches all the fields

const CourseDetailScreen = () => {
  const route = useRoute();
  const { courseId } = route.params;

  // Local state for the course details
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Video controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // On mount, fetch the course by ID
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

  // Helper for star rating
  const renderStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesome key={`star-${i}`} name="star" size={20} color="#FFD700" />);
    }
    if (halfStar) {
      stars.push(<FontAwesome key="star-half" name="star-half-full" size={20} color="#FFD700" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading course details...</Text>
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
        <Text>Course not found.</Text>
      </View>
    );
  }

  // Now we have a valid `course` with expanded fields
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
  } = course;

  // Main media
  const mainVideoUrl = shortVideoLink || (videos && videos.length > 0 && videos[0].url);

  return (
    <ScrollView style={styles.container}>
      {/* Media Section */}
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
            colors={['rgba(0,0,0,0.3)', 'transparent']}
            style={styles.mediaGradient}
          />
          <View style={styles.videoControls}>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.controlButton}
            >
              <FontAwesome
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsMuted(!isMuted)}
              style={styles.controlButton}
            >
              <FontAwesome
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: image }}
            style={styles.media}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent']}
            style={styles.mediaGradient}
          />
        </View>
      )}

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        {rating ? (
          <View style={styles.ratingContainer}>
            {renderStars(rating)}
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} ({reviews || 0} reviews)
            </Text>
          </View>
        ) : null}

        <Text style={styles.description}>{description}</Text>

        {/* Additional Fields */}
        <View style={styles.detailGroup}>
          <Text style={styles.detailLabel}>Difficulty:</Text>
          <Text style={styles.detailValue}>{difficultyLevel}</Text>
        </View>

        <View style={styles.detailGroup}>
          <Text style={styles.detailLabel}>Language:</Text>
          <Text style={styles.detailValue}>{language}</Text>
        </View>

        {category ? (
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{category}</Text>
          </View>
        ) : null}

        {totalDuration > 0 ? (
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Total Duration:</Text>
            <Text style={styles.detailValue}>{totalDuration} minutes</Text>
          </View>
        ) : null}

        {numberOfLectures > 0 ? (
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Lectures:</Text>
            <Text style={styles.detailValue}>{numberOfLectures}</Text>
          </View>
        ) : null}

        {tags && tags.length > 0 && (
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Tags: </Text>
            <Text style={styles.detailValue}>{tags.join(', ')}</Text>
          </View>
        )}

        {/* Requirements */}
        {requirements && requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements / Prerequisites</Text>
            {requirements.map((req, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                • {req}
              </Text>
            ))}
          </View>
        )}

        {/* What You'll Learn */}
        {whatYouWillLearn && whatYouWillLearn.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You'll Learn</Text>
            {whatYouWillLearn.map((item, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                ✓ {item}
              </Text>
            ))}
          </View>
        )}

        {/* Topics or Modules */}
        {topics && topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topics Covered</Text>
            {topics.map((topic, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                - {topic}
              </Text>
            ))}
          </View>
        )}

        {/* Show the full list of videos */}
        {videos && videos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Curriculum</Text>
            {videos.map((video, i) => (
              <View key={i} style={styles.videoItem}>
                <Text style={styles.videoTitle}>
                  {i + 1}. {video.title}
                </Text>
                <Text style={styles.videoDuration}>
                  Duration: {video.duration || 0} min
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.enrollButton}
          onPress={() => {
            // Enrollment or purchase logic
          }}
        >
          <LinearGradient
            colors={['#4c669f', '#3b5998']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.enrollButtonGradient}
          >
            <Text style={styles.enrollButtonText}>Enroll Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CourseDetailScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  mediaContainer: {
    height: 250,
    backgroundColor: '#000',
    overflow: 'hidden',
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
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 100,
    marginHorizontal: 5,
  },
  content: {
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Elevation for Android
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
  detailGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: 5,
    color: '#333',
  },
  detailValue: {
    color: '#666',
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginVertical: 3,
  },
  videoItem: {
    marginVertical: 5,
  },
  videoTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  videoDuration: {
    fontSize: 13,
    color: '#777',
  },
  enrollButton: {
    marginTop: 20,
    marginBottom: 30,
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

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// import { useRoute } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { FontAwesome } from '@expo/vector-icons';
// import { Video } from 'expo-av';

// import { fetchCourseById } from '../services/api'; // Your new or existing function

// const CourseDetailScreen = () => {
//   const route = useRoute();
//   const { courseId } = route.params;  // We'll pass courseId, not course

//   // Local state for the course details
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Video controls
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isMuted, setIsMuted] = useState(false);

//   // On mount, fetch the course by ID
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

//   // Helper for star rating
//   const renderStars = (rating = 0) => {
//     const stars = [];
//     const fullStars = Math.floor(rating);
//     const halfStar = rating - fullStars >= 0.5;

//     for (let i = 0; i < fullStars; i++) {
//       stars.push(<FontAwesome key={`star-${i}`} name="star" size={20} color="#FFD700" />);
//     }
//     if (halfStar) {
//       stars.push(<FontAwesome key="star-half" name="star-half-full" size={20} color="#FFD700" />);
//     }
//     return stars;
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0000ff" />
//         <Text style={{ marginTop: 10 }}>Loading course details...</Text>
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
//         <Text>Course not found.</Text>
//       </View>
//     );
//   }

//   // Now we have a valid `course` from the server
//   const { title, rating, reviews, description, image, videos, shortVideoLink } = course;
//   // We'll treat shortVideoLink as "videoUrl" for the main media

//   const mainVideoUrl = shortVideoLink || videos?.[0]?.url || null;
//   // or you can do your own fallback logic

//   return (
//     <ScrollView style={styles.container}>
//       {/* Media Section */}
//       {mainVideoUrl ? (
//         <View style={styles.mediaContainer}>
//           <Video
//             source={{ uri: mainVideoUrl }}
//             style={styles.media}
//             resizeMode="cover"
//             shouldPlay={isPlaying}
//             isLooping
//             isMuted={isMuted}
//           />
//           <LinearGradient
//             colors={['rgba(0,0,0,0.3)', 'transparent']}
//             style={styles.mediaGradient}
//           />
//           <View style={styles.videoControls}>
//             <TouchableOpacity
//               onPress={() => setIsPlaying(!isPlaying)}
//               style={styles.controlButton}
//             >
//               <FontAwesome
//                 name={isPlaying ? 'pause' : 'play'}
//                 size={24}
//                 color="#fff"
//               />
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => setIsMuted(!isMuted)}
//               style={styles.controlButton}
//             >
//               <FontAwesome
//                 name={isMuted ? 'volume-off' : 'volume-up'}
//                 size={24}
//                 color="#fff"
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : (
//         <View style={styles.mediaContainer}>
//           <Image
//             source={{ uri: image }}
//             style={styles.media}
//             resizeMode="cover"
//           />
//           <LinearGradient
//             colors={['rgba(0,0,0,0.3)', 'transparent']}
//             style={styles.mediaGradient}
//           />
//         </View>
//       )}

//       {/* Content Section */}
//       <View style={styles.content}>
//         <Text style={styles.title}>{title}</Text>

//         {!!rating && (
//           <View style={styles.ratingContainer}>
//             {renderStars(rating)}
//             <Text style={styles.ratingText}>
//               {rating} ({reviews || 0} reviews)
//             </Text>
//           </View>
//         )}

//         <Text style={styles.description}>{description}</Text>

//         {/* Example additional detail if you stored them: course.duration, etc. */}
//         {/* <View style={styles.detailsSection}>
//           ...
//         </View> */}

//         {/* Possibly an instructor field if your server returns it. 
//             If course.instructor is a string, or an object with name & image, etc. */}
        
//         <TouchableOpacity
//           style={styles.enrollButton}
//           onPress={() => {
//             // Enrollment logic here
//           }}
//         >
//           <LinearGradient
//             colors={['#4c669f', '#3b5998']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.enrollButtonGradient}
//           >
//             <Text style={styles.enrollButtonText}>Enroll Now</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// // ------------------------------------------------------------------
// // Styles
// // ------------------------------------------------------------------
// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#f2f2f2',
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
//     right: 20, // changed from left:320 for more universal usage
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   controlButton: {
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 10,
//     borderRadius: 100,
//     marginHorizontal: 5,
//   },
//   content: {
//     backgroundColor: '#fff',
//     marginTop: -20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     // Shadow for iOS
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     // Elevation for Android
//     elevation: 5,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: '#333',
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
//     color: '#666',
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#555',
//     marginBottom: 20,
//   },
//   detailsSection: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 10,
//   },
//   enrollButton: {
//     marginTop: 10,
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

// export default CourseDetailScreen;












// // // src/screens/CourseDetailScreen.js
// // import React, { useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   Image,
// //   StyleSheet,
// //   ScrollView,
// //   TouchableOpacity,
// //   Platform,
// // } from 'react-native';
// // import { useRoute } from '@react-navigation/native';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import { FontAwesome } from '@expo/vector-icons';
// // import { Video } from 'expo-av';

// // const CourseDetailScreen = () => {
// //   const route = useRoute();
// //   const { course } = route.params;

// //   // State for video controls
// //   const [isPlaying, setIsPlaying] = useState(true);
// //   const [isMuted, setIsMuted] = useState(false);

// //   const renderStars = (rating) => {
// //     const stars = [];
// //     const fullStars = Math.floor(rating);
// //     const halfStar = rating - fullStars >= 0.5;
// //     for (let i = 0; i < fullStars; i++) {
// //       stars.push(
// //         <FontAwesome key={`star-${i}`} name="star" size={20} color="#FFD700" />
// //       );
// //     }
// //     if (halfStar) {
// //       stars.push(
// //         <FontAwesome key="star-half" name="star-half-full" size={20} color="#FFD700" />
// //       );
// //     }
// //     return stars;
// //   };

// //   return (
// //     <ScrollView style={styles.container}>
// //       {/* Media Section */}
// //       {/* {course.videoUrl ? (
// //         <View style={styles.mediaContainer}>
// //           <Video
// //             source={{ uri: course.videoUrl }}
// //             style={styles.media}
// //             resizeMode="cover"
// //             shouldPlay={isPlaying}
// //             isLooping
// //             isMuted={isMuted}
// //           />
// //           <LinearGradient
// //             colors={['rgba(0,0,0,0.3)', 'transparent']}
// //             style={styles.mediaGradient}
// //           />
// //           <View style={styles.videoControls}>
// //             <TouchableOpacity
// //               onPress={() => setIsPlaying(!isPlaying)}
// //               style={styles.controlButton}
// //             >
// //               <FontAwesome
// //                 name={isPlaying ? 'pause' : 'play'}
// //                 size={24}
// //                 color="#fff"
// //               />
// //             </TouchableOpacity>
// //             <TouchableOpacity
// //               onPress={() => setIsMuted(!isMuted)}
// //               style={styles.controlButton}
// //             >
// //               <FontAwesome
// //                 name={isMuted ? 'volume-off' : 'volume-up'}
// //                 size={24}
// //                 color="#fff"
// //               />
// //             </TouchableOpacity>
// //           </View>
// //         </View>
// //       ) : (
// //         <View style={styles.mediaContainer}>
// //           <Image
// //             source={{ uri: course.image }}
// //             style={styles.media}
// //             resizeMode="cover"
// //           />
// //           <LinearGradient
// //             colors={['rgba(0,0,0,0.3)', 'transparent']}
// //             style={styles.mediaGradient}
// //           />
// //         </View>
// //       )} */}

// //       {/* Content Section */}
// //       <View style={styles.content}>
// //         <Text style={styles.title}>{course.title}</Text>

// //         {course.rating && (
// //           <View style={styles.ratingContainer}>
// //             {renderStars(course.rating)}
// //             <Text style={styles.ratingText}>
// //               {course.rating} ({course.reviews || 0} reviews)
// //             </Text>
// //           </View>
// //         )}

// //         <Text style={styles.description}>{course.description}</Text>

// //         <View style={styles.detailsSection}>
// //           <Text style={styles.sectionTitle}>Course Details</Text>
// //           <View style={styles.detailRow}>
// //             <Text style={styles.detailLabel}>Duration:</Text>
// //             <Text style={styles.detailValue}>{course.duration || 'N/A'}</Text>
// //           </View>
// //           <View style={styles.detailRow}>
// //             <Text style={styles.detailLabel}>Level:</Text>
// //             <Text style={styles.detailValue}>{course.level || 'Beginner'}</Text>
// //           </View>
// //           <View style={styles.detailRow}>
// //             <Text style={styles.detailLabel}>Language:</Text>
// //             <Text style={styles.detailValue}>{course.language || 'English'}</Text>
// //           </View>
// //         </View>

// //         {course.instructor && (
// //           <View style={styles.instructorSection}>
// //             <Text style={styles.sectionTitle}>Instructor</Text>
// //             <View style={styles.instructorInfo}>
// //               <Image
// //                 source={{ uri: course.instructor.image }}
// //                 style={styles.instructorImage}
// //               />
// //               <View style={styles.instructorDetails}>
// //                 <Text style={styles.instructorName}>
// //                   {course.instructor.name}
// //                 </Text>
// //                 <Text style={styles.instructorBio}>
// //                   {course.instructor.bio}
// //                 </Text>
// //               </View>
// //             </View>
// //           </View>
// //         )}

// //         <TouchableOpacity
// //           style={styles.enrollButton}
// //           onPress={() => {
// //             // Enrollment logic here
// //           }}
// //         >
// //           <LinearGradient
// //             colors={['#4c669f', '#3b5998']}
// //             start={{ x: 0, y: 0 }}
// //             end={{ x: 1, y: 0 }}
// //             style={styles.enrollButtonGradient}
// //           >
// //             <Text style={styles.enrollButtonText}>Enroll Now</Text>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //       </View>
// //     </ScrollView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#f2f2f2',
// //   },
// //   mediaContainer: {
// //     height: 250,
// //     backgroundColor: '#000',
// //     overflow: 'hidden',
// //   },
// //   media: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   mediaGradient: {
// //     position: 'absolute',
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     height: 80,
// //   },
// //   videoControls: {
// //     position: 'absolute',
// //     bottom: 30,
// //     left: 320,
// //     flexDirection: 'row',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   controlButton: {
// //     backgroundColor: 'rgba(0,0,0,0.6)',
// //     padding: 10,
// //     borderRadius: 100,
// //     marginHorizontal: 5,
// //   },
// //   content: {
// //     backgroundColor: '#fff',
// //     marginTop: -20,
// //     borderTopLeftRadius: 20,
// //     borderTopRightRadius: 20,
// //     padding: 20,
// //     // Shadow for iOS
// //     shadowColor: "#000",
// //     shadowOffset: { width: 0, height: -3 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 3,
// //     // Elevation for Android
// //     elevation: 5,
// //   },
// //   title: {
// //     fontSize: 26,
// //     fontWeight: '700',
// //     color: '#333',
// //     marginBottom: 10,
// //   },
// //   ratingContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   ratingText: {
// //     marginLeft: 8,
// //     fontSize: 16,
// //     color: '#666',
// //   },
// //   description: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     color: '#555',
// //     marginBottom: 20,
// //   },
// //   detailsSection: {
// //     marginBottom: 20,
// //   },
// //   sectionTitle: {
// //     fontSize: 20,
// //     fontWeight: '600',
// //     color: '#333',
// //     marginBottom: 10,
// //   },
// //   detailRow: {
// //     flexDirection: 'row',
// //     marginBottom: 6,
// //   },
// //   detailLabel: {
// //     fontSize: 16,
// //     fontWeight: '500',
// //     color: '#777',
// //     width: 100,
// //   },
// //   detailValue: {
// //     fontSize: 16,
// //     color: '#555',
// //   },
// //   instructorSection: {
// //     marginBottom: 20,
// //   },
// //   instructorInfo: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //   },
// //   instructorImage: {
// //     width: 60,
// //     height: 60,
// //     borderRadius: 30,
// //     marginRight: 15,
// //   },
// //   instructorDetails: {
// //     flex: 1,
// //   },
// //   instructorName: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     color: '#333',
// //   },
// //   instructorBio: {
// //     fontSize: 14,
// //     color: '#666',
// //   },
// //   enrollButton: {
// //     marginTop: 10,
// //   },
// //   enrollButtonGradient: {
// //     paddingVertical: 14,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //   },
// //   enrollButtonText: {
// //     color: '#fff',
// //     fontSize: 18,
// //     fontWeight: '600',
// //   },
// // });

// // export default CourseDetailScreen;
