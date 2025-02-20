import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { enrollInCourseAPI } from '../services/api'; // <--- import the new function

function CourseCard({ course, cardWidth, currentTheme }) {
  const navigation = useNavigation();

  const renderRating = useCallback((rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  }, []);

  const handleEnroll = useCallback(async () => {
    // Example call to enroll with the new advanced schema logic:
    const { success, message, data } = await enrollInCourseAPI(course.id);
    if (success) {
      Alert.alert('Enrollment', 'You have successfully enrolled!');
      // Optionally, navigate or refresh local state
    } else {
      Alert.alert('Error', message || 'Failed to enroll.');
    }
  }, [course.id]);

  const handleDetail = useCallback(() => {
    // Navigate to course detail screen
    navigation.navigate('CourseDetailScreen', { courseId: course.id });
  }, [course.id, navigation]);

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, width: cardWidth }]}>
      <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable} onPress={handleDetail}>
        <Image source={{ uri: course.image }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
            {course.title}
          </Text>
          <Text style={[styles.cardDescription, { color: currentTheme.textColor }]} numberOfLines={2}>
            {course.description}
          </Text>
          <View style={styles.ratingContainer}>
            {renderRating(course.rating)}
            <Text style={[styles.reviewCount, { color: currentTheme.textColor }]}>
              ({course.reviews})
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.enrollButton, { backgroundColor: currentTheme.primaryColor }]}
        onPress={handleEnroll}
      >
        <Text style={styles.enrollButtonText}>Enroll Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    margin: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  enrollButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 3,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default memo(CourseCard);











// import React, { memo, useCallback } from 'react';
// import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// function CourseCard({ course, cardWidth, currentTheme }) {
//   const navigation = useNavigation();

//   const renderRating = useCallback((rating) => {
//     const stars = [];
//     for (let i = 1; i <= 5; i++) {
//       stars.push(
//         <Ionicons
//           key={i}
//           name={i <= Math.floor(rating) ? 'star' : 'star-outline'}
//           size={16}
//           color="#FFD700"
//           style={{ marginRight: 2 }}
//         />
//       );
//     }
//     return stars;
//   }, []);

//   const handleEnroll = useCallback(() => {
//     navigation.navigate('EnrollmentScreen', { courseId: course.id }); 
//     // or course._id if you prefer
//   }, [course.id, navigation]);

//   const handleDetail = useCallback(() => {
//     navigation.navigate('CourseDetailScreen', { courseId: course.id });
//     // or course._id
//   }, [course.id, navigation]);

//   return (
//     <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, width: cardWidth }]}>
//       <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable} onPress={handleDetail}>
//         <Image source={{ uri: course.image }} style={styles.cardImage} resizeMode="cover" />
//         <View style={styles.cardContent}>
//           <Text style={[styles.cardTitle, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
//             {course.title}
//           </Text>
//           <Text style={[styles.cardDescription, { color: currentTheme.textColor }]} numberOfLines={2}>
//             {course.description}
//           </Text>
//           <View style={styles.ratingContainer}>
//             {renderRating(course.rating)}
//             <Text style={[styles.reviewCount, { color: currentTheme.textColor }]}>
//               ({course.reviews})
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.enrollButton, { backgroundColor: currentTheme.primaryColor }]}
//         onPress={handleEnroll}
//       >
//         <Text style={styles.enrollButtonText}>Enroll Now</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     borderRadius: 15,
//     margin: 10,
//     elevation: 5,
//     overflow: 'hidden',
//   },
//   cardTouchable: {
//     flex: 1,
//   },
//   cardImage: {
//     width: '100%',
//     height: 140,
//   },
//   cardContent: {
//     padding: 10,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   cardDescription: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 6,
//   },
//   reviewCount: {
//     fontSize: 12,
//     marginLeft: 4,
//   },
//   enrollButton: {
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     borderRadius: 20,
//     elevation: 3,
//   },
//   enrollButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });

// // Wrap with React.memo for performance
// export default memo(CourseCard);
