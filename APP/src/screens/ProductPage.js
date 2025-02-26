// src/screens/ProductPage.js

import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ReviewPopup from '../components/ReviewPopup';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import { CartContext } from '../contexts/CartContext';
import { FavouritesContext } from '../contexts/FavouritesContext';
import CustomAlert from '../components/CustomAlert';
import { getProductById } from '../services/api';

const { width, height } = Dimensions.get('window');

const ProductPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Review popup
  const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);

  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIcon, setAlertIcon] = useState('');
  const [alertButtons, setAlertButtons] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductById(productId);
        if (response.success) {
          setProduct(response.data);
          setFetchError('');
        } else {
          setFetchError(response.message || 'Something went wrong.');
        }
      } catch (err) {
        setFetchError(err.message || 'Failed to fetch product.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Return a spinner if still loading
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
      </View>
    );
  }

  // Handle error state (simple fallback)
  if (fetchError || !product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: currentTheme.errorTextColor, fontSize: 18, marginBottom: 20 }}>
          {fetchError || 'Product not found.'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setFetchError('');
            // Re-fetch product details on retry
            getProductById(productId).then(response => {
              if (response.success) {
                setProduct(response.data);
                setFetchError('');
              } else {
                setFetchError(response.message || 'Something went wrong.');
              }
              setLoading(false);
            });
          }}
          style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isFavourite = favouriteItems.some((favItem) => favItem._id === product._id);

  const openReviewPopup = () => {
    setReviewPopupVisible(true);
  };

  const closeReviewPopup = () => {
    setReviewPopupVisible(false);
  };

  const toggleFavorite = () => {
    if (isFavourite) {
      removeFromFavourites(product._id);
      setAlertTitle('Removed from Favourites');
      setAlertMessage(`${product.name} has been removed from your favourites.`);
      setAlertIcon('heart-dislike-outline');
    } else {
      addToFavourites(product);
      setAlertTitle('Added to Favourites');
      setAlertMessage(`${product.name} has been added to your favourites.`);
      setAlertIcon('heart');
    }
    setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  const handleAddToCart = (productItem) => {
    const added = addToCart(productItem);
    if (added) {
      setAlertTitle('Success');
      setAlertMessage(`${productItem.name} has been added to your cart.`);
      setAlertIcon('cart');
    } else {
      setAlertTitle('Info');
      setAlertMessage(`${productItem.name} is already in your cart.`);
      setAlertIcon('information-circle');
    }
    setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={currentTheme.headerBackground[1]}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />

      {/* Hero-Style Gradient Header */}
      <LinearGradient
        colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {product.name}
          </Text>
          {product.subjectName && (
            <Text
              style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.subjectName} {product.subjectCode && `(${product.subjectCode})`}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Main Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Media Container (Image) */}
        <View style={styles.mediaContainer}>
          <Image source={{ uri: product.image }} style={styles.media} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent']}
            style={styles.mediaGradient}
          />

          {/* Favorite Button Overlay */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavourite ? '#E91E63' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Details Card Overlapping the Media */}
        <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
          {/* Title */}
          <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>
            {product.name}
          </Text>
          {product.subjectName && (
            <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>
              {product.subjectName} {product.subjectCode && `(${product.subjectCode})`}
            </Text>
          )}

          {/* Star Rating & Reviews */}
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }, (_, index) => {
              const filled = index < Math.floor(product.ratings || 0);
              return (
                <Ionicons
                  key={index}
                  name={filled ? 'star' : 'star-outline'}
                  size={20}
                  color="#FFD700"
                  style={{ marginRight: 2 }}
                />
              );
            })}
            <TouchableOpacity onPress={openReviewPopup} style={{ marginLeft: 8 }}>
              <Text style={[styles.reviewCount, { color: currentTheme.cardTextColor }]}>
                ({product.numberOfReviews} reviews)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>
            ${product.price}
          </Text>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.primaryColor }]}>
              Description
            </Text>
            <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>
              {product.description || 'No description provided.'}
            </Text>
          </View>

          {/* Sub-Heading (Optional) */}
          <Text style={[styles.subHeading, { color: currentTheme.textColor }]}>
            Explore the details and share your thoughts!
          </Text>

          {/* Large Gradient 'Add to Cart' Button */}
          <TouchableOpacity
            style={styles.cartButtonContainer}
            onPress={() => handleAddToCart(product)}
            accessibilityLabel="Add to Cart"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cartButtonGradient}
            >
              <Text style={styles.cartButtonText}>Add to Cart</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Review Popup Modal */}
        <Modal
          visible={isReviewPopupVisible}
          animationType="slide"
          onRequestClose={closeReviewPopup}
          transparent={true}
        >
          <ReviewPopup
            closePopup={closeReviewPopup}
            reviewableId={product._id}
            reviewableType="Product"
          />
        </Modal>
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        icon={alertIcon}
        onClose={() => setAlertVisible(false)}
        buttons={alertButtons}
      />
    </SafeAreaView>
  );
};

export default ProductPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Hero Header */
  header: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 4,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    padding: 8,
    zIndex: 10,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    width: width * 0.6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    width: width * 0.6,
    textAlign: 'center',
  },
  /* Scroll Content */
  scrollContent: {
    paddingBottom: 20,
  },
  /* Media (Image) Container */
  mediaContainer: {
    height: 250,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
  },
  /* Details Card */
  detailsContainer: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginHorizontal: 5,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewCount: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.7,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  productDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  subHeading: {
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  /* Add to Cart Button */
  cartButtonContainer: {
    marginTop: 10,
    marginBottom: 60,
    alignSelf: 'center',
    width: '100%',
  },
  cartButtonGradient: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});











// // src/screens/ProductPage.js

// import React, { useContext, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Modal,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import ReviewPopup from '../components/ReviewPopup';
// import { LinearGradient } from 'expo-linear-gradient';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import { FavouritesContext } from '../contexts/FavouritesContext';
// import CustomAlert from '../components/CustomAlert';

// const { width, height } = Dimensions.get('window');

// const ProductPage = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { item } = route.params;

//   const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);

//   const { addToCart } = useContext(CartContext);
//   const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);
//   const isFavourite = favouriteItems.some((favItem) => favItem._id === item._id);

//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   const openReviewPopup = () => {
//     setReviewPopupVisible(true);
//   };

//   const closeReviewPopup = () => {
//     setReviewPopupVisible(false);
//   };

//   const toggleFavorite = () => {
//     if (isFavourite) {
//       removeFromFavourites(item._id);
//       setAlertTitle('Removed from Favourites');
//       setAlertMessage(`${item.name} has been removed from your favourites.`);
//       setAlertIcon('heart-dislike-outline');
//     } else {
//       addToFavourites(item);
//       setAlertTitle('Added to Favourites');
//       setAlertMessage(`${item.name} has been added to your favourites.`);
//       setAlertIcon('heart');
//     }
//     setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//     setAlertVisible(true);
//   };

//   const handleAddToCart = (productItem) => {
//     const added = addToCart(productItem);
//     if (added) {
//       setAlertTitle('Success');
//       setAlertMessage(`${productItem.name} has been added to your cart.`);
//       setAlertIcon('cart');
//     } else {
//       setAlertTitle('Info');
//       setAlertMessage(`${productItem.name} is already in your cart.`);
//       setAlertIcon('information-circle');
//     }
//     setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//     setAlertVisible(true);
//   };

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       {/* Hero-Style Gradient Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground || ['#667EEA', '#64B6FF']}
//         style={styles.header}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//           accessibilityRole="button"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>

//         <View style={styles.headerTitleContainer}>
//           <Text
//             style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}
//             numberOfLines={1}
//             ellipsizeMode="tail"
//           >
//             {item.name}
//           </Text>
//           {item.subjectName && (
//             <Text
//               style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}
//               numberOfLines={1}
//               ellipsizeMode="tail"
//             >
//               {item.subjectName} {item.subjectCode && `(${item.subjectCode})`}
//             </Text>
//           )}
//         </View>
//       </LinearGradient>

//       {/* Main Scrollable Content */}
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
//         {/* Media Container (Image) */}
//         <View style={styles.mediaContainer}>
//           <Image source={{ uri: item.image }} style={styles.media} resizeMode="cover" />
//           <LinearGradient
//             colors={['rgba(0,0,0,0.25)', 'transparent']}
//             style={styles.mediaGradient}
//           />

//           {/* Favorite Button Overlay */}
//           <TouchableOpacity
//             style={styles.favoriteButton}
//             onPress={toggleFavorite}
//             accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
//             accessibilityRole="button"
//           >
//             <Ionicons
//               name={isFavourite ? 'heart' : 'heart-outline'}
//               size={28}
//               color={isFavourite ? '#E91E63' : '#fff'}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Details Card Overlapping the Media */}
//         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
//           {/* Title */}
//           <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>
//             {item.name}
//           </Text>
//           {item.subjectName && (
//             <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>
//               {item.subjectName} {item.subjectCode && `(${item.subjectCode})`}
//             </Text>
//           )}

//           {/* Star Rating & Reviews */}
//           <View style={styles.ratingContainer}>
//             {Array.from({ length: 5 }, (_, index) => {
//               const filled = index < Math.floor(item.ratings || 0);
//               return (
//                 <Ionicons
//                   key={index}
//                   name={filled ? 'star' : 'star-outline'}
//                   size={20}
//                   color="#FFD700"
//                   style={{ marginRight: 2 }}
//                 />
//               );
//             })}
//             <TouchableOpacity onPress={openReviewPopup} style={{ marginLeft: 8 }}>
//               <Text style={[styles.reviewCount, { color: currentTheme.cardTextColor }]}>
//                 ({item.numberOfReviews} reviews)
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Price */}
//           <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>
//             ${item.price}
//           </Text>

//           {/* Description Section */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, { color: currentTheme.primaryColor }]}>
//               Description
//             </Text>
//             <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>
//               {item.description || 'No description provided.'}
//             </Text>
//           </View>

//           {/* Sub-Heading (Optional) */}
//           <Text style={[styles.subHeading, { color: currentTheme.textColor }]}>
//             Explore the details and share your thoughts!
//           </Text>

//           {/* Large Gradient 'Add to Cart' Button */}
//           <TouchableOpacity
//             style={styles.cartButtonContainer}
//             onPress={() => handleAddToCart(item)}
//             accessibilityLabel="Add to Cart"
//             accessibilityRole="button"
//           >
//             <LinearGradient
//               colors={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.cartButtonGradient}
//             >
//               <Text style={styles.cartButtonText}>Add to Cart</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>

//         {/* Review Popup Modal */}
//         <Modal
//           visible={isReviewPopupVisible}
//           animationType="slide"
//           onRequestClose={closeReviewPopup}
//           transparent={true}
//         >
//           <ReviewPopup
//             closePopup={closeReviewPopup}
//             reviewableId={item._id}
//             reviewableType="Product"
//           />
//         </Modal>
//       </ScrollView>

//       {/* Alert */}
//       <CustomAlert
//         visible={alertVisible}
//         title={alertTitle}
//         message={alertMessage}
//         icon={alertIcon}
//         onClose={() => setAlertVisible(false)}
//         buttons={alertButtons}
//       />
//     </SafeAreaView>
//   );
// };

// export default ProductPage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },

//   /* Hero Header */
//   header: {
//     width: '100%',
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 5,
//     marginBottom: 4,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     padding: 8,
//     zIndex: 10,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     width: width * 0.6,
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     fontWeight: '400',
//     marginTop: 4,
//     width: width * 0.6,
//     textAlign: 'center',
//   },

//   /* Scroll Content */
//   scrollContent: {
//     paddingBottom: 20,
//   },

//   /* Media (Image) Container */
//   mediaContainer: {
//     height: 250,
//     backgroundColor: '#000',
//     borderRadius: 16,
//     overflow: 'hidden',
//     marginTop: 10,
//     marginBottom: 20,
//     marginHorizontal: 10,
//   },
//   media: {
//     width: '100%',
//     height: '100%',
//   },
//   mediaGradient: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 70,
//   },
//   favoriteButton: {
//     position: 'absolute',
//     top: 15,
//     right: 15,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     padding: 8,
//     borderRadius: 20,
//   },

