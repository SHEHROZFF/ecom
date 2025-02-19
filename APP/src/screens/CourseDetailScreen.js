// src/screens/CourseDetailScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Video } from 'expo-av';

const CourseDetailScreen = () => {
  const route = useRoute();
  const { course } = route.params;

  // State for video controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome key={`star-${i}`} name="star" size={20} color="#FFD700" />
      );
    }
    if (halfStar) {
      stars.push(
        <FontAwesome key="star-half" name="star-half-full" size={20} color="#FFD700" />
      );
    }
    return stars;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Media Section */}
      {course.videoUrl ? (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: course.videoUrl }}
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
            source={{ uri: course.image }}
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
        <Text style={styles.title}>{course.title}</Text>

        {course.rating && (
          <View style={styles.ratingContainer}>
            {renderStars(course.rating)}
            <Text style={styles.ratingText}>
              {course.rating} ({course.reviews || 0} reviews)
            </Text>
          </View>
        )}

        <Text style={styles.description}>{course.description}</Text>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Course Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{course.duration || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Level:</Text>
            <Text style={styles.detailValue}>{course.level || 'Beginner'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Language:</Text>
            <Text style={styles.detailValue}>{course.language || 'English'}</Text>
          </View>
        </View>

        {course.instructor && (
          <View style={styles.instructorSection}>
            <Text style={styles.sectionTitle}>Instructor</Text>
            <View style={styles.instructorInfo}>
              <Image
                source={{ uri: course.instructor.image }}
                style={styles.instructorImage}
              />
              <View style={styles.instructorDetails}>
                <Text style={styles.instructorName}>
                  {course.instructor.name}
                </Text>
                <Text style={styles.instructorBio}>
                  {course.instructor.bio}
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.enrollButton}
          onPress={() => {
            // Enrollment logic here
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

const styles = StyleSheet.create({
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
    left: 320,
    flexDirection: 'row',
    justifyContent: 'center',
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
    shadowColor: "#000",
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
    marginBottom: 15,
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
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#777',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
  },
  instructorSection: {
    marginBottom: 20,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  instructorDetails: {
    flex: 1,
  },
  instructorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  instructorBio: {
    fontSize: 14,
    color: '#666',
  },
  enrollButton: {
    marginTop: 10,
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

export default CourseDetailScreen;
