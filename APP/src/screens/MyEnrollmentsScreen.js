// src/screens/MyEnrollmentsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  getMyEnrollmentsAPI,
  unenrollFromCourseAPI
} from '../services/api'; // import your new endpoints

const MyEnrollmentsScreen = () => {
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
      // data.enrollments has the array
      setEnrollments(data.enrollments);
    } else {
      Alert.alert('Error', message || 'Could not fetch enrollments.');
    }
  };

  const handleUnenroll = async (courseId) => {
    const { success, message } = await unenrollFromCourseAPI(courseId);
    if (success) {
      Alert.alert('Success', 'You have been unenrolled.');
      // Remove from local state
      setEnrollments((prev) =>
        prev.filter((en) => en.course._id !== courseId)
      );
    } else {
      Alert.alert('Error', message || 'Failed to unenroll.');
    }
  };

  const renderEnrollment = ({ item }) => {
    const { course, paymentStatus, status, progress } = item;
    // "course" is populated with .populate('course') in the controller

    return (
      <View style={styles.enrollmentItem}>
        <Text style={styles.courseTitle}>
          {course.title}
        </Text>
        <Text style={styles.courseSubInfo}>
          Instructor: {course.instructor || 'N/A'}
        </Text>
        <Text style={styles.courseSubInfo}>
          Payment: {paymentStatus}, Status: {status}, Progress: {progress}%
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.unenrollBtn}
            onPress={() => handleUnenroll(course._id)}
          >
            <Text style={styles.unenrollText}>Unenroll</Text>
          </TouchableOpacity>

          {/* Possibly go to "CourseDetailScreen" */}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() =>
              navigation.navigate('CourseDetailScreen', {
                courseId: course._id,
              })
            }
          >
            <Text style={styles.detailText}>Go to Course</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!loading && enrollments.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>You are not enrolled in any courses.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={enrollments}
      keyExtractor={(item) => item._id}
      renderItem={renderEnrollment}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default MyEnrollmentsScreen;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollmentItem: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  courseSubInfo: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  unenrollBtn: {
    padding: 8,
    backgroundColor: 'red',
    borderRadius: 5,
    marginRight: 10,
  },
  unenrollText: {
    color: '#fff',
  },
  detailBtn: {
    padding: 8,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  detailText: {
    color: '#fff',
  },
});
