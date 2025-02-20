import React, { useState, memo, useCallback } from 'react';
import {
  Modal,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

function FeaturedReel({
  course,
  reelWidth,
  reelHeight,
  onPress,
  currentTheme,
  reelsData = [],
  initialIndex = 0,
  // Pass this down so we can fetch more reels on vertical scroll:
  onRequestMoreReels = () => {},
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // If no reelsData is provided or empty, fallback to [course]
  const effectiveReels = reelsData.length > 0 ? reelsData : [course];

  const handlePress = () => {
    // Find the current course index
    const index = effectiveReels.findIndex((item) => item.id === course.id);
    setCurrentIndex(index !== -1 ? index : 0);
    setModalVisible(true);
    // Fire the callback if provided
    if (onPress) onPress(course);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Called whenever we snap to a new item in the vertical carousel
  const handleSnapToItem = useCallback(
    (index) => {
      setCurrentIndex(index);

      // If the user hits the last item, attempt to load more reels
      if (index >= effectiveReels.length - 1) {
        onRequestMoreReels();
      }
    },
    [effectiveReels.length, onRequestMoreReels]
  );

  const renderCarouselItem = ({ item, index }) => {
    const shouldPlay = index === currentIndex; // Only play the current item

    return (
      <View style={styles.fullReelContainer}>
        {item.shortVideoLink ? (
          <Video
            source={{ uri: item.shortVideoLink }}
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
          {course.shortVideoLink ? (
            <Video
              source={{ uri: course.shortVideoLink }}
              rate={1.0}
              volume={1.0}
              isMuted
              resizeMode="cover"
              shouldPlay={false} // Not playing in teaser
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

        {/* Title & optional play icon */}
        <View style={styles.titleContainer}>
          <Text style={styles.reelTitle} numberOfLines={1}>
            {course.title}
          </Text>
          {course.shortVideoLink && (
            <Ionicons name="play-circle" size={24} color="#fff" style={styles.playIcon} />
          )}
        </View>

        {/* Top-right image overlay */}
        <View style={styles.topRightImageContainer}>
          <Image
            source={{ uri: course.image }}
            style={styles.topRightImage}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>

      {/* Full-Screen Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Carousel
            data={effectiveReels}
            renderItem={renderCarouselItem}
            vertical
            width={viewportWidth}
            height={viewportHeight}
            defaultIndex={currentIndex}
            onSnapToItem={handleSnapToItem}
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
}

export default memo(FeaturedReel);

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












// import React, { useState, memo } from 'react';
// import {
//   Modal,
//   TouchableOpacity,
//   Image,
//   Text,
//   StyleSheet,
//   View,
//   Dimensions,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Video } from 'expo-av';
// import Carousel from 'react-native-reanimated-carousel';
// import { Ionicons } from '@expo/vector-icons';

// const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

// function FeaturedReel({
//   course,
//   reelWidth,
//   reelHeight,
//   onPress,
//   currentTheme,
//   reelsData = [],
//   initialIndex = 0,
// }) {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(initialIndex);

//   // If no reelsData is provided or empty, fallback to [course]
//   const effectiveReels = reelsData.length > 0 ? reelsData : [course];

//   const handlePress = () => {
//     // Locate the current course index to show in the modal
//     const index = effectiveReels.findIndex(item => item.id === course.id);
//     setCurrentIndex(index !== -1 ? index : 0);
//     setModalVisible(true);
//     // Fire the callback if provided
//     if (onPress) onPress(course);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//   };

//   const renderCarouselItem = ({ item, index }) => {
//     const shouldPlay = index === currentIndex; // only play the current item in the carousel

//     return (
//       <View style={styles.fullReelContainer}>
//         {item.shortVideoLink ? (
//           <Video
//             source={{ uri: item.shortVideoLink }}
//             rate={1.0}
//             volume={1.0}
//             isMuted={false}
//             resizeMode="contain"
//             shouldPlay={shouldPlay}
//             useNativeControls={false}
//             style={styles.fullScreenMedia}
//           />
//         ) : (
//           <Image
//             source={{ uri: item.image }}
//             style={styles.fullScreenMedia}
//             resizeMode="cover"
//           />
//         )}
//         <LinearGradient
//           colors={['transparent', 'rgba(0,0,0,0.7)']}
//           style={styles.fullOverlay}
//         />
//         <View style={styles.fullTitleContainer}>
//           <Text style={styles.fullTitle}>{item.title}</Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <>
//       {/* Teaser Card */}
//       <TouchableOpacity
//         activeOpacity={0.9}
//         style={[styles.reelCard, { width: reelWidth, height: reelHeight }]}
//         onPress={handlePress}
//       >
//         <View style={styles.mediaContainer}>
//           {course.shortVideoLink ? (
//             <Video
//               source={{ uri: course.shortVideoLink }}
//               rate={1.0}
//               volume={1.0}
//               isMuted
//               resizeMode="cover"
//               shouldPlay={false} // not playing in teaser
//               style={styles.reelMedia}
//             />
//           ) : (
//             <Image
//               source={{ uri: course.image }}
//               style={styles.reelMedia}
//               resizeMode="cover"
//             />
//           )}
//           <LinearGradient
//             colors={['transparent', 'rgba(0,0,0,0.7)']}
//             style={styles.reelOverlay}
//           />
//         </View>

//         {/* Title & optional play icon */}
//         <View style={styles.titleContainer}>
//           <Text style={styles.reelTitle} numberOfLines={1}>
//             {course.title}
//           </Text>
//           {course.shortVideoLink && (
//             <Ionicons name="play-circle" size={24} color="#fff" style={styles.playIcon} />
//           )}
//         </View>

//         {/* Top-right image overlay */}
//         <View style={styles.topRightImageContainer}>
//           <Image
//             source={{ uri: course.image }}
//             style={styles.topRightImage}
//             resizeMode="cover"
//           />
//         </View>
//       </TouchableOpacity>

//       {/* Full-Screen Modal */}
//       <Modal visible={modalVisible} animationType="slide" transparent={false}>
//         <View style={styles.modalContainer}>
//           <Carousel
//             data={effectiveReels}
//             renderItem={renderCarouselItem}
//             vertical
//             width={viewportWidth}
//             height={viewportHeight}
//             onSnapToItem={idx => setCurrentIndex(idx)}
//             autoPlay={false}
//             loop={false}
//             mode="default"
//             defaultIndex={currentIndex}
//           />
//           <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
//             <Ionicons name="close-circle" size={36} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </>
//   );
// }

// // Wrap in React.memo to help reduce re-renders if props are unchanged
// export default memo(FeaturedReel);

// const styles = StyleSheet.create({
//   reelCard: {
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginRight: 15,
//     elevation: 5,
//     backgroundColor: '#000',
//   },
//   mediaContainer: {
//     flex: 1,
//   },
//   reelMedia: {
//     width: '100%',
//     height: '100%',
//   },
//   reelOverlay: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 60,
//     justifyContent: 'flex-end',
//   },
//   titleContainer: {
//     position: 'absolute',
//     bottom: 10,
//     left: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   reelTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textShadowColor: 'rgba(0, 0, 0, 0.8)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 4,
//   },
//   playIcon: {
//     marginLeft: 8,
//   },
//   topRightImageContainer: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   topRightImage: {
//     width: '100%',
//     height: '100%',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   fullReelContainer: {
//     width: viewportWidth,
//     height: viewportHeight,
//     backgroundColor: '#000',
//   },
//   fullScreenMedia: {
//     width: '100%',
//     height: '100%',
//   },
//   fullOverlay: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 80,
//     justifyContent: 'flex-end',
//   },
//   fullTitleContainer: {
//     position: 'absolute',
//     bottom: 40,
//     left: 20,
//     right: 20,
//   },
//   fullTitle: {
//     color: '#fff',
//     fontSize: 24,
//     fontWeight: 'bold',
//     textShadowColor: 'rgba(0, 0, 0, 0.9)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 6,
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 40,
//     right: 20,
//     zIndex: 1,
//   },
// });
