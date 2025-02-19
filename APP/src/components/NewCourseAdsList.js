// src/components/NewCourseAdsList.js
import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import NewCourseAd from './NewCourseAd';

const { width: viewportWidth } = Dimensions.get('window');

const NewCourseAdsList = ({ ads, onAdPress, currentTheme }) => {
  const renderItem = ({ item }) => (
    <NewCourseAd
      adData={item}
      onPress={() => onAdPress(item)}
      currentTheme={currentTheme}
    />
  );

  return (
    <Carousel
      data={ads}
      renderItem={renderItem}
      width={viewportWidth}
      height={150} // Adjust height to suit your ad design
      autoPlay={true}
      autoPlayInterval={3000} // Waits 3 seconds between slides
      animationDuration={800}   // Transition animation lasts 800ms
      loop={true}
      mode="horizontal-stack"
      modeConfig={{
        snapDirection: 'left',
        stackInterval: 25,
      }}
      style={styles.carousel}
    />
  );
};

const styles = StyleSheet.create({
  carousel: {
    marginVertical: 10,
  },
});

export default NewCourseAdsList;
