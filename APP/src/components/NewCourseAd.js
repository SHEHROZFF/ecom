import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: viewportWidth } = Dimensions.get('window');

const NewCourseAd = ({ onPress, currentTheme, adData }) => {
  const {
    image = 'https://via.placeholder.com/300x180.png?text=New+Courses',
    title = 'New Courses Available!',
    subtitle = 'Discover the latest in AI and Machine Learning.',
  } = adData || {};

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.adContainer}>
      <ImageBackground
        source={{ uri: image }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          // slightly more subtle gradient for a modern overlay
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientOverlay}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.adTitle, { color: currentTheme?.adTextColor || '#fff' }]}>
              {title}
            </Text>
            <Text style={[styles.adSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: viewportWidth * 0.8,
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    // Subtle shadow for iOS + elevation for Android
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
  },
  textContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
  },
  adTitle: {
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  adSubtitle: {
    fontSize: 14,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default NewCourseAd;