//   /* Details Card */
//   detailsContainer: {
//     marginTop: -30,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 5,
//     elevation: 4,
//     marginHorizontal: 5,
//   },
//   productTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   productSubtitle: {
//     fontSize: 16,
//     marginBottom: 12,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   reviewCount: {
//     fontSize: 15,
//     textDecorationLine: 'underline',
//   },
//   productPrice: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginBottom: 12,
//   },
//   section: {
//     marginBottom: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 0.7,
//     borderBottomColor: '#ccc',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 8,
//     textTransform: 'uppercase',
//     letterSpacing: 0.8,
//   },
//   productDescription: {
//     fontSize: 15,
//     lineHeight: 22,
//   },
//   subHeading: {
//     fontSize: 14,
//     marginTop: 12,
//     fontStyle: 'italic',
//     marginBottom: 20,
//   },

//   /* Add to Cart Button */
//   cartButtonContainer: {
//     marginTop: 10,
//     marginBottom: 60,
//     alignSelf: 'center',
//     width: '100%',
//   },
//   cartButtonGradient: {
//     paddingVertical: 14,
//     borderRadius: 30,
//     alignItems: 'center',
//   },
//   cartButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });













// // // src/screens/ProductPage.js

// // import React, { useContext, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   Image,
// //   StyleSheet,
// //   ScrollView,
// //   TouchableOpacity,
// //   Modal,
// //   Dimensions,
// //   StatusBar,
// //   SafeAreaView,
// // } from 'react-native';
// // import { useRoute, useNavigation } from '@react-navigation/native';
// // import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// // import ReviewPopup from '../components/ReviewPopup';
// // import { LinearGradient } from 'expo-linear-gradient';

// // import { ThemeContext } from '../../ThemeContext';
// // import { lightTheme, darkTheme } from '../../themes';
// // import { CartContext } from '../contexts/CartContext';
// // import { FavouritesContext } from '../contexts/FavouritesContext';
// // import CustomAlert from '../components/CustomAlert';

// // const { width, height } = Dimensions.get('window');

// // const ProductPage = () => {
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const { item } = route.params;

// //   const [isReviewPopupVisible, setReviewPopupVisible] = useState(false);
// //   const { addToCart } = useContext(CartContext);
// //   const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);
// //   const isFavourite = favouriteItems.some((favItem) => favItem._id === item._id);

// //   const { theme } = useContext(ThemeContext);
// //   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

// //   // Alert state
// //   const [alertVisible, setAlertVisible] = useState(false);
// //   const [alertTitle, setAlertTitle] = useState('');
// //   const [alertMessage, setAlertMessage] = useState('');
// //   const [alertIcon, setAlertIcon] = useState('');
// //   const [alertButtons, setAlertButtons] = useState([]);

// //   const openReviewPopup = () => {
// //     setReviewPopupVisible(true);
// //   };

// //   const closeReviewPopup = () => {
// //     setReviewPopupVisible(false);
// //   };

// //   const toggleFavorite = () => {
// //     if (isFavourite) {
// //       removeFromFavourites(item._id);
// //       setAlertTitle('Removed from Favourites');
// //       setAlertMessage(`${item.name} has been removed from your favourites.`);
// //       setAlertIcon('heart-dislike-outline');
// //     } else {
// //       addToFavourites(item);
// //       setAlertTitle('Added to Favourites');
// //       setAlertMessage(`${item.name} has been added to your favourites.`);
// //       setAlertIcon('heart');
// //     }
// //     setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
// //     setAlertVisible(true);
// //   };

// //   const handleAddToCart = (productItem) => {
// //     const added = addToCart(productItem);
// //     if (added) {
// //       setAlertTitle('Success');
// //       setAlertMessage(`${productItem.name} has been added to your cart.`);
// //       setAlertIcon('cart');
// //     } else {
// //       setAlertTitle('Info');
// //       setAlertMessage(`${productItem.name} is already in your cart.`);
// //       setAlertIcon('information-circle');
// //     }
// //     setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
// //     setAlertVisible(true);
// //   };

// //   return (
// //     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
// //       <StatusBar
// //         backgroundColor={currentTheme.headerBackground[1]}
// //         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
// //       />
// //       {/* Unified Header */}
// //       <LinearGradient
// //         colors={currentTheme.headerBackground}
// //         style={styles.header}
// //         start={[0, 0]}
// //         end={[0, 1]}
// //       >
// //         <TouchableOpacity
// //           style={styles.backButton}
// //           onPress={() => navigation.goBack()}
// //           accessibilityLabel="Go Back"
// //           accessibilityRole="button"
// //         >
// //           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
// //         </TouchableOpacity>
// //         <View style={styles.headerTitleContainer}>
// //           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]} numberOfLines={1} ellipsizeMode="tail">
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]} numberOfLines={1} ellipsizeMode="tail">
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>
// //         </View>
// //       </LinearGradient>

// //       <ScrollView 
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.scrollContent}
// //       >
// //         {/* Product Image */}
// //         <View style={styles.imageContainer}>
// //           <Image source={{ uri: item.image }} style={styles.productImage} />
// //           <TouchableOpacity
// //             style={styles.favoriteButton}
// //             onPress={toggleFavorite}
// //             accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
// //             accessibilityRole="button"
// //           >
// //             <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={28} color={isFavourite ? '#E91E63' : currentTheme.placeholderTextColor} />
// //           </TouchableOpacity>
// //         </View>

// //         {/* Details Container */}
// //         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
// //           {/* Add-to-Cart Icon in Top Right */}
// //           <TouchableOpacity
// //             style={[styles.addToCartIcon, { backgroundColor: currentTheme.primaryColor }]}
// //             onPress={() => handleAddToCart(item)}
// //             accessibilityLabel="Add to Cart"
// //             accessibilityRole="button"
// //           >
// //             <MaterialIcons name="add-shopping-cart" size={28} color="#FFFFFF" />
// //           </TouchableOpacity>

