// src/screens/EnrollmentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { enrollInCourseAPI } from '../services/api'; // import your enroll function

const EnrollmentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params || {};
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally, fetch course details here or confirm with the user
    // e.g., "Are you sure you want to enroll in X course?"
  }, [courseId]);

  const handleEnroll = async () => {
    setLoading(true);
    const result = await enrollInCourseAPI(courseId);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'You have successfully enrolled in this course!');
      // Optionally navigate away:
      // navigation.navigate('MyEnrollmentsScreen');
      // or navigation.goBack();
    } else {
      Alert.alert('Error', result.message || 'Enrollment failed.');
    }
  };

  if (!courseId) {
    return (
      <View style={styles.centered}>
        <Text>No Course ID provided.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enroll in Course</Text>
      <Text style={styles.subtitle}>
        Course ID: {courseId}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Confirm Enrollment" onPress={handleEnroll} />
      )}
    </View>
  );
};

export default EnrollmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
});
