import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TouchableOpacity, 
  Image, 
  Text, 
  StyleSheet, 
  View, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

const FeaturedReel = ({
  course,
  reelWidth,
  reelHeight,
  onPress,
  currentTheme,
  reelsData = [], // Default to empty array if not provided
  initialIndex = 0,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Use a fallback if reelsData is empty
  const effectiveReels = reelsData && reelsData.length > 0 ? reelsData : [course];

  useEffect(() => {
    // Debug logs (feel free to remove in production)
    console.log('Effective Reels Data:', effectiveReels);
    console.log('Effective Reels Count:', effectiveReels.length);
    console.log('Initial Course ID:', course.id);
  }, [effectiveReels, course]);

  const handlePress = () => {
    const index = effectiveReels.findIndex(item => item.id === course.id);
    setCurrentIndex(index !== -1 ? index : 0);
    setModalVisible(true);
    if (onPress) onPress();
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Render each item in the full-screen carousel
  const renderCarouselItem = ({ item, index }) => {
    // Only play the video when it's the current reel
    const shouldPlay = index === currentIndex;
    return (
      <View style={styles.fullReelContainer}>
        {item.videoUrl ? (
          <Video
            source={{ uri: item.videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay={shouldPlay}
            useNativeControls={false}
            style={styles.fullScreenMedia}
          />
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.fullScreenMedia}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.fullOverlay}
        />
        <View style={styles.fullTitleContainer}>
          <Text style={styles.fullTitle}>{item.title}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Teaser Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.reelCard, { width: reelWidth, height: reelHeight }]}
        onPress={handlePress}
      >
        <View style={styles.mediaContainer}>
          {course.videoUrl ? (
            <Video
              source={{ uri: course.videoUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={true}
              resizeMode="cover"
              shouldPlay={false}
              style={styles.reelMedia}
            />
          ) : (
            <Image 
              source={{ uri: course.image }} 
              style={styles.reelMedia} 
              resizeMode="cover" 
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.reelOverlay}
          />
        </View>
        {/* Title and play icon */}
        <View style={styles.titleContainer}>
          <Text style={styles.reelTitle}>{course.title}</Text>
          {course.videoUrl && (
            <Ionicons 
              name="play-circle" 
              size={24} 
              color="#fff" 
              style={styles.playIcon} 
            />
          )}
        </View>
        {/* New: Course image overlay at top-right */}
        <View style={styles.topRightImageContainer}>
          <Image 
            source={{ uri: course.image }}
            style={styles.topRightImage}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>

      {/* Full-Screen Modal with Vertical Carousel */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Carousel
            data={effectiveReels}
            renderItem={renderCarouselItem}
            vertical={true}
            width={viewportWidth}
            height={viewportHeight}
            onSnapToItem={(index) => {
              setCurrentIndex(index);
            }}
            autoPlay={false}
            loop={false}
            mode="default"
          />
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  reelCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    elevation: 5,
    backgroundColor: '#000',
  },
  mediaContainer: {
    flex: 1,
  },
  reelMedia: {
    width: '100%',
    height: '100%',
  },
  reelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    justifyContent: 'flex-end',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  playIcon: {
    marginLeft: 8,
  },
  // New style for the top-right course image
  topRightImageContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topRightImage: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullReelContainer: {
    width: viewportWidth,
    height: viewportHeight,
    backgroundColor: '#000',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },
  fullOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
  },
  fullTitleContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  fullTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default FeaturedReel;
