import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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

  const handleEnroll = useCallback(() => {
    navigation.navigate('PurchaseScreen', { courseId: course._id });
  }, [course._id, navigation]);

  const handleDetail = useCallback(() => {
    navigation.navigate('CourseDetailScreen', { courseId: course._id });
  }, [course._id, navigation]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const hasRegularPrice = typeof course.price === 'number';
  const hasSalePrice = course.saleEnabled && typeof course.salePrice === 'number';
  const discountPercentage =
    hasSalePrice && hasRegularPrice
      ? Math.round((1 - course.salePrice / course.price) * 100)
      : 0;

  // Swing animation for the tag (imitating a hanging tag)
  const swingAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(swingAnim, {
          toValue: -1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [swingAnim]);

  const swing = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-7deg', '7deg'],
  });

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, width: cardWidth }]}>
      <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable} onPress={handleDetail}>
        <Image source={{ uri: course.image }} style={styles.cardImage} resizeMode="cover" />

        {/* Category Badge */}
        {course.category && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{course.category}</Text>
          </View>
        )}

        {/* Duration Badge */}
        {course.totalDuration && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={styles.durationText}>{formatDuration(course.totalDuration)}</Text>
          </View>
        )}

        {/* Enhanced Realistic Sale Tag with Hanging Chain */}
        {course.saleEnabled && discountPercentage > 0 && (
          <View style={styles.saleContainer}>
            <Animated.View style={[styles.saleTag, { transform: [{ rotate: swing }] }]}>
              <LinearGradient
                colors={['#ff4d4d', '#e60000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saleGradient}
              >
                {/* Tag hole for the chain */}
                <View style={styles.hole} />
                <Text style={styles.saleText}>SALE {discountPercentage}% OFF</Text>
              </LinearGradient>
            </Animated.View>
            {/* <View style={styles.chain} /> */}
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
            {course.title}
          </Text>
          <Text style={[styles.cardDescription, { color: currentTheme.textColor }]} numberOfLines={2}>
            {course.description}
          </Text>
          <View style={styles.detailRow}>
            {renderRating(course.rating)}
            <Text style={[styles.reviewCount, { color: currentTheme.textColor }]}>
              ({course.reviews})
            </Text>
          </View>
          <View style={styles.detailRow}>
            {course.difficultyLevel && (
              <Text style={[styles.detailText, { color: currentTheme.textColor }]}>
                {course.difficultyLevel}
              </Text>
            )}
            {course.numberOfLectures && (
              <Text style={[styles.detailText, { color: currentTheme.textColor }]}>
                • {course.numberOfLectures} Lectures
              </Text>
            )}
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTouchable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  saleContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    alignItems: 'center',
  },
  saleTag: {
    // Container for the swinging animation
  },
  saleGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4,
  },
  hole: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  saleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chain: {
    marginTop: 2,
    width: 2,
    height: 30,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dotted',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  enrollButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 4,
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
//     navigation.navigate('PurchaseScreen', { courseId: course._id });
//   }, [course._id, navigation]);

//   const handleDetail = useCallback(() => {
//     navigation.navigate('CourseDetailScreen', { courseId: course._id });
//   }, [course._id, navigation]);

//   // Helper to convert seconds into a "hh:mm" format
//   const formatDuration = (minutes) => {
//     // const minutes = Math.floor(seconds / 60);
//     const hrs = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
//   };

//   return (
//     <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, width: cardWidth }]}>
//       <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable} onPress={handleDetail}>
//         <Image source={{ uri: course.image }} style={styles.cardImage} resizeMode="cover" />

//         {/* Category Badge */}
//         {course.category && (
//           <View style={styles.badgeContainer}>
//             <Text style={styles.badgeText}>{course.category}</Text>
//           </View>
//         )}

//         {/* Total Duration Badge */}
//         {course.totalDuration && (
//           <View style={styles.durationBadge}>
//             <Ionicons name="time-outline" size={12} color="#fff" />
//             <Text style={styles.durationText}>{formatDuration(course.totalDuration)}</Text>
//           </View>
//         )}

//         <View style={styles.cardContent}>
//           <Text style={[styles.cardTitle, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
//             {course.title}
//           </Text>
//           <Text style={[styles.cardDescription, { color: currentTheme.textColor }]} numberOfLines={2}>
//             {course.description}
//           </Text>
//           <View style={styles.detailRow}>
//             {renderRating(course.rating)}
//             <Text style={[styles.reviewCount, { color: currentTheme.textColor }]}>
//               ({course.reviews})
//             </Text>
//           </View>
//           <View style={styles.detailRow}>
//             {course.difficultyLevel && (
//               <Text style={[styles.detailText, { color: currentTheme.textColor }]}>
//                 {course.difficultyLevel}
//               </Text>
//             )}
//             {course.numberOfLectures && (
//               <Text style={[styles.detailText, { color: currentTheme.textColor }]}>
//                 • {course.numberOfLectures} Lectures
//               </Text>
//             )}
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
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   cardTouchable: {
//     flex: 1,
//   },
//   cardImage: {
//     width: '100%',
//     height: 150,
//   },
//   badgeContainer: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     borderRadius: 5,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   durationBadge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'rgba(0,0,0,0.75)',
//     borderRadius: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 6,
//     paddingVertical: 4,
//   },
//   durationText: {
//     color: '#fff',
//     fontSize: 12,
//     marginLeft: 4,
//     fontWeight: '500',
//   },
//   cardContent: {
//     padding: 12,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   cardDescription: {
//     fontSize: 14,
//     marginTop: 6,
//     lineHeight: 20,
//   },
//   reviewCount: {
//     fontSize: 12,
//     marginLeft: 4,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   detailText: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginRight: 8,
//   },
//   enrollButton: {
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//     elevation: 4,
//   },
//   enrollButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });

// export default memo(CourseCard);









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
