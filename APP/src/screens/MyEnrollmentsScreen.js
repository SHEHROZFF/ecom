// src/screens/MyEnrollmentsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import {
  getMyEnrollmentsAPI,
  unenrollFromCourseAPI,
} from '../services/api';

const MyEnrollmentsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadMyEnrollments();
  }, []);

  const loadMyEnrollments = async () => {
    setLoading(true);
    const { success, data, message } = await getMyEnrollmentsAPI();
    setLoading(false);
    if (success) {
      console.log('Enrollments:', data.enrollments);
      setEnrollments(data.enrollments);
    } else {
      Alert.alert('Error', message || 'Could not fetch enrollments.');
    }
  };

  const handleUnenroll = async (courseId) => {
    const { success, message } = await unenrollFromCourseAPI(courseId);
    if (success) {
      Alert.alert('Success', 'You have been unenrolled.');
      setEnrollments((prev) => prev.filter((en) => en.course._id !== courseId));
    } else {
      Alert.alert('Error', message || 'Failed to unenroll.');
    }
  };

  const renderEnrollment = ({ item }) => {
    const { course, paymentStatus, status, progress, enrolledAt } = item;
    // Ensure progress is a number between 0 and 100
    const progressPercent = progress ? Math.round(progress) : 0;
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.borderColor,
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          {course.image ? (
            <Image
              source={{ uri: course.image }}
              style={styles.courseImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.courseImage,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: currentTheme.backgroundColor,
                },
              ]}
            >
              <Ionicons name="image" size={48} color={currentTheme.textColor} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.headerGradient}
          />
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText} numberOfLines={1}>
              {course.title}
            </Text>
          </View>
          <View style={styles.enrollmentIcon}>
            <FontAwesome5 name="user-graduate" size={20} color="#fff" />
          </View>
          {/* New: Progress Indicator at Top Right */}
          <View style={styles.progressIndicator}>
            <Progress.Circle
              size={40}
              progress={progressPercent / 100}
              // showsText={true}
              // formatText={() => `${progressPercent}%`}
              color={currentTheme.primaryColor}
              unfilledColor={currentTheme.borderColor}
              borderWidth={0}
              thickness={6}
              textStyle={{ color: currentTheme.textColor, fontWeight: '700', fontSize: 16 }}
            />
            <Text style={[styles.infoText, { color: currentTheme.textColor }]}>
              {progressPercent}% Complete
            </Text>
          </View>
        </View>
        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={currentTheme.primaryColor} />
            <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
              {course.instructor || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="payment" size={16} color={currentTheme.primaryColor} />
            <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
              {paymentStatus}
            </Text>
            <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 10 }]}>
              • {status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color={currentTheme.primaryColor} />
            <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
              Enrolled: {new Date(enrolledAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={currentTheme.primaryColor} />
            <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
              {course.numberOfLectures} Lectures
            </Text>
          </View>
          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentTheme.errorColor || '#FF3B30' }]}
              onPress={() => handleUnenroll(course._id)}
            >
              <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Unenroll</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentTheme.primaryColor || '#007AFF' }]}
              onPress={() => navigation.navigate('EnrolledCourseScreen', { courseId: course._id })}
            >
              <Ionicons name="book" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Go to Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && enrollments.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.centered}>
          <Text style={{ color: currentTheme.textColor }}>You are not enrolled in any courses.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={currentTheme.headerBackground}
        style={styles.header}
        start={[0, 0]}
        end={[1, 1]}
      >
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: currentTheme.headerTextColor }]}>
          My Enrollments
        </Text>
      </LinearGradient>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item._id}
        renderItem={renderEnrollment}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

export default MyEnrollmentsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#007AFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20,
  },
  headerBackButton: {
    position: 'absolute',
    left: 30,
    top: 25,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enrollment Card Styles
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#e0e0e0',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  titleBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  titleBadgeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  enrollmentIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 20,
  },
  // New: Progress Indicator at top-right inside card header
  progressIndicator: {
    position: 'absolute',
    top: 255,
    right: 20,
    alignItems: 'center',
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  button: {
    flex: 0.48,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});










// // src/screens/MyEnrollmentsScreen.js

// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   Alert,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Image,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
// import {
//   getMyEnrollmentsAPI,
//   unenrollFromCourseAPI,
// } from '../services/api';

// const MyEnrollmentsScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;
//   const [loading, setLoading] = useState(false);
//   const [enrollments, setEnrollments] = useState([]);
//   const navigation = useNavigation();

//   useEffect(() => {
//     loadMyEnrollments();
//   }, []);

//   const loadMyEnrollments = async () => {
//     setLoading(true);
//     const { success, data, message } = await getMyEnrollmentsAPI();
//     setLoading(false);
//     if (success) {
//       console.log("Enrollments:", data.enrollments);
//       setEnrollments(data.enrollments);
//     } else {
//       Alert.alert('Error', message || 'Could not fetch enrollments.');
//     }
//   };

