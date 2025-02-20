import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import NewCourseAd from './NewCourseAd';

const { width: viewportWidth } = Dimensions.get('window');

/**
 * A more modern, parallax-based carousel for course ads.
 */
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
      /**
       * Make the carousel narrower than the screen so we see the next/prev item edges.
       * This also helps highlight the parallax effect.
       */
      width={viewportWidth * 0.83}
      height={220}
      autoPlay
      autoPlayInterval={3500}
      scrollAnimationDuration={800}
      loop
      /**
       * "parallax" gives a 3D sliding effect.
       * You can also try "horizontal-stack" or "tinder" for a different effect.
       */
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 0.9,
        parallaxScrollingOffset: 60,
      }}
      /**
       * Bump up paging/snap for a smooth user experience
       */
      pagingEnabled
      snapEnabled
      style={styles.carousel}
    />
  );
};

const styles = StyleSheet.create({
  carousel: {
    marginVertical: 10,
    // center the carousel horizontally
    alignSelf: 'center',
  },
});

export default NewCourseAdsList;