// //           <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>{item.name}</Text>
// //           <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>{item.subjectName} ({item.subjectCode})</Text>
// //           <Text style={[styles.subHeading, { color: currentTheme.textColor }]}>
// //             Explore the details below and share your thoughts!
// //           </Text>
// //           <View style={styles.ratingContainer}>
// //             {Array.from({ length: 5 }, (_, index) => (
// //               <Ionicons key={index} name={index < Math.floor(item.ratings) ? 'star' : 'star-outline'} size={20} color="#FFD700" />
// //             ))}
// //             <TouchableOpacity onPress={openReviewPopup}>
// //               <Text style={[styles.reviewCount, { color: currentTheme.cardTextColor }]}>
// //                 ({item.numberOfReviews} reviews)
// //               </Text>
// //             </TouchableOpacity>
// //           </View>
// //           <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>${item.price}</Text>
// //           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>Description</Text>
// //           <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>{item.description}</Text>
// //         </View>

// //         <Modal
// //           visible={isReviewPopupVisible}
// //           animationType="slide"
// //           onRequestClose={closeReviewPopup}
// //           transparent={true}
// //         >
// //           <ReviewPopup closePopup={closeReviewPopup} reviewableId={item._id} reviewableType="Product" />
// //         </Modal>
// //       </ScrollView>

// //       <CustomAlert
// //         visible={alertVisible}
// //         title={alertTitle}
// //         message={alertMessage}
// //         icon={alertIcon}
// //         onClose={() => setAlertVisible(false)}
// //         buttons={alertButtons}
// //       />
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   safeArea: { flex: 1 },
// //   header: {
// //     width: '100%',
// //     paddingVertical: 8,
// //     paddingHorizontal: 15,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     borderBottomLeftRadius: 30,
// //     borderBottomRightRadius: 30,
// //     elevation: 4,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 3 },
// //     shadowOpacity: 0.3,
// //     shadowRadius: 4,
// //   },
// //   backButton: { position: 'absolute', left: 15, padding: 8 },
// //   headerTitleContainer: { alignItems: 'center' },
// //   headerTitle: { fontSize: 22, fontWeight: '700', width: width * 0.7, textAlign: 'center' },
// //   headerSubtitle: { fontSize: 14, fontWeight: '400', marginTop: 4, width: width * 0.7, textAlign: 'center' },
// //   scrollContent: { paddingBottom: 20 },
// //   imageContainer: { position: 'relative' },
// //   productImage: { width: width, height: 300, resizeMode: 'cover' },
// //   favoriteButton: { position: 'absolute', top: 50, right: 10, backgroundColor: '#FFFFFFaa', borderRadius: 30, padding: 8 },
// //   detailsContainer: {
// //     padding: 20,
// //     paddingBottom: 40,
// //     minHeight: height - 300,
// //     marginTop: -30,
// //     borderTopLeftRadius: 30,
// //     borderTopRightRadius: 30,
// //     elevation: 5,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// //   productTitle: { fontSize: 24, fontWeight: '700', marginBottom: 5 },
// //   productSubtitle: { fontSize: 16, marginBottom: 10 },
// //   subHeading: { fontSize: 14, marginBottom: 15, fontStyle: 'italic' },
// //   ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
// //   reviewCount: { fontSize: 16, marginLeft: 10, textDecorationLine: 'underline' },
// //   productPrice: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
// //   sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
// //   productDescription: { fontSize: 16, lineHeight: 24, marginBottom: 30 },
// //   addToCartIcon: {
// //     position: 'absolute',
// //     top: 10,
// //     right: 25,
// //     padding: 8,
// //     borderRadius: 20,
// //     elevation: 3,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// // });

// // export default ProductPage;








// // // src/screens/ProductPage.js

// // import React, { useContext, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   Image,
// //   StyleSheet,
// //   ScrollView,
// //   TouchableOpacity,
// //   Modal,
// //   Dimensions,
// //   StatusBar,
// //   SafeAreaView,
// // } from 'react-native';
// // import { useRoute, useNavigation } from '@react-navigation/native';
// // import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// // import ReviewPopup from '../components/ReviewPopup';
// // import { LinearGradient } from 'expo-linear-gradient';

// // import { ThemeContext } from '../../ThemeContext';
// // import { lightTheme, darkTheme } from '../../themes';
// // import { CartContext } from '../contexts/CartContext';
// // import { FavouritesContext } from '../contexts/FavouritesContext';
// // import CustomAlert from '../components/CustomAlert';

// // const { width } = Dimensions.get('window');

// // const ProductPage = () => {
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const { item } = route.params;

// //   const [isReviewPopupVisible, setReviewPopupVisible] = React.useState(false);
// //   const { cartItems, addToCart } = useContext(CartContext);

// //   // FavouritesContext
// //   const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);
// //   const isFavourite = favouriteItems.some((favItem) => favItem._id === item._id);

// //   // Theme
// //   const { theme } = useContext(ThemeContext);
// //   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

// //   // Alert state
// //   const [alertVisible, setAlertVisible] = useState(false);
// //   const [alertTitle, setAlertTitle] = useState('');
// //   const [alertMessage, setAlertMessage] = useState('');
// //   const [alertIcon, setAlertIcon] = useState('');
// //   const [alertButtons, setAlertButtons] = useState([]);

// //   const openReviewPopup = () => {
// //     setReviewPopupVisible(true);
// //   };

// //   const closeReviewPopup = () => {
// //     setReviewPopupVisible(false);
// //   };

// //   const toggleFavorite = () => {
// //     if (isFavourite) {
// //       removeFromFavourites(item._id);
// //       setAlertTitle('Removed from Favourites');
// //       setAlertMessage(`${item.name} has been removed from your favourites.`);
// //       setAlertIcon('heart-dislike-outline');
// //     } else {
// //       addToFavourites(item);
// //       setAlertTitle('Added to Favourites');
// //       setAlertMessage(`${item.name} has been added to your favourites.`);
// //       setAlertIcon('heart');
// //     }
// //     setAlertButtons([
// //       {
// //         text: 'OK',
// //         onPress: () => setAlertVisible(false),
// //       },
// //     ]);
// //     setAlertVisible(true);
// //   };