//   const handleUnenroll = async (courseId) => {
//     const { success, message } = await unenrollFromCourseAPI(courseId);
//     if (success) {
//       Alert.alert('Success', 'You have been unenrolled.');
//       setEnrollments((prev) => prev.filter((en) => en.course._id !== courseId));
//     } else {
//       Alert.alert('Error', message || 'Failed to unenroll.');
//     }
//   };

//   const renderEnrollment = ({ item }) => {
//     const { course, paymentStatus, status, progress, enrolledAt } = item;
//     return (
//       <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
//         {/* Card Header: Course Image with Gradient, Title Badge & Enrollment Icon */}
//         {course.image && (
//           <View style={styles.cardHeader}>
//             <Image source={{ uri: course.image }} style={styles.courseImage} resizeMode="cover" />
//             <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.headerGradient} />
//             <View style={styles.titleBadge}>
//               <Text style={styles.titleBadgeText} numberOfLines={1}>
//                 {course.title}
//               </Text>
//             </View>
//             <View style={styles.enrollmentIcon}>
//               <FontAwesome5 name="user-graduate" size={20} color="#fff" />
//             </View>
//           </View>
//         )}
//         {/* Card Content */}
//         <View style={styles.cardContent}>
//           <View style={styles.infoRow}>
//             <Ionicons name="person" size={16} color={currentTheme.primaryColor} />
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
//               {course.instructor || 'N/A'}
//             </Text>
//           </View>
//           <View style={styles.infoRow}>
//             <MaterialIcons name="payment" size={16} color={currentTheme.primaryColor} />
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
//               {paymentStatus}
//             </Text>
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 10 }]}>
//               • {status.toUpperCase()}
//             </Text>
//           </View>
//           <View style={styles.infoRow}>
//             <Ionicons name="trending-up" size={16} color={currentTheme.primaryColor} />
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
//               Progress: {progress}%
//             </Text>
//           </View>
//           <View style={styles.infoRow}>
//             <Ionicons name="time" size={16} color={currentTheme.primaryColor} />
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
//               Enrolled: {new Date(enrolledAt).toLocaleDateString()}
//             </Text>
//           </View>
//           <View style={styles.infoRow}>
//             <Ionicons name="document-text" size={16} color={currentTheme.primaryColor} />
//             <Text style={[styles.infoText, { color: currentTheme.textColor, marginLeft: 4 }]}>
//               {course.numberOfLectures} Lectures
//             </Text>
//           </View>
//           {/* Action Buttons */}
//           <View style={styles.actionsRow}>
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: currentTheme.errorColor || '#FF3B30' }]}
//               onPress={() => handleUnenroll(course._id)}
//             >
//               <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 6 }} />
//               <Text style={styles.buttonText}>Unenroll</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: currentTheme.primaryColor || '#007AFF' }]}
//               onPress={() => navigation.navigate('EnrolledCourseScreen', { courseId: course._id })}
//             >
//               <Ionicons name="book" size={18} color="#fff" style={{ marginRight: 6 }} />
//               <Text style={styles.buttonText}>Go to Course</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color={currentTheme.primaryColor} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!loading && enrollments.length === 0) {
//     return (
//       <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//         <View style={styles.centered}>
//           <Text style={{ color: currentTheme.textColor }}>You are not enrolled in any courses.</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={[0, 0]}
//         end={[1, 1]}
//       >
//         <Text style={[styles.headerText, { color: currentTheme.headerTextColor }]}>
//           My Enrollments
//         </Text>
//       </LinearGradient>
//       <FlatList
//         data={enrollments}
//         keyExtractor={(item) => item._id}
//         renderItem={renderEnrollment}
//         contentContainerStyle={styles.listContent}
//       />
//     </SafeAreaView>
//   );
// };

// export default MyEnrollmentsScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 40,
//     borderBottomRightRadius: 40,
//     elevation: 6,
//     marginBottom: 20,
//     backgroundColor: '#007AFF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   headerText: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#fff',
//     textAlign: 'center',
//   },
//   listContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   card: {
//     borderRadius: 18,
//     borderWidth: 1,
//     overflow: 'hidden',
//     marginBottom: 20,
//     backgroundColor: '#fff',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//   },
//   cardHeader: {
//     width: '100%',
//     height: 180,
//     position: 'relative',
//   },
//   courseImage: {
//     width: '100%',
//     height: '100%',
//   },
//   headerGradient: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 60,
//   },
//   titleBadge: {
//     position: 'absolute',
//     bottom: 10,
//     left: 10,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 10,
//   },
//   titleBadgeText: {
//     fontSize: 18,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   enrollmentIcon: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 6,
//     borderRadius: 20,
//   },
//   cardContent: {
//     padding: 20,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 2,
//   },
//   infoText: {
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   actionsRow: {
//     flexDirection: 'row',
//     marginTop: 20,
//     justifyContent: 'space-between',
//   },
//   button: {
//     flex: 0.48,
//     flexDirection: 'row',
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });
