import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import AdCard from './AdCard';

const { width: viewportWidth } = Dimensions.get('window');

const AdsList = ({ ads, onAdPress, currentTheme }) => {
  // Determine layoutType from first ad's style config or default to 'carousel'
  const layoutType = ads[0]?.styleConfig?.layoutType || 'carousel'; // 'carousel' or 'marquee'
  const continuousScroll = layoutType === 'marquee';

  // Compute max dimensions from ads (with fallbacks)
  const defaultHeight = 260;
  const defaultWidth = viewportWidth * 0.85;
  const maxHeight = Math.max(...ads.map(ad => ad.styleConfig?.cardHeight || defaultHeight));
  const cardWidth = Math.max(...ads.map(ad => ad.styleConfig?.cardWidth || defaultWidth));

  const scrollX = useSharedValue(0);

  useEffect(() => {
    if (continuousScroll) {
      scrollX.value = withRepeat(
        withTiming(-cardWidth, { duration: 7000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [continuousScroll, cardWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: continuousScroll ? scrollX.value : 0 }],
  }));

  const renderItem = ({ item, index }) => (
    <Animated.View style={[styles.animatedItem, { width: cardWidth, height: maxHeight }, continuousScroll ? animatedStyle : {}]}>
      <AdCard key={index} adData={item} onPress={() => onAdPress(item)} currentTheme={currentTheme} />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { height: maxHeight }]}>
      {continuousScroll ? (
        <Animated.View style={[styles.marqueeContainer, animatedStyle, { height: maxHeight }]}>
          {ads.concat(ads).map((item, index) => (
            <View key={index} style={[styles.marqueeItem, { width: cardWidth, height: maxHeight }]}>
              <AdCard adData={item} onPress={() => onAdPress(item)} currentTheme={currentTheme} />
            </View>
          ))}
        </Animated.View>
      ) : (
        <Carousel
          data={ads}
          renderItem={renderItem}
          width={cardWidth}
          height={maxHeight}
          loop
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    marginVertical: 20,
  },
  animatedItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  marqueeContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
  },
  marqueeItem: {
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