// //   const handleAddToCart = (productItem) => {
// //     const added = addToCart(productItem);
// //     if (added) {
// //       setAlertTitle('Success');
// //       setAlertMessage(`${productItem.name} has been added to your cart.`);
// //       setAlertIcon('cart');
// //     } else {
// //       setAlertTitle('Info');
// //       setAlertMessage(`${productItem.name} is already in your cart.`);
// //       setAlertIcon('information-circle');
// //     }
// //     setAlertButtons([
// //       {
// //         text: 'OK',
// //         onPress: () => setAlertVisible(false),
// //       },
// //     ]);
// //     setAlertVisible(true);
// //   };

// //   return (
// //     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
// //       <StatusBar
// //         backgroundColor={currentTheme.headerBackground[1]}
// //         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
// //       />
// //       {/* Header */}
// //       <LinearGradient
// //         colors={currentTheme.headerBackground}
// //         style={styles.header}
// //         start={[0, 0]}
// //         end={[0, 1]}
// //       >
// //         {/* Back Button */}
// //         <TouchableOpacity
// //           style={styles.backButton}
// //           onPress={() => navigation.goBack()}
// //           accessibilityLabel="Go Back"
// //           accessibilityRole="button"
// //         >
// //           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
// //         </TouchableOpacity>

// //         {/* Header Title Container */}
// //         <View style={styles.headerTitleContainer}>
// //           <Text
// //             style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}
// //             numberOfLines={1}
// //             ellipsizeMode="tail"
// //           >
// //             {item.name}
// //           </Text>
// //           <Text
// //             style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}
// //             numberOfLines={1}
// //             ellipsizeMode="tail"
// //           >
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>
// //         </View>
// //       </LinearGradient>

// //       <ScrollView contentContainerStyle={styles.scrollContent}>
// //         {/* Product Image */}
// //         <View style={styles.imageContainer}>
// //           <Image source={{ uri: item.image }} style={styles.productImage} />
// //           {/* Favorite Button */}
// //           <TouchableOpacity
// //             style={styles.favoriteButton}
// //             onPress={toggleFavorite}
// //             accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
// //             accessibilityRole="button"
// //           >
// //             <Ionicons
// //               name={isFavourite ? 'heart' : 'heart-outline'}
// //               size={28}
// //               color={isFavourite ? '#E91E63' : currentTheme.placeholderTextColor}
// //             />
// //           </TouchableOpacity>
// //         </View>

// //         {/* Details Container */}
// //         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
// //           <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>

// //           {/* Subheading for clarity */}
// //           <Text style={[styles.subHeading, { color: currentTheme.textColor }]}>
// //             Explore the details below and share your thoughts!
// //           </Text>

// //           {/* Rating */}
// //           <View style={styles.ratingContainer}>
// //             {Array.from({ length: 5 }, (_, index) => (
// //               <Ionicons
// //                 key={index}
// //                 name={index < Math.floor(item.ratings) ? 'star' : 'star-outline'}
// //                 size={20}
// //                 color="#FFD700"
// //               />
// //             ))}
// //             <TouchableOpacity onPress={openReviewPopup}>
// //               <Text style={[styles.reviewCount, { color: currentTheme.cardTextColor }]}>
// //                 ({item.numberOfReviews} reviews)
// //               </Text>
// //             </TouchableOpacity>
// //           </View>

// //           {/* Price */}
// //           <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>
// //             ${item.price}
// //           </Text>

// //           {/* Description */}
// //           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
// //             Description
// //           </Text>
// //           <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>
// //             {item.description}
// //           </Text>

// //           {/* Add to Cart Button */}
// //           <TouchableOpacity
// //             style={[styles.addToCartButton, { backgroundColor: currentTheme.primaryColor }]}
// //             onPress={() => handleAddToCart(item)}
// //             accessibilityLabel="Add to Cart"
// //             accessibilityRole="button"
// //           >
// //             <MaterialIcons name="add-shopping-cart" size={24} color="#FFFFFF" />
// //             <Text style={styles.addToCartButtonText}>Add to Cart</Text>
// //           </TouchableOpacity>
// //         </View>

// //         {/* Review Popup */}
// //         <Modal
// //           visible={isReviewPopupVisible}
// //           animationType="slide"
// //           onRequestClose={closeReviewPopup}
// //           transparent={true}
// //         >
// //           <ReviewPopup closePopup={closeReviewPopup} reviewableId={item._id} reviewableType="Product" />
// //         </Modal>
// //       </ScrollView>

