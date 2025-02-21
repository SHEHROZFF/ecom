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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';

import { fetchFeaturedReels } from '../services/api';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');
const REELS_LIMIT = 5; // how many reels to load per page

function FeaturedReel({ currentTheme }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
        const newReels = response.data.map((r) => ({
          ...r,
          id: r._id,
        }));
        setReels((prev) => {
          if (reset) return newReels;
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = newReels.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filtered];
        });
        setHasMore(newReels.length >= REELS_LIMIT);
        setPage(reset ? 2 : nextPage + 1);
      }
    } catch (err) {
      console.warn('Error fetching reels', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page]);

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
      const safeIndex = Math.max(0, Math.min(index, reels.length - 1));
      setCurrentIndex(safeIndex);
      setModalVisible(true);
    },
    [reels]
  );

  const renderHorizontalItem = ({ item, index }) => {
    const ratingText = item.rating > 0 ? `${item.rating.toFixed(1)}` : 'N/A';
    const difficulty = item.difficultyLevel || 'Beginner';

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
              shouldPlay={false}
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
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.reelOverlay}
          />
        </View>
        <View style={styles.topRightImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.topRightImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.horizontalInfoOverlay}>
          <View style={styles.titleRow}>
            <Text style={styles.reelTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.shortVideoLink && (
              <Ionicons name="play-circle" size={22} color="#fff" style={{ marginLeft: 5 }} />
            )}
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              <MaterialIcons name="signal-cellular-alt" size={14} color="#f9c74f" />
              {` ${difficulty}`}
            </Text>
            <Text style={styles.statsText}>
              <Ionicons name="star" size={14} color="#f9c74f" />
              {` ${ratingText}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // MODAL & VERTICAL CAROUSEL
  // ---------------------------------------------------------------------------
  // const handleSnapToItem = useCallback(
  //   (index) => {
  //     setCurrentIndex(index);
  //     if (index >= reels.length - 1 && hasMore && !loading) {
  //       loadReels();
  //     }
  //   },
  //   [reels.length, hasMore, loading, loadReels]
  // );
// Add a preload threshold constant
const PRELOAD_THRESHOLD = 4;

const handleSnapToItem = useCallback(
  (index) => {
    setCurrentIndex(index);
    // Trigger loading when within PRELOAD_THRESHOLD of the end
    if (index >= reels.length - PRELOAD_THRESHOLD && hasMore && !loading) {
      loadReels();
    }
  },
  [reels.length, hasMore, loading, loadReels]
);

  const renderVerticalItem = useCallback(
    ({ item, index }) => {
      const isCurrent = index === currentIndex;
      const ratingText = item.rating > 0 ? `${item.rating.toFixed(1)}` : 'N/A';
      const difficulty = item.difficultyLevel || 'Beginner';

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
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.fullOverlay}
          />
          {/* Minimalist Detail Overlay */}
          <View style={styles.detailOverlay}>
            <ScrollView
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.detailTitle}>{item.title}</Text>
              <View style={styles.detailRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.detailRatingText}>{ratingText}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.detailInfo}>Difficulty: {difficulty}</Text>
                  <Text style={styles.detailInfo}>Language: {item.language || 'English'}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailInfo}>Lectures: {item.numberOfLectures || 0}</Text>
                <Text style={styles.detailInfo}>Duration: {Math.floor((item.totalDuration || 0) / 60)} mins</Text>
              </View>
              {item.price > 0 && (
                <Text style={styles.detailPrice}>Price: ${item.price.toFixed(2)}</Text>
              )}
              {item.category && (
                <Text style={styles.detailInfo}>Category: {item.category}</Text>
              )}
              {Array.isArray(item.whatYouWillLearn) && item.whatYouWillLearn.length > 0 && (
                <View style={styles.learnContainer}>
                  <Text style={styles.learnTitle}>What you'll learn:</Text>
                  {item.whatYouWillLearn.map((point, idx) => (
                    <View style={styles.bulletRow} key={idx}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.bulletIcon} />
                      <Text style={styles.bulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
              {item.instructor && (
                <Text style={[styles.detailInfo, { marginTop: 10 }]}>
                  Instructor: {item.instructor}
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.enrollButton}>
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [currentIndex]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  if (reels.length === 0 && loading) {
    return (
      <View style={{ paddingVertical: 20 }}>
        <Text style={{ color: currentTheme?.cardTextColor || '#000' }}>
          Loading featured reels...
        </Text>
      </View>
    );
  }

  if (reels.length === 0 && !loading) {
    return null;
  }

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
          {loading && hasMore && (
            <View style={styles.loadingMoreOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading more reels...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

export default memo(FeaturedReel);

const styles = StyleSheet.create({
  // Horizontal Reel Card
  reelCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    width: 145,
    height: 220,
    backgroundColor: '#000',
    elevation: 6,
    position: 'relative',
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
    borderRadius: 15,
  },
  topRightImageContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 5,
  },
  topRightImage: {
    width: '100%',
    height: '100%',
  },
  horizontalInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reelTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    maxWidth: 100,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 8,
  },

  // Modal / Vertical Carousel
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 99,
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
    height: viewportHeight * 0.3,
    justifyContent: 'flex-end',
  },
  // Minimalist Detail Overlay (no card bg)
  detailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  detailContent: {
    paddingBottom: 30, // ensures content isn't hidden
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRatingText: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailInfo: {
    color: '#ddd',
    fontSize: 14,
    marginRight: 12,
  },
  detailPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  learnContainer: {
    marginTop: 10,
  },
  learnTitle: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 15,
    color: '#fff',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletIcon: {
    marginRight: 6,
  },
  bulletText: {
    color: '#ddd',
    fontSize: 14,
    flexShrink: 1,
  },
  // Enroll Button Footer
  enrollButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Enhanced Loading More Overlay
  loadingMoreOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
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
//   ScrollView,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { Video } from 'expo-av';
// import Carousel from 'react-native-reanimated-carousel';

// import { fetchFeaturedReels } from '../services/api';

// const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');
// const REELS_LIMIT = 5; // how many reels to load per page

// function FeaturedReel({ currentTheme }) {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

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
//         console.log("response",response);
        
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

//         // If we got less than REELS_LIMIT, no more pages
//         setHasMore(newReels.length >= REELS_LIMIT);

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
//       const safeIndex = Math.max(0, Math.min(index, reels.length - 1));
//       setCurrentIndex(safeIndex);
//       setModalVisible(true);
//     },
//     [reels]
//   );

//   // Renders each item in the horizontal list
//   const renderHorizontalItem = ({ item, index }) => {
//     // If rating is zero, we'll show "N/A" or "No rating"
//     const ratingText = item.rating > 0 ? `${item.rating.toFixed(1)}` : 'N/A';
//     const difficulty = item.difficultyLevel || 'Beginner';

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
//               shouldPlay={false}
//               style={styles.reelMedia}
//             />
//           ) : (
//             <Image
//               source={{ uri: item.image }}
//               style={styles.reelMedia}
//               resizeMode="cover"
//             />
//           )}

//           {/* Bottom gradient overlay */}
//           <LinearGradient
//             colors={['transparent', 'rgba(0,0,0,0.6)']}
//             style={styles.reelOverlay}
//           />
//         </View>
//         {/* Top-right image overlay */}
//         <View style={styles.topRightImageContainer}>
//           <Image
//             source={{ uri: item.image }}
//             style={styles.topRightImage}
//             resizeMode="cover"
//           />
//         </View>
//         {/* Title & difficulty/rating overlay */}
//         <View style={styles.horizontalInfoOverlay}>
//           <View style={styles.titleRow}>
//             <Text style={styles.reelTitle} numberOfLines={1}>
//               {item.title}
//             </Text>
//             {item.shortVideoLink && (
//               <Ionicons name="play-circle" size={22} color="#fff" style={{ marginLeft: 5 }} />
//             )}
//           </View>
//           <View style={styles.statsRow}>
//             <Text style={styles.statsText}>
//               <MaterialIcons name="signal-cellular-alt" size={14} color="#f9c74f" />
//               {` ${difficulty}`}
//             </Text>
//             <Text style={styles.statsText}>
//               <Ionicons name="star" size={14} color="#f9c74f" />
//               {` ${ratingText}`}
//             </Text>
//           </View>
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
//       // If user is at the last item, try to load more
//       if (index >= reels.length - 1 && hasMore && !loading) {
//         loadReels();
//       }
//     },
//     [reels.length, hasMore, loading, loadReels]
//   );

//   // Renders each reel inside the vertical carousel
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

//           {/* Big bottom gradient overlay */}
//           <LinearGradient
//             colors={['transparent', 'rgba(0,0,0,0.8)']}
//             style={styles.fullOverlay}
//           />

//           {/* ScrollView to show all details if you have many lines */}
//           <ScrollView
//             style={styles.fullInfoScroll}
//             contentContainerStyle={{ paddingBottom: 80 }}
//           >
//             <Text style={styles.fullTitle}>{item.title}</Text>
//             <Text style={styles.infoLine}>
//               Difficulty: {item.difficultyLevel || 'N/A'}
//               {'  |  '}Language: {item.language || 'English'}
//             </Text>
//             <Text style={styles.infoLine}>
//               Lectures: {item.numberOfLectures || 0}  |  Duration: {Math.floor((item.totalDuration||0)/60)} mins
//             </Text>
//             {item.category ? (
//               <Text style={styles.infoLine}>Category: {item.category}</Text>
//             ) : null}
//             <Text style={styles.infoLine}>
//               {item.rating > 0
//                 ? `Rating: ${item.rating.toFixed(1)} (${item.reviews} reviews)`
//                 : 'No ratings yet'}
//             </Text>
//             {item.price > 0 && (
//               <Text style={styles.infoLine}>
//                 Price: ${item.price.toFixed(2)}
//               </Text>
//             )}

//             {/* “What You Will Learn” bullet points */}
//             {Array.isArray(item.whatYouWillLearn) && item.whatYouWillLearn.length > 0 && (
//               <View style={{ marginTop: 10 }}>
//                 <Text style={[styles.infoLine, { fontWeight: '600', marginBottom: 4 }]}>
//                   What you'll learn:
//                 </Text>
//                 {item.whatYouWillLearn.map((point, idx) => (
//                   <View style={styles.bulletRow} key={idx}>
//                     <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
//                     <Text style={styles.bulletText}>{point}</Text>
//                   </View>
//                 ))}
//               </View>
//             )}

//             {/* Enroll Now button (demo) */}
//             <TouchableOpacity style={styles.enrollButton}>
//               <Text style={styles.enrollButtonText}>Enroll Now</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </View>
//       );
//     },
//     [currentIndex]
//   );

//   // ---------------------------------------------------------------------------
//   // RENDER
//   // ---------------------------------------------------------------------------

//   // (1) If no reels & still loading => small message
//   if (reels.length === 0 && loading) {
//     return (
//       <View style={{ paddingVertical: 20 }}>
//         <Text style={{ color: currentTheme?.cardTextColor || '#000' }}>
//           Loading featured reels...
//         </Text>
//       </View>
//     );
//   }

//   // (2) If no reels at all => hide component
//   if (reels.length === 0 && !loading) {
//     return null;
//   }

//   // (3) Otherwise, show horizontal row + modal
//   return (
//     <View style={{ flex: 1 }}>
//       {/* Horizontal FlatList, limit to 6 reels if you prefer not to overflow */}
//       <FlatList
//         data={reels.slice(0, 6)}
//         horizontal
//         keyExtractor={(item) => item._id}
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

//           {/* If loading more reels, show a small overlay spinner */}
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
//     width: 145,
//     height: 220,
//     backgroundColor: '#000',
//     elevation: 6,
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
//     borderRadius: 15,
//   },
//   horizontalInfoOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//   },
//   titleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 2,
//   },
//   reelTitle: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '700',
//     textShadowColor: 'rgba(0, 0, 0, 0.8)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 3,
//     maxWidth: 100,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   statsText: {
//     color: '#fff',
//     fontSize: 12,
//     marginRight: 8,
//   },
//   // Modal / Vertical
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
//     height: 220,
//     justifyContent: 'flex-end',
//   },
//   fullInfoScroll: {
//     position: 'absolute',
//     left: 20,
//     right: 20,
//     bottom: 30,
//     maxHeight: viewportHeight * 0.45,
//   },
//   fullTitle: {
//     color: '#fff',
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 6,
//     textShadowColor: 'rgba(0, 0, 0, 0.9)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 6,
//   },
//   infoLine: {
//     color: '#fff',
//     fontSize: 15,
//     marginBottom: 4,
//   },
//   bulletRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 3,
//   },
//   bulletText: {
//     color: '#fff',
//     fontSize: 14,
//     flexShrink: 1,
//   },
//   enrollButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     marginTop: 14,
//     alignSelf: 'flex-start',
//   },
//   enrollButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 15,
//   },
//   // Loading more reels
//   loadingMoreOverlay: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     alignItems: 'center',
//   },
// });










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
  // topRightImageContainer: {
  //   position: 'absolute',
  //   top: 8,
  //   right: 8,
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   overflow: 'hidden',
  //   borderWidth: 2,
  //   borderColor: '#fff',
  // },
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

      //   {/* Top-right image overlay */}
      //   <View style={styles.topRightImageContainer}>
      //     <Image
      //       source={{ uri: course.image }}
      //       style={styles.topRightImage}
      //       resizeMode="cover"
      //     />
      //   </View>
      // </TouchableOpacity>

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
