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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import { LinearGradient } from 'expo-linear-gradient';
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
      console.log(data);
      
      setEnrollments(data.enrollments);
    } else {
      Alert.alert('Error', message || 'Could not fetch enrollments.');
    }
  };

  const handleUnenroll = async (courseId) => {
    const { success, message } = await unenrollFromCourseAPI(courseId);
    if (success) {
      Alert.alert('Success', 'You have been unenrolled.');
      setEnrollments((prev) =>
        prev.filter((en) => en.course._id !== courseId)
      );
    } else {
      Alert.alert('Error', message || 'Failed to unenroll.');
    }
  };

  const renderEnrollment = ({ item }) => {
    const { course, paymentStatus, status, progress } = item;
    return (
      <View style={[styles.card, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
        <Text style={[styles.courseTitle, { color: currentTheme.textColor }]}>{course.title}</Text>
        <Text style={[styles.courseSubInfo, { color: currentTheme.textColor }]}>
          Instructor: {course.instructor || 'N/A'}
        </Text>
        <Text style={[styles.courseSubInfo, { color: currentTheme.textColor }]}>
          Payment: {paymentStatus} • Status: {status} • Progress: {progress}%
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.button, styles.unenrollButton, { backgroundColor: currentTheme.errorColor || '#E53935' }]}
            onPress={() => handleUnenroll(course._id)}
          >
            <Text style={styles.buttonText}>Unenroll</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.detailButton, { backgroundColor: currentTheme.primaryColor || '#1976D2' }]}
            onPress={() =>
              navigation.navigate('CourseDetailScreen', { courseId: course._id })
            }
          >
            <Text style={styles.buttonText}>Go to Course</Text>
          </TouchableOpacity>
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
          <Text style={{ color: currentTheme.textColor }}>
            You are not enrolled in any courses.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <LinearGradient
        colors={currentTheme.headerBackground}
        style={styles.header}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
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
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 6,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  courseSubInfo: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
  },
  button: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  unenrollButton: {},
  detailButton: {},
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
