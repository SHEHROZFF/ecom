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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Video } from 'expo-av';

import { fetchCourseById } from '../services/api';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';

const { width } = Dimensions.get('window');

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
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={{ marginTop: 10, color: currentTheme.textColor }}>Loading course details...</Text>
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
  } = course;

  // Choose main media (video if available, else image)
  const mainVideoUrl = shortVideoLink || (videos && videos.length > 0 && videos[0].url);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={currentTheme.headerBackground[1]}
        barStyle={currentTheme.statusBarStyle}
      />

      {/* Header */}
      <LinearGradient colors={currentTheme.headerBackground} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.controlButton}>
                <FontAwesome name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.controlButton}>
                <FontAwesome name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: image }} style={styles.media} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent']}
              style={styles.mediaGradient}
            />
          </View>
        )}

        {/* Details Container */}
        <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <Text style={[styles.title, { color: currentTheme.cardTextColor }]}>{title}</Text>

          {rating ? (
            <View style={styles.ratingContainer}>
              {renderStars(rating)}
              <Text style={[styles.ratingText, { color: currentTheme.textColor }]}>
                {rating.toFixed(1)} ({reviews || 0} reviews)
              </Text>
            </View>
          ) : null}

          <Text style={[styles.description, { color: currentTheme.textColor }]}>{description}</Text>

          <View style={styles.detailGroup}>
            <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Difficulty:</Text>
            <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{difficultyLevel}</Text>
          </View>

          <View style={styles.detailGroup}>
            <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Language:</Text>
            <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{language}</Text>
          </View>

          {category && (
            <View style={styles.detailGroup}>
              <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Category:</Text>
              <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{category}</Text>
            </View>
          )}

          {totalDuration > 0 && (
            <View style={styles.detailGroup}>
              <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Total Duration:</Text>
              <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{totalDuration} minutes</Text>
            </View>
          )}

          {numberOfLectures > 0 && (
            <View style={styles.detailGroup}>
              <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Lectures:</Text>
              <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{numberOfLectures}</Text>
            </View>
          )}

          {tags && tags.length > 0 && (
            <View style={styles.detailGroup}>
              <Text style={[styles.detailLabel, { color: currentTheme.textColor }]}>Tags:</Text>
              <Text style={[styles.detailValue, { color: currentTheme.textColor }]}>{tags.join(', ')}</Text>
            </View>
          )}

          {requirements && requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
                Requirements / Prerequisites
              </Text>
              {requirements.map((req, idx) => (
                <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
                  • {req}
                </Text>
              ))}
            </View>
          )}

          {whatYouWillLearn && whatYouWillLearn.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
                What You'll Learn
              </Text>
              {whatYouWillLearn.map((item, idx) => (
                <Text key={idx} style={[styles.bulletItem, { color: currentTheme.textColor }]}>
                  ✓ {item}
                </Text>
              ))}
            </View>
          )}

          {topics && topics.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
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
              <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
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

          <TouchableOpacity style={styles.enrollButton} onPress={() => {
            // Enrollment or purchase logic here
          }}>
            <LinearGradient
              colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollButtonGradient}
            >
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    width: width * 0.7,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  detailsContainer: {
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
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
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  detailGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: 5,
  },
  detailValue: {},
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 14,
    marginLeft: 10,
    marginVertical: 3,
  },
  videoItem: {
    marginVertical: 5,
  },
  videoTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  videoDuration: {
    fontSize: 13,
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
