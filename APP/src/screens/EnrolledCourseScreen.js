// src/screens/EnrolledCourseScreen.js

import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as Progress from 'react-native-progress';
import {
  fetchCourseById,
  getMyEnrollmentsAPI,
  updateEnrollmentAPI,
} from '../services/api';
import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';

const { width } = Dimensions.get('window');

const EnrolledCourseScreen = () => {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('description');

  // For lesson video modal
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [modalIsPlaying, setModalIsPlaying] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);

  // Fade animation for scroll content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const courseRes = await fetchCourseById(courseId);
        if (courseRes.success) {
          setCourse(courseRes.data);
        } else {
          Alert.alert('Error', courseRes.message);
        }
        const enrollRes = await getMyEnrollmentsAPI();
        if (enrollRes.success) {
          const found = enrollRes.data.enrollments.find(
            (en) => en.course._id === courseId
          );
          if (found) {
            setEnrollment(found);
          } else {
            Alert.alert('Error', 'Enrollment not found for this course.');
          }
        } else {
          Alert.alert('Error', enrollRes.message);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };
    loadData();
  }, [courseId]);

  // Overall progress as fraction (0 to 1)
  const calculateOverallProgress = () => {
    if (!course || !course.videos || !enrollment) return 0;
    const totalLessons = course.videos.length;
    const completedLessons = (enrollment.lessonsProgress || []).filter(
      (lp) => lp.completed
    ).length;
    return totalLessons > 0 ? completedLessons / totalLessons : 0;
  };

  // Open lesson modal; we use the lesson's index as an identifier
  const handleLessonPress = (lesson, index) => {
    setSelectedLesson({ ...lesson, lessonIndex: index });
    setModalIsPlaying(true);
  };

  // Track playback status for updating progress
  const onPlaybackStatusUpdate = (status) => {
    setVideoStatus(status);
    if (
      status.isLoaded &&
      status.durationMillis > 0 &&
      status.positionMillis / status.durationMillis >= 0.9 &&
      selectedLesson &&
      (!enrollment.lessonsProgress ||
        !enrollment.lessonsProgress.find(
          (lp) => lp.lessonId === selectedLesson.lessonIndex && lp.completed
        ))
    ) {
      markLessonCompleted(selectedLesson);
    }
  };

  // Update the enrollment record with lesson progress
  const markLessonCompleted = async (lesson) => {
    const currentProgress = enrollment.lessonsProgress || [];
    const updatedProgress = currentProgress.some((lp) => lp.lessonId === lesson.lessonIndex)
      ? currentProgress.map((lp) =>
          lp.lessonId === lesson.lessonIndex
            ? { ...lp, watchedDuration: videoStatus.positionMillis || 0, completed: true }
            : lp
        )
      : [
          ...currentProgress,
          { lessonId: lesson.lessonIndex, watchedDuration: videoStatus.positionMillis || 0, completed: true },
        ];
    const updatedEnrollment = { ...enrollment, lessonsProgress: updatedProgress };
    setEnrollment(updatedEnrollment);
    const updateRes = await updateEnrollmentAPI(courseId, { lessonsProgress: updatedProgress });
    if (!updateRes.success) {
      Alert.alert('Error', updateRes.message || 'Failed to update lesson progress.');
    }
  };

  const closeModal = () => {
    setSelectedLesson(null);
    setModalIsPlaying(false);
  };

  if (loading || !course || !enrollment) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
      </SafeAreaView>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar backgroundColor={currentTheme.headerBackground[1]} barStyle={currentTheme.statusBarStyle} />
      {/* Hero Header */}
      <LinearGradient colors={currentTheme.headerBackground} style={styles.header}>
        {course.image && (
          <Image source={{ uri: course.image }} style={styles.heroImage} resizeMode="cover" />
        )}
        <View style={styles.overlay} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1}>
            {course.title}
          </Text>
          <View style={styles.progressContainer}>
            <Progress.Circle
              size={60}
              progress={overallProgress}
              showsText={true}
              color={currentTheme.primaryColor}
              unfilledColor={currentTheme.borderColor}
              borderWidth={0}
              thickness={5}
              formatText={() => `${Math.round(overallProgress * 100)}%`}
              textStyle={{ color: currentTheme.headerTextColor, fontWeight: '600' }}
            />
            <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor, marginTop: 8 }]}>
              Overall Progress
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: currentTheme.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'description' && styles.activeTab]}
          onPress={() => setSelectedTab('description')}
        >
          <Ionicons name="information-circle-outline" size={20} color={selectedTab === 'description' ? '#fff' : currentTheme.textColor} />
          <Text style={[styles.tabText, { color: selectedTab === 'description' ? '#fff' : currentTheme.textColor }]}>
            Description
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'lessons' && styles.activeTab]}
          onPress={() => setSelectedTab('lessons')}
        >
          <Ionicons name="play-circle-outline" size={20} color={selectedTab === 'lessons' ? '#fff' : currentTheme.textColor} />
          <Text style={[styles.tabText, { color: selectedTab === 'lessons' ? '#fff' : currentTheme.textColor }]}>
            Lessons
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'description' ? (
          <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.detailRow}>
              <Ionicons name="school-outline" size={20} color={currentTheme.primaryColor} />
              <Text style={[styles.detailText, { color: currentTheme.textColor }]}>{course.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color={currentTheme.primaryColor} />
              <Text style={[styles.detailText, { color: currentTheme.textColor }]}>Instructor: {course.instructor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={currentTheme.primaryColor} />
              <Text style={[styles.detailText, { color: currentTheme.textColor }]}>{course.totalDuration} mins</Text>
            </View>
            {course.tags && course.tags.length > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={20} color={currentTheme.primaryColor} />
                <Text style={[styles.detailText, { color: currentTheme.textColor }]}>{course.tags.join(', ')}</Text>
              </View>
            )}
            <Text style={[styles.description, { color: currentTheme.textColor, marginTop: 15 }]}>{course.description}</Text>
          </View>
        ) : (
          // Lessons Tab
          <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.primaryColor, marginBottom: 10 }]}>Lessons</Text>
            {course.videos.map((lesson, index) => {
              const lessonProgress = enrollment.lessonsProgress?.find((lp) => lp.lessonId === index);
              const isCompleted = lessonProgress && lessonProgress.completed;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.lessonCard, { borderColor: currentTheme.borderColor }]}
                  onPress={() => handleLessonPress(lesson, index)}
                >
                  <View style={styles.lessonInfo}>
                    <Ionicons name="play-circle" size={20} color={currentTheme.primaryColor} />
                    <Text style={[styles.lessonTitle, { color: currentTheme.textColor }]}>
                      {index + 1}. {lesson.title}
                    </Text>
                  </View>
                  {isCompleted && <Ionicons name="checkmark-circle" size={22} color={currentTheme.primaryColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Modal for Lesson Playback */}
      <Modal visible={!!selectedLesson} animationType="slide" onRequestClose={closeModal} transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.backgroundColor }]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
              <Ionicons name="close" size={28} color={currentTheme.textColor} />
            </TouchableOpacity>
            {selectedLesson && (
              <Video
                ref={videoRef}
                source={{ uri: selectedLesson.url }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode="cover"
                shouldPlay={modalIsPlaying}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EnrolledCourseScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 220,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
    elevation: 6,
    marginBottom: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: 220,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  headerTitleContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  detailsContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginHorizontal: -20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  lessonCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 18,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: width * 0.6,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});
