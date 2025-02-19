// src/screens/EnrollmentScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const EnrollmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params;

  const handleContinue = () => {
    // Further enrollment processing can be added here (e.g., payment)
    // For now, simply navigate back to courses
    navigation.navigate('Courses');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enrollment Confirmation</Text>
      <Text style={styles.message}>You have successfully enrolled in {course.title}.</Text>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EnrollmentScreen;