// //       {/* CustomAlert Component */}
// //       <CustomAlert
// //         visible={alertVisible}
// //         title={alertTitle}
// //         message={alertMessage}
// //         icon={alertIcon}
// //         onClose={() => setAlertVisible(false)}
// //         buttons={alertButtons}
// //       />
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   safeArea: {
// //     flex: 1,
// //   },
// //   header: {
// //     width: '100%',
// //     paddingVertical: 10,
// //     paddingHorizontal: 15,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     // iOS Shadow
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //     // Android Elevation
// //     elevation: 4,
// //   },
// //   backButton: {
// //     position: 'absolute',
// //     left: 15,
// //     padding: 8,
// //   },
// //   headerTitleContainer: {
// //     alignItems: 'center',
// //   },
// //   headerTitle: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     width: width * 0.7, // Restrict width to truncate gracefully
// //     textAlign: 'center',
// //   },
// //   headerSubtitle: {
// //     fontSize: 14,
// //     fontWeight: '400',
// //     marginTop: 2,
// //     width: width * 0.7, // Restrict width to truncate gracefully
// //     textAlign: 'center',
// //   },
// //   scrollContent: {
// //     paddingBottom: 20,
// //   },
// //   imageContainer: {
// //     position: 'relative',
// //   },
// //   productImage: {
// //     width: width,
// //     height: 300,
// //     resizeMode: 'cover',
// //   },
// //   favoriteButton: {
// //     position: 'absolute',
// //     top: 20,
// //     right: 20,
// //     backgroundColor: '#FFFFFFAA',
// //     borderRadius: 30,
// //     padding: 8,
// //   },
// //   detailsContainer: {
// //     padding: 20,
// //     marginTop: -20,
// //     borderTopLeftRadius: 30,
// //     borderTopRightRadius: 30,
// //     // iOS Shadow
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //     // Android Elevation
// //     elevation: 5,
// //   },
// //   productTitle: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     marginBottom: 5,
// //   },
// //   productSubtitle: {
// //     fontSize: 16,
// //     marginBottom: 10,
// //   },
// //   subHeading: {
// //     fontSize: 14,
// //     marginBottom: 15,
// //     fontStyle: 'italic',
// //   },
// //   ratingContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   reviewCount: {
// //     fontSize: 16,
// //     marginLeft: 10,
// //     textDecorationLine: 'underline',
// //   },
// //   productPrice: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     marginBottom: 20,
// //   },
// //   sectionTitle: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     marginBottom: 10,
// //   },
// //   productDescription: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     marginBottom: 30,
// //   },
// //   addToCartButton: {
// //     flexDirection: 'row',
// //     paddingVertical: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     // iOS Shadow
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //     // Android Elevation
// //     elevation: 3,
// //   },
// //   addToCartButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginLeft: 10,
// //   },
// // });

// // export default ProductPage;

























// // // src/screens/ProductPage.js

// // import React, { useContext, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   Image,
// //   StyleSheet,
// //   ScrollView,
// //   TouchableOpacity,
// //   Modal,
// //   Dimensions,
// //   StatusBar,
// //   SafeAreaView,
// // } from 'react-native';
// // import { useRoute, useNavigation } from '@react-navigation/native';
// // import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// // import ReviewPopup from '../components/ReviewPopup';
// // import { LinearGradient } from 'expo-linear-gradient';

// // import { ThemeContext } from '../../ThemeContext';
// // import { lightTheme, darkTheme } from '../../themes';
// // import { CartContext } from '../contexts/CartContext';
// // import { FavouritesContext } from '../contexts/FavouritesContext'; // Import FavouritesContext
// // import CustomAlert from '../components/CustomAlert'; // Import CustomAlert

// // const { width } = Dimensions.get('window');

// // const ProductPage = () => {
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const { item } = route.params;

// //   const [isReviewPopupVisible, setReviewPopupVisible] = React.useState(false);
// //   const { cartItems, addToCart } = useContext(CartContext);

// //   // Access FavouritesContext
// //   const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);

// //   // Determine if the item is a favourite
// //   const isFavourite = favouriteItems.some((favItem) => favItem._id === item._id);

// //   // Get theme from context
// //   const { theme } = useContext(ThemeContext);
// //   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

// //   // State for controlling the CustomAlert
// //   const [alertVisible, setAlertVisible] = useState(false);
// //   const [alertTitle, setAlertTitle] = useState('');
// //   const [alertMessage, setAlertMessage] = useState('');
// //   const [alertIcon, setAlertIcon] = useState('');
// //   const [alertButtons, setAlertButtons] = useState([]);

// //   const openReviewPopup = () => {
// //     setReviewPopupVisible(true);
// //   };

// //   const closeReviewPopup = () => {
// //     setReviewPopupVisible(false);
// //   };

// //   const toggleFavorite = () => {
// //     if (isFavourite) {
// //       removeFromFavourites(item._id);
// //       setAlertTitle('Removed from Favourites');
// //       setAlertMessage(`${item.name} has been removed from your favourites.`);
// //       setAlertIcon('heart-dislike-outline');
// //     } else {
// //       addToFavourites(item);
// //       setAlertTitle('Added to Favourites');
// //       setAlertMessage(`${item.name} has been added to your favourites.`);
// //       setAlertIcon('heart');
// //     }
// //     setAlertButtons([
// //       {
// //         text: 'OK',
// //         onPress: () => setAlertVisible(false),
// //       },
// //     ]);
// //     setAlertVisible(true);
// //   };

// //   const handleAddToCart = (item) => {
// //     const added = addToCart(item);
// //     if (added) {
// //       setAlertTitle('Success');
// //       setAlertMessage(`${item.name} has been added to your cart.`);
// //       setAlertIcon('cart');
// //     } else {
// //       setAlertTitle('Info');
// //       setAlertMessage(`${item.name} is already in your cart.`);
// //       setAlertIcon('information-circle');
// //     }
// //     setAlertButtons([
// //       {
// //         text: 'OK',
// //         onPress: () => setAlertVisible(false),
// //       },
// //     ]);
// //     setAlertVisible(true);
// //   };

// //   return (
// //     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
// //       <StatusBar
// //         backgroundColor={currentTheme.headerBackground[1]}
// //         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
// //       />
// //       {/* Header */}
// //       <LinearGradient
// //         colors={currentTheme.headerBackground}
// //         style={styles.header}
// //         start={[0, 0]}
// //         end={[0, 1]}
// //       >
// //         {/* Back Button */}
// //         <TouchableOpacity
// //           style={styles.backButton}
// //           onPress={() => navigation.goBack()}
// //           accessibilityLabel="Go Back"
// //           accessibilityRole="button"
// //         >
// //           <Ionicons name="arrow-back" size={28} color={currentTheme.headerTextColor} />
// //         </TouchableOpacity>

// //         {/* Header Title */}
// //         <View style={styles.headerTitleContainer}>
// //           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>
// //         </View>
// //       </LinearGradient>

// //       <ScrollView contentContainerStyle={styles.scrollContent}>
// //         {/* Product Image */}
// //         <View style={styles.imageContainer}>
// //           <Image source={{ uri: item.image }} style={styles.productImage} />
// //           {/* Favorite Button */}
// //           <TouchableOpacity
// //             style={styles.favoriteButton}
// //             onPress={toggleFavorite}
// //             accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
// //             accessibilityRole="button"
// //           >
// //             <Ionicons
// //               name={isFavourite ? 'heart' : 'heart-outline'}
// //               size={28}
// //               color={isFavourite ? '#E91E63' : currentTheme.placeholderTextColor}
// //             />
// //           </TouchableOpacity>
// //         </View>

// //         {/* Product Details */}
// //         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
// //           <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>

// //           {/* Rating */}
// //           <View style={styles.ratingContainer}>
// //             {Array.from({ length: 5 }, (_, index) => (
// //               <Ionicons
// //                 key={index}
// //                 name={index < Math.floor(item.ratings) ? 'star' : 'star-outline'}
// //                 size={20}
// //                 color="#FFD700"
// //               />
// //             ))}
// //             <TouchableOpacity onPress={openReviewPopup}>
// //               <Text style={[styles.reviewCount, { color: currentTheme.secondaryColor }]}>
// //                 ({item.numberOfReviews} reviews)
// //               </Text>
// //             </TouchableOpacity>
// //           </View>

// //           {/* Price */}
// //           <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>
// //             ${item.price}
// //           </Text>

// //           {/* Description */}
// //           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
// //             Description
// //           </Text>
// //           <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>
// //             {item.description}
// //           </Text>

// //           {/* Add to Cart Button */}
// //           <TouchableOpacity
// //             style={[styles.addToCartButton, { backgroundColor: currentTheme.primaryColor }]}
// //             onPress={() => handleAddToCart(item)}
// //             accessibilityLabel="Add to Cart"
// //             accessibilityRole="button"
// //           >
// //             <MaterialIcons name="add-shopping-cart" size={24} color="#FFFFFF" />
// //             <Text style={styles.addToCartButtonText}>Add to Cart</Text>
// //           </TouchableOpacity>
// //         </View>

// //         {/* Review Popup */}
// //         <Modal
// //           visible={isReviewPopupVisible}
// //           animationType="slide"
// //           onRequestClose={closeReviewPopup}
// //           transparent={true}
// //         >
// //           <ReviewPopup closePopup={closeReviewPopup} productId={item._id} />
// //         </Modal>
// //       </ScrollView>

// //       {/* CustomAlert Component */}
// //       <CustomAlert
// //         visible={alertVisible}
// //         title={alertTitle}
// //         message={alertMessage}
// //         icon={alertIcon}
// //         onClose={() => setAlertVisible(false)}
// //         buttons={alertButtons}
// //       />
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   safeArea: {
// //     flex: 1,
// //   },
// //   header: {
// //     width: '100%',
// //     paddingVertical: 5,
// //     paddingHorizontal: 15,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     elevation: 4,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 2,
// //     },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// //   backButton: {
// //     position: 'absolute',
// //     left: 15,
// //     top: 10,
// //     padding: 8,
// //   },
// //   headerTitleContainer: {
// //     alignItems: 'center',
// //   },
// //   headerTitle: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //   },
// //   headerSubtitle: {
// //     fontSize: 16,
// //     fontWeight: '400',
// //     marginTop: 4,
// //   },
// //   scrollContent: {
// //     paddingBottom: 20,
// //   },
// //   imageContainer: {
// //     position: 'relative',
// //   },
// //   productImage: {
// //     width: width,
// //     height: 300,
// //     resizeMode: 'cover',
// //   },
// //   favoriteButton: {
// //     position: 'absolute',
// //     top: 20,
// //     right: 20,
// //     backgroundColor: '#FFFFFFAA',
// //     borderRadius: 30,
// //     padding: 8,
// //   },
// //   detailsContainer: {
// //     padding: 20,
// //     marginTop: -20,
// //     borderTopLeftRadius: 30,
// //     borderTopRightRadius: 30,
// //     elevation: 5,
// //   },
// //   productTitle: {
// //     fontSize: 26,
// //     fontWeight: '700',
// //     marginBottom: 5,
// //   },
// //   productSubtitle: {
// //     fontSize: 18,
// //     marginBottom: 10,
// //   },
// //   ratingContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   reviewCount: {
// //     fontSize: 16,
// //     marginLeft: 5,
// //     textDecorationLine: 'underline',
// //   },
// //   productPrice: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     marginBottom: 20,
// //   },
// //   sectionTitle: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     marginBottom: 10,
// //   },
// //   productDescription: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     marginBottom: 30,
// //   },
// //   addToCartButton: {
// //     flexDirection: 'row',
// //     paddingVertical: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     elevation: 3,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 2,
// //     },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// //   addToCartButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginLeft: 10,
// //   },
// // });

// // export default ProductPage;








// // // src/screens/ProductPage.js

// // import React, { useContext } from 'react';
// // import {
// //   View,
// //   Text,
// //   Image,
// //   StyleSheet,
// //   ScrollView,
// //   TouchableOpacity,
// //   Modal,
// //   Dimensions,
// //   StatusBar,
// //   SafeAreaView,
// //   Alert,
// // } from 'react-native';
// // import { useRoute, useNavigation } from '@react-navigation/native';
// // import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// // import ReviewPopup from '../components/ReviewPopup';
// // import { LinearGradient } from 'expo-linear-gradient';

// // import { ThemeContext } from '../../ThemeContext';
// // import { lightTheme, darkTheme } from '../../themes';
// // import { CartContext } from '../contexts/CartContext';
// // import { FavouritesContext } from '../contexts/FavouritesContext'; // Import FavouritesContext

// // const { width } = Dimensions.get('window');

// // const ProductPage = () => {
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const { item } = route.params;

// //   const [isReviewPopupVisible, setReviewPopupVisible] = React.useState(false);
// //   const { cartItems, addToCart } = useContext(CartContext);

// //   // Access FavouritesContext
// //   const { favouriteItems, addToFavourites, removeFromFavourites } = useContext(FavouritesContext);

// //   // Determine if the item is a favourite
// //   const isFavourite = favouriteItems.some((favItem) => favItem._id === item._id);

// //   // Get theme from context
// //   const { theme } = useContext(ThemeContext);
// //   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

// //   const openReviewPopup = () => {
// //     setReviewPopupVisible(true);
// //   };

// //   const closeReviewPopup = () => {
// //     setReviewPopupVisible(false);
// //   };

// //   const toggleFavorite = () => {
// //     if (isFavourite) {
// //       removeFromFavourites(item._id);
// //       Alert.alert('Removed from Favourites', `${item.name} has been removed from your favourites.`);
// //     } else {
// //       addToFavourites(item);
// //       Alert.alert('Added to Favourites', `${item.name} has been added to your favourites.`);
// //     }
// //   };

// //   const handleAddToCart = (item) => {
// //     const added = addToCart(item);
// //     if (added) {
// //       Alert.alert('Success', `${item.name} has been added to your cart.`);
// //     } else {
// //       Alert.alert('Info', `${item.name} is already in your cart.`);
// //     }
// //   };

// //   return (
// //     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
// //       <StatusBar
// //         backgroundColor={currentTheme.headerBackground[1]}
// //         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
// //       />
// //       {/* Header */}
// //       <LinearGradient
// //         colors={currentTheme.headerBackground}
// //         style={styles.header}
// //         start={[0, 0]}
// //         end={[0, 1]}
// //       >
// //         {/* Back Button */}
// //         <TouchableOpacity
// //           style={styles.backButton}
// //           onPress={() => navigation.goBack()}
// //           accessibilityLabel="Go Back"
// //           accessibilityRole="button"
// //         >
// //           <Ionicons name="arrow-back" size={28} color={currentTheme.headerTextColor} />
// //         </TouchableOpacity>

// //         {/* Header Title */}
// //         <View style={styles.headerTitleContainer}>
// //           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>
// //         </View>
// //       </LinearGradient>

// //       <ScrollView contentContainerStyle={styles.scrollContent}>
// //         {/* Product Image */}
// //         <View style={styles.imageContainer}>
// //           <Image source={{ uri: item.image }} style={styles.productImage} />
// //           {/* Favorite Button */}
// //           <TouchableOpacity
// //             style={styles.favoriteButton}
// //             onPress={toggleFavorite}
// //             accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
// //             accessibilityRole="button"
// //           >
// //             <Ionicons
// //               name={isFavourite ? 'heart' : 'heart-outline'}
// //               size={28}
// //               color={isFavourite ? '#E91E63' : currentTheme.placeholderTextColor}
// //             />
// //           </TouchableOpacity>
// //         </View>

// //         {/* Product Details */}
// //         <View style={[styles.detailsContainer, { backgroundColor: currentTheme.cardBackground }]}>
// //           <Text style={[styles.productTitle, { color: currentTheme.cardTextColor }]}>
// //             {item.name}
// //           </Text>
// //           <Text style={[styles.productSubtitle, { color: currentTheme.textColor }]}>
// //             {item.subjectName} ({item.subjectCode})
// //           </Text>

// //           {/* Rating */}
// //           <View style={styles.ratingContainer}>
// //             {Array.from({ length: 5 }, (_, index) => (
// //               <Ionicons
// //                 key={index}
// //                 name={index < Math.floor(item.ratings) ? 'star' : 'star-outline'}
// //                 size={20}
// //                 color="#FFD700"
// //               />
// //             ))}
// //             <TouchableOpacity onPress={openReviewPopup}>
// //               <Text style={[styles.reviewCount, { color: currentTheme.secondaryColor }]}>
// //                 ({item.numberOfReviews} reviews)
// //               </Text>
// //             </TouchableOpacity>
// //           </View>

// //           {/* Price */}
// //           <Text style={[styles.productPrice, { color: currentTheme.priceColor }]}>
// //             ${item.price}
// //           </Text>

// //           {/* Description */}
// //           <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
// //             Description
// //           </Text>
// //           <Text style={[styles.productDescription, { color: currentTheme.textColor }]}>
// //             {item.description}
// //           </Text>

// //           {/* Add to Cart Button */}
// //           <TouchableOpacity
// //             style={[styles.addToCartButton, { backgroundColor: currentTheme.primaryColor }]}
// //             onPress={() => handleAddToCart(item)}
// //             accessibilityLabel="Add to Cart"
// //             accessibilityRole="button"
// //           >
// //             <MaterialIcons name="add-shopping-cart" size={24} color="#FFFFFF" />
// //             <Text style={styles.addToCartButtonText}>Add to Cart</Text>
// //           </TouchableOpacity>
// //         </View>

// //         {/* Review Popup */}
// //         <Modal
// //           visible={isReviewPopupVisible}
// //           animationType="slide"
// //           onRequestClose={closeReviewPopup}
// //           transparent={true}
// //         >
// //           <ReviewPopup closePopup={closeReviewPopup} productId={item._id} />
// //         </Modal>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // };

// // // Styles for the components
// // const styles = StyleSheet.create({
// //   safeArea: {
// //     flex: 1,
// //   },
// //   header: {
// //     width: '100%',
// //     paddingVertical: 5,
// //     paddingHorizontal: 15,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     elevation: 4,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 2,
// //     },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// //   backButton: {
// //     position: 'absolute',
// //     left: 15,
// //     top: 10,
// //     padding: 8,
// //   },
// //   headerTitleContainer: {
// //     alignItems: 'center',
// //   },
// //   headerTitle: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //   },
// //   headerSubtitle: {
// //     fontSize: 16,
// //     fontWeight: '400',
// //     marginTop: 4,
// //   },
// //   scrollContent: {
// //     paddingBottom: 20,
// //   },
// //   imageContainer: {
// //     position: 'relative',
// //   },
// //   productImage: {
// //     width: width,
// //     height: 300,
// //     resizeMode: 'cover',
// //   },
// //   favoriteButton: {
// //     position: 'absolute',
// //     top: 20,
// //     right: 20,
// //     backgroundColor: '#FFFFFFAA',
// //     borderRadius: 30,
// //     padding: 8,
// //   },
// //   detailsContainer: {
// //     padding: 20,
// //     marginTop: -20,
// //     borderTopLeftRadius: 30,
// //     borderTopRightRadius: 30,
// //     elevation: 5,
// //   },
// //   productTitle: {
// //     fontSize: 26,
// //     fontWeight: '700',
// //     marginBottom: 5,
// //   },
// //   productSubtitle: {
// //     fontSize: 18,
// //     marginBottom: 10,
// //   },
// //   ratingContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   reviewCount: {
// //     fontSize: 16,
// //     marginLeft: 5,
// //     textDecorationLine: 'underline',
// //   },
// //   productPrice: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     marginBottom: 20,
// //   },
// //   sectionTitle: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     marginBottom: 10,
// //   },
// //   productDescription: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     marginBottom: 30,
// //   },
// //   addToCartButton: {
// //     flexDirection: 'row',
// //     paddingVertical: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     elevation: 3,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 2,
// //     },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //   },
// //   addToCartButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginLeft: 10,
// //   },
// // });

// // export default ProductPage;
