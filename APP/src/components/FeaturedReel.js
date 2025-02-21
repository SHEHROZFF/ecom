// src/components/FeaturedReel.js
import React, { useCallback, useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';

import { fetchFeaturedReels } from '../services/api';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');
const REELS_LIMIT = 5; // how many reels to load per page

function FeaturedReel({ currentTheme }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);    // are we currently loading?
  const [page, setPage] = useState(1);               // which page we’re on
  const [hasMore, setHasMore] = useState(true);      // if we have more reels to load

  // For the modal full-screen display
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // FETCH REELS
  // ---------------------------------------------------------------------------
  const loadReels = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const nextPage = reset ? 1 : page;

      const response = await fetchFeaturedReels(nextPage, REELS_LIMIT);

      if (response.success) {
        console.log('fetched reels',response.data);
        
        const newReels = response.data.map((r) => ({
          ...r,
          id: r._id,
        }));

        setReels((prev) => {
          if (reset) return newReels;

          // filter out duplicates
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = newReels.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filtered];
        });

        // If we got less than REELS_LIMIT, we can't load more
        if (newReels.length < REELS_LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // If reset, page = 2, else page++.
        setPage(reset ? 2 : nextPage + 1);
      }
    } catch (err) {
      console.warn('Error fetching reels', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // On mount, load reels from scratch
  useEffect(() => {
    loadReels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // HORIZONTAL TEASER (FlatList)
  // ---------------------------------------------------------------------------
  const handlePressReel = useCallback(
    (index) => {
      if (reels.length === 0) return;
      // Clamp the index
      const safeIndex = Math.max(0, Math.min(index, reels.length - 1));
      setCurrentIndex(safeIndex);
      setModalVisible(true);
    },
    [reels]
  );

  // We pass this to FlatList’s renderItem
  const renderHorizontalItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.reelCard}
        onPress={() => handlePressReel(index)}
      >
        <View style={styles.mediaContainer}>
          {item.shortVideoLink ? (
            <Video
              source={{ uri: item.shortVideoLink }}
              rate={1.0}
              volume={1.0}
              isMuted
              resizeMode="cover"
              shouldPlay={false} // Not playing in teaser
              style={styles.reelMedia}
            />
          ) : (
            <Image
              source={{ uri: item.image }}
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
            {item.title}
          </Text>
          {item.shortVideoLink && (
            <Ionicons name="play-circle" size={24} color="#fff" style={styles.playIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // MODAL & VERTICAL CAROUSEL
  // ---------------------------------------------------------------------------
  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSnapToItem = useCallback(
    (index) => {
      setCurrentIndex(index);
      // If user is on the last item and we have more reels => load next page
      if (index >= reels.length - 1 && hasMore && !loading) {
        loadReels();
      }
    },
    [reels.length, hasMore, loading, loadReels]
  );

  const renderVerticalItem = useCallback(
    ({ item, index }) => {
      const isCurrent = index === currentIndex;
      return (
        <View style={styles.fullReelContainer}>
          {item.shortVideoLink ? (
            <Video
              source={{ uri: item.shortVideoLink }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay={isCurrent}
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
    },
    [currentIndex]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // (1) If no reels yet & we are loading => show a small message
  if (reels.length === 0 && loading) {
    return (
      <View style={{ paddingVertical: 20 }}>
        <Text style={{ color: currentTheme?.cardTextColor || '#000' }}>
          Loading featured reels...
        </Text>
      </View>
    );
  }

  // (2) If no reels at all => hide the component
  if (reels.length === 0 && !loading) {
    return null;
  }

  // (3) Otherwise, show the horizontal reel row + modal
  return (
    <View style={{ flex: 1 }}>
      {/* Horizontal FlatList limited to 6 reels */}
      <FlatList
        data={reels.slice(0, 6)}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderHorizontalItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 15 }}
      />

      {/* Full-screen vertical modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          {reels.length > 0 && (
            <Carousel
              data={reels}
              renderItem={renderVerticalItem}
              vertical
              width={viewportWidth}
              height={viewportHeight}
              defaultIndex={Math.min(currentIndex, reels.length - 1)}
              onSnapToItem={handleSnapToItem}
              autoPlay={false}
              loop={false}
              mode="default"
            />
          )}

          {/* Loading spinner if we’re currently fetching the next page */}
          {loading && hasMore && (
            <View style={styles.loadingMoreOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#fff', marginTop: 4 }}>Loading more reels...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

export default memo(FeaturedReel);

const styles = StyleSheet.create({
  reelCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    width: 140,
    height: 220,
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
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    maxWidth: 100,
  },
  playIcon: {
    marginLeft: 5,
  },

  // Modal + Vertical
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 9,
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

  // "Loading more reels" overlay in the bottom-right
  loadingMoreOverlay: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
});










// // src/components/FeaturedReel.js
// import React, { useCallback, useState, useEffect, memo } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Image,
//   Modal,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   FlatList,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av';
// import Carousel from 'react-native-reanimated-carousel';

// import { fetchFeaturedReels } from '../services/api';

// const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');
// const REELS_LIMIT = 5; // how many reels to load per page

// function FeaturedReel({ currentTheme }) {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(false);    // are we currently loading?
//   const [page, setPage] = useState(1);             // which page we’re on
//   const [hasMore, setHasMore] = useState(true);    // if we have more reels to load

//   // For the modal full-screen display
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // ---------------------------------------------------------------------------
//   // FETCH REELS
//   // ---------------------------------------------------------------------------
//   const loadReels = useCallback(async (reset = false) => {
//     try {
//       setLoading(true);
//       const nextPage = reset ? 1 : page;

//       const response = await fetchFeaturedReels(nextPage, REELS_LIMIT);

//       if (response.success) {
//         const newReels = response.data.map((r) => ({
//           ...r,
//           id: r._id,
//         }));

//         setReels((prev) => {
//           if (reset) return newReels;

//           // filter out duplicates
//           const existingIds = new Set(prev.map((item) => item.id));
//           const filtered = newReels.filter((item) => !existingIds.has(item.id));
//           return [...prev, ...filtered];
//         });

//         // If we got less than REELS_LIMIT, we can't load more
//         if (newReels.length < REELS_LIMIT) {
//           setHasMore(false);
//         } else {
//           setHasMore(true);
//         }

//         // If reset, page = 2, else page++
//         setPage(reset ? 2 : nextPage + 1);
//       }
//     } catch (err) {
//       console.warn('Error fetching reels', err);
//       setHasMore(false);
//     } finally {
//       setLoading(false);
//     }
//   }, [page]);

//   // On mount, load reels from scratch
//   useEffect(() => {
//     loadReels(true);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------------------------------------------------------------------------
//   // HORIZONTAL TEASER (FlatList)
//   // ---------------------------------------------------------------------------
//   const handlePressReel = useCallback(
//     (index) => {
//       if (reels.length === 0) return;
//       // clamp the index
//       const safeIndex = Math.max(0, Math.min(index, reels.length - 1));
//       setCurrentIndex(safeIndex);
//       setModalVisible(true);
//     },
//     [reels]
//   );

//   // We pass this to FlatList’s `renderItem`
//   const renderHorizontalItem = ({ item, index }) => {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.9}
//         style={styles.reelCard}
//         onPress={() => handlePressReel(index)}
//       >
//         <View style={styles.mediaContainer}>
//           {item.shortVideoLink ? (
//             <Video
//               source={{ uri: item.shortVideoLink }}
//               rate={1.0}
//               volume={1.0}
//               isMuted
//               resizeMode="cover"
//               shouldPlay={false} // Not playing in teaser
//               style={styles.reelMedia}
//             />
//           ) : (
//             <Image
//               source={{ uri: item.image }}
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
//             {item.title}
//           </Text>
//           {item.shortVideoLink && (
//             <Ionicons name="play-circle" size={24} color="#fff" style={styles.playIcon} />
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   // ---------------------------------------------------------------------------
//   // MODAL & VERTICAL CAROUSEL
//   // ---------------------------------------------------------------------------
//   const closeModal = useCallback(() => {
//     setModalVisible(false);
//   }, []);

//   const handleSnapToItem = useCallback(
//     (index) => {
//       setCurrentIndex(index);
//       // If user is on the last item and we have more reels => load next page
//       if (index >= reels.length - 1 && hasMore && !loading) {
//         loadReels();
//       }
//     },
//     [reels.length, hasMore, loading, loadReels]
//   );

//   const renderVerticalItem = useCallback(
//     ({ item, index }) => {
//       const isCurrent = index === currentIndex;
//       return (
//         <View style={styles.fullReelContainer}>
//           {item.shortVideoLink ? (
//             <Video
//               source={{ uri: item.shortVideoLink }}
//               rate={1.0}
//               volume={1.0}
//               isMuted={false}
//               resizeMode="contain"
//               shouldPlay={isCurrent}
//               style={styles.fullScreenMedia}
//             />
//           ) : (
//             <Image
//               source={{ uri: item.image }}
//               style={styles.fullScreenMedia}
//               resizeMode="cover"
//             />
//           )}

//           <LinearGradient
//             colors={['transparent', 'rgba(0,0,0,0.7)']}
//             style={styles.fullOverlay}
//           />

//           <View style={styles.fullTitleContainer}>
//             <Text style={styles.fullTitle}>{item.title}</Text>
//           </View>
//         </View>
//       );
//     },
//     [currentIndex]
//   );

//   // ---------------------------------------------------------------------------
//   // RENDER
//   // ---------------------------------------------------------------------------

//   // (1) If no reels yet & we are loading => show a small message
//   if (reels.length === 0 && loading) {
//     return (
//       <View style={{ paddingVertical: 20 }}>
//         <Text style={{ color: currentTheme?.cardTextColor || '#000' }}>
//           Loading featured reels...
//         </Text>
//       </View>
//     );
//   }

//   // (2) If no reels at all => hide the component
//   if (reels.length === 0 && !loading) {
//     return null;
//   }

//   // (3) Otherwise, show the horizontal reel row + modal
//   return (
//     <View style={{ flex: 1 }}>
//       {/* Horizontal FlatList so user can swipe */}
//       <FlatList
//         data={reels}
//         horizontal
//         keyExtractor={(item) => item.id}
//         renderItem={renderHorizontalItem}
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{ paddingRight: 15 }}
//       />

//       {/* Full-screen vertical modal */}
//       <Modal visible={modalVisible} animationType="slide" transparent={false}>
//         <View style={styles.modalContainer}>
//           {reels.length > 0 && (
//             <Carousel
//               data={reels}
//               renderItem={renderVerticalItem}
//               vertical
//               width={viewportWidth}
//               height={viewportHeight}
//               defaultIndex={Math.min(currentIndex, reels.length - 1)}
//               onSnapToItem={handleSnapToItem}
//               autoPlay={false}
//               loop={false}
//               mode="default"
//             />
//           )}

//           {/* Loading spinner if we’re currently fetching the next page */}
//           {loading && hasMore && (
//             <View style={styles.loadingMoreOverlay}>
//               <ActivityIndicator size="large" color="#fff" />
//               <Text style={{ color: '#fff', marginTop: 4 }}>Loading more reels...</Text>
//             </View>
//           )}

//           <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
//             <Ionicons name="close-circle" size={36} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// export default memo(FeaturedReel);

// const styles = StyleSheet.create({
//   reelCard: {
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginRight: 15,
//     width: 140,
//     height: 220,
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
//     fontSize: 15,
//     fontWeight: 'bold',
//     textShadowColor: 'rgba(0, 0, 0, 0.8)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 4,
//     maxWidth: 100,
//   },
//   playIcon: {
//     marginLeft: 5,
//   },

//   // Modal + Vertical
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 40,
//     right: 20,
//     zIndex: 9,
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

//   // "Loading more reels" overlay in the bottom-right
//   loadingMoreOverlay: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     alignItems: 'center',
//   },
// });













// import React, { useState, memo, useCallback } from 'react';
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
//   // Pass this down so we can fetch more reels on vertical scroll:
//   onRequestMoreReels = () => {},
// }) {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(initialIndex);

//   // If no reelsData is provided or empty, fallback to [course]
//   const effectiveReels = reelsData.length > 0 ? reelsData : [course];

//   const handlePress = () => {
//     // Find the current course index
//     const index = effectiveReels.findIndex((item) => item.id === course.id);
//     setCurrentIndex(index !== -1 ? index : 0);
//     setModalVisible(true);
//     // Fire the callback if provided
//     if (onPress) onPress(course);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//   };

//   // Called whenever we snap to a new item in the vertical carousel
//   const handleSnapToItem = useCallback(
//     (index) => {
//       setCurrentIndex(index);

//       // If the user hits the last item, attempt to load more reels
//       if (index >= effectiveReels.length - 1) {
//         onRequestMoreReels();
//       }
//     },
//     [effectiveReels.length, onRequestMoreReels]
//   );

//   const renderCarouselItem = ({ item, index }) => {
//     const shouldPlay = index === currentIndex; // Only play the current item

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
//               shouldPlay={false} // Not playing in teaser
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
//             defaultIndex={currentIndex}
//             onSnapToItem={handleSnapToItem}
//             autoPlay={false}
//             loop={false}
//             mode="default"
//           />
//           <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
//             <Ionicons name="close-circle" size={36} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </>
//   );
// }

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
