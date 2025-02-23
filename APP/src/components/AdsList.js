import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import AdCard from './AdCard';

const { width: viewportWidth } = Dimensions.get('window');

// Configuration for different category behaviors
const categoryCarouselConfig = {
  'New Course': {
    mode: 'depth',
    modeConfig: { depth: 200 },
    continuousScroll: false,
  },
  Product: {
    mode: 'default',
    modeConfig: {},
    continuousScroll: true,
  },
  Sale: {
    mode: 'horizontal-stack',
    modeConfig: { activeStackScale: 0.85, activeStackOffset: 30 },
    continuousScroll: false,
  },
  Promotion: {
    mode: 'default',
    modeConfig: {},
    continuousScroll: true,
  },
  Event: {
    mode: 'tinder',
    modeConfig: { duration: 400 },
    continuousScroll: false,
  },
};

const AdsList = ({ ads, onAdPress, currentTheme, category }) => {
  const carouselConfig = categoryCarouselConfig[category] || categoryCarouselConfig['New Course'];
  const scrollX = useSharedValue(0);

  useEffect(() => {
    if (carouselConfig.continuousScroll) {
      scrollX.value = withRepeat(
        withTiming(-viewportWidth, { duration: 7000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carouselConfig.continuousScroll ? scrollX.value : 0 }],
  }));

  const renderItem = ({ item, index }) => (
    <Animated.View style={[styles.animatedItem, carouselConfig.continuousScroll ? animatedStyle : {}]}>
      <AdCard
        key={item._id || index}
        adData={item}
        onPress={() => onAdPress(item)}
        currentTheme={currentTheme}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {carouselConfig.continuousScroll ? (
        // Marquee-style continuous scroll
        <Animated.View style={[styles.marqueeContainer, animatedStyle]}>
          {ads.concat(ads).map((item, index) => (
            <View key={item._id || index} style={styles.marqueeItem}>
              <AdCard
                adData={item}
                onPress={() => onAdPress(item)}
                currentTheme={currentTheme}
              />
            </View>
          ))}
        </Animated.View>
      ) : (
        // Standard carousel
        <Carousel
          data={ads}
          renderItem={renderItem}
          width={viewportWidth * 0.85}
          height={260}
          loop
          mode={carouselConfig.mode}
          modeConfig={carouselConfig.modeConfig}
          autoPlay
          autoPlayInterval={3000}
          scrollAnimationDuration={800}
          style={styles.carousel}
          snapEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    marginVertical: 20,
  },
  animatedItem: {
    width: viewportWidth * 0.85,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marqueeContainer: {
    flexDirection: 'row',
    width: viewportWidth * 2,
    overflow: 'hidden',
    alignItems: 'center',
  },
  marqueeItem: {
    width: viewportWidth * 0.85,
    height: 260,
    marginHorizontal: 10,
  },
});

export default AdsList;















// import React, { useEffect } from 'react';
// import { StyleSheet, Dimensions, View } from 'react-native';
// import Carousel from 'react-native-reanimated-carousel';
// import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
// import AdCard from './AdCard';

// const { width: viewportWidth } = Dimensions.get('window');

// // Configurations for categories
// const categoryCarouselConfig = {
//   'New Course': {
//     mode: 'depth',
//     modeConfig: { depth: 200 },
//   },
//   Product: {
//     mode: 'default', // Prevents coverflow issues
//     modeConfig: {},
//     continuousScroll: true,
//   },
//   Sale: {
//     mode: 'horizontal-stack',
//     modeConfig: { activeStackScale: 0.85, activeStackOffset: 30 },
//   },
//   Promotion: {
//     mode: 'default', // Works best for marquee-style scrolling
//     modeConfig: {},
//     continuousScroll: true,
//   },
//   Event: {
//     mode: 'tinder',
//     modeConfig: { duration: 400 },
//   },
// };

// const AdsList = ({ ads, onAdPress, currentTheme, category }) => {
//   const carouselConfig = categoryCarouselConfig[category] || categoryCarouselConfig['New Course'];

//   // Shared animation value for smooth scrolling
//   const scrollX = useSharedValue(0);

//   useEffect(() => {
//     if (carouselConfig.continuousScroll) {
//       scrollX.value = withRepeat(
//         withTiming(-viewportWidth, { duration: 7000, easing: Easing.linear }),
//         -1,
//         false
//       );
//     }
//   }, []);

//   // Animation style for marquee effect
//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: carouselConfig.continuousScroll ? scrollX.value : 0 }],
//   }));

//   const renderItem = ({ item, index }) => (
//     <Animated.View style={[styles.animatedItem, carouselConfig.continuousScroll ? animatedStyle : {}]}>
//       <AdCard key={index} adData={item} onPress={() => onAdPress(item)} currentTheme={currentTheme} />
//     </Animated.View>
//   );

//   return (
//     <View style={styles.container}>
//       {carouselConfig.continuousScroll ? (
//         // Continuous Scroll View for Promotion & Product
//         <Animated.View style={[styles.marqueeContainer, animatedStyle]}>
//           {ads.concat(ads).map((item, index) => (
//             <View key={index} style={styles.marqueeItem}>
//               <AdCard adData={item} onPress={() => onAdPress(item)} currentTheme={currentTheme} />
//             </View>
//           ))}
//         </Animated.View>
//       ) : (
//         // Regular Carousel for other categories
//         <Carousel
//           data={ads}
//           renderItem={renderItem}
//           width={viewportWidth * 0.85}
//           height={260}
//           loop
//           mode={carouselConfig.mode}
//           modeConfig={carouselConfig.modeConfig}
//           autoPlay
//           autoPlayInterval={3000}
//           scrollAnimationDuration={800}
//           style={styles.carousel}
//           snapEnabled
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   carousel: {
//     marginVertical: 20,
//   },
//   animatedItem: {
//     width: viewportWidth * 0.85,
//     height: 260,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   marqueeContainer: {
//     flexDirection: 'row',
//     width: viewportWidth * 2, // Double width for smooth loop
//     overflow: 'hidden',
//     alignItems: 'center',
//   },
//   marqueeItem: {
//     width: viewportWidth * 0.85,
//     height: 260,
//     marginHorizontal: 10,
//   },
// });

// export default AdsList;
