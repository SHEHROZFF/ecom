// src/components/NewCourseAd.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const NewCourseAd = ({ onPress, currentTheme, adData }) => {
  // Use adData if provided; otherwise fallback to default values
  const {
    image = 'https://via.placeholder.com/150x100.png?text=New+Courses',
    title = 'New Courses Available!',
    subtitle = 'Discover the latest in AI and Machine Learning.',
  } = adData || {};

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.adContainer}>
      <LinearGradient
        colors={currentTheme.adGradient || ['#ff8a00', '#e52e71']}
        style={styles.adGradient}
      >
        <Image
          source={{ uri: image }}
          style={styles.adImage}
          resizeMode="contain"
        />
        <View style={styles.adTextContainer}>
          <Text style={[styles.adTitle, { color: currentTheme.adTextColor || '#fff' }]}>
            {title}
          </Text>
          <Text style={[styles.adSubtitle, { color: currentTheme.adTextColor || '#fff' }]}>
            {subtitle}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    width: 390,
  },
  adGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  adImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  adTextContainer: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  adSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default NewCourseAd;
