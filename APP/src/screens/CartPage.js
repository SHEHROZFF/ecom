// src/screens/CartPage.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import { CartContext } from '../contexts/CartContext';
import CustomAlert from '../components/CustomAlert';

// Redux imports
import { useDispatch } from 'react-redux';
import { fetchPaymentIntentThunk } from '../store/slices/paymentSlice';
import { createOrderThunk } from '../store/slices/orderSlice';

const CartPage = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = React.useState(false);
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState('');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertIcon, setAlertIcon] = React.useState('');
  const [alertButtons, setAlertButtons] = React.useState([]);

  const totalPrice = cartItems
    .reduce((sum, item) => sum + parseFloat(item.price), 0)
    .toFixed(2);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const dispatch = useDispatch();

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.cartItem,
        { backgroundColor: currentTheme.cardBackground, width: width * 0.9 },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={[
          styles.cartItemImage,
          { width: width * 0.2, height: width * 0.2 },
        ]}
      />
      <View style={styles.cartItemDetails}>
        <Text
          style={[styles.cartItemName, { color: currentTheme.cardTextColor }]}
          numberOfLines={1}
        >
          {item.examName || item.name}
        </Text>
        <Text
          style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]}
          numberOfLines={1}
        >
          {item.subjectName} ({item.subjectCode})
        </Text>
        <View style={styles.cartItemFooter}>
          <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>
            ${item.price}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item._id)}>
        <Ionicons name="trash-outline" size={24} color="#E53935" />
      </TouchableOpacity>
    </View>
  );

  const handleCheckout = async () => {
    setLoading(true);
    if (cartItems.length === 0) {
      setAlertTitle('Cart Empty');
      setAlertMessage('Your cart is empty. Add items before checkout.');
      setAlertIcon('cart-outline');
      setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
      setLoading(false);
      return;
    }

    try {
      const clientSecret = await dispatch(fetchPaymentIntentThunk(totalPrice)).unwrap();
      if (!clientSecret) {
        setLoading(false);
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Ai-Nsider',
      });
      if (initError) {
        setAlertTitle('Payment Failed');
        setAlertMessage(initError.message);
        setAlertIcon('cart-outline');
        setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
        setAlertVisible(true);
        setLoading(false);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        setAlertTitle('Payment Failed');
        setAlertMessage(paymentError.message);
        setAlertIcon('cart-outline');
        setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
        setAlertVisible(true);
        setLoading(false);
        return;
      }

      const orderData = {
        orderItems: cartItems.map((item) => ({
          product: item._id,
          examName: item.examName,
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          price: item.price,
          image: item.image,
          quantity: 1,
        })),
        totalPrice: parseFloat(totalPrice),
        paymentMethod: 'Card',
        isPaid: true,
        paidAt: new Date(),
        paymentResult: { clientSecret },
      };

      const createdOrder = await dispatch(createOrderThunk(orderData)).unwrap();
      if (createdOrder) {
        setAlertTitle('Order Placed');
        setAlertMessage(
          'You have successfully purchased the products in your cart. Check your history for details.'
        );
        setAlertIcon('checkmark-circle');
        setAlertButtons([
          {
            text: 'OK',
            onPress: () => {
              setAlertVisible(false);
              clearCart();
              navigation.navigate('PurchaseHistory');
            },
          },
        ]);
        setAlertVisible(true);
      } else {
        throw new Error('Failed to place order.');
      }
    } catch (error) {
      setAlertTitle('Checkout Failed');
      setAlertMessage(error.message || 'An error occurred during checkout.');
      setAlertIcon('close-circle');
      setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={currentTheme.headerBackground[0]}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />

      <LinearGradient
        colors={currentTheme.headerBackground}
        style={[
          styles.header,
          { paddingTop: insets.top + 10, paddingHorizontal: width * 0.05 },
        ]}
        start={[0, 0]}
        end={[0, 1]}
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
            Your Cart
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
            Review your selected items
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: width * 0.05 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={currentTheme.placeholderTextColor} />
            <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
              Your cart is empty.
            </Text>
          </View>
        }
        ListFooterComponent={() =>
          cartItems.length > 0 ? (
            <View style={styles.footer}>
              <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
                Total:{' '}
                <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  { backgroundColor: currentTheme.primaryColor },
                  loading && styles.disabledButton,
                ]}
                onPress={handleCheckout}
                disabled={loading}
              >
                <Text style={styles.checkoutButtonText}>
                  {loading ? 'Processing...' : 'Checkout'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        icon={alertIcon}
        onClose={() => setAlertVisible(false)}
        buttons={alertButtons}
      />
    </View>
  );
};

export default CartPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 20,
    paddingBottom: 140,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cartItemImage: {
    borderRadius: 10,
    marginRight: 10,
  },
  cartItemDetails: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cartItemSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  cartItemFooter: {
    flexDirection: 'row',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});







// // src/screens/CartPage.js
// import React, { useContext } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
//   Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useStripe } from '@stripe/stripe-react-native';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import CustomAlert from '../components/CustomAlert';

// // Redux imports
// import { useDispatch } from 'react-redux';
// import { fetchPaymentIntentThunk } from '../store/slices/paymentSlice';
// import { createOrderThunk } from '../store/slices/orderSlice';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window');

// const CartPage = () => {
//   const navigation = useNavigation();
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   const insets = useSafeAreaInsets();

//   const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();

//   const [loading, setLoading] = React.useState(false);
//   const [alertVisible, setAlertVisible] = React.useState(false);
//   const [alertTitle, setAlertTitle] = React.useState('');
//   const [alertMessage, setAlertMessage] = React.useState('');
//   const [alertIcon, setAlertIcon] = React.useState('');
//   const [alertButtons, setAlertButtons] = React.useState([]);

//   const totalPrice = cartItems
//     .reduce((sum, item) => sum + parseFloat(item.price), 0)
//     .toFixed(2);

//   React.useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   const dispatch = useDispatch();

//   const renderItem = ({ item }) => (
//     <View style={[styles.cartItem, { backgroundColor: currentTheme.cardBackground }]}>
//       <Image source={{ uri: item.image }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={[styles.cartItemName, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
//           {item.examName || item.name}
//         </Text>
//         <Text style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]} numberOfLines={1}>
//           {item.subjectName} ({item.subjectCode})
//         </Text>
//         <View style={styles.cartItemFooter}>
//           <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>
//             ${item.price}
//           </Text>
//         </View>
//       </View>
//       <TouchableOpacity onPress={() => removeFromCart(item._id)}>
//         <Ionicons name="trash-outline" size={24} color="#E53935" />
//       </TouchableOpacity>
//     </View>
//   );

//   const handleCheckout = async () => {
//     setLoading(true);
//     if (cartItems.length === 0) {
//       setAlertTitle('Cart Empty');
//       setAlertMessage('Your cart is empty. Add items before checkout.');
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     try {
//       const clientSecret = await dispatch(fetchPaymentIntentThunk(totalPrice)).unwrap();
//       if (!clientSecret) {
//         setLoading(false);
//         return;
//       }

//       const { error: initError } = await initPaymentSheet({
//         paymentIntentClientSecret: clientSecret,
//         merchantDisplayName: 'Ai-Nsider',
//       });
//       if (initError) {
//         setAlertTitle('Payment Failed');
//         setAlertMessage(initError.message);
//         setAlertIcon('cart-outline');
//         setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//         setAlertVisible(true);
//         setLoading(false);
//         return;
//       }

//       const { error: paymentError } = await presentPaymentSheet();
//       if (paymentError) {
//         setAlertTitle('Payment Failed');
//         setAlertMessage(paymentError.message);
//         setAlertIcon('cart-outline');
//         setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//         setAlertVisible(true);
//         setLoading(false);
//         return;
//       }

//       // Payment success: create order via Redux thunk
//       const orderData = {
//         orderItems: cartItems.map((item) => ({
//           product: item._id,
//           examName: item.examName,
//           subjectName: item.subjectName,
//           subjectCode: item.subjectCode,
//           price: item.price,
//           image: item.image,
//           quantity: 1,
//         })),
//         totalPrice: parseFloat(totalPrice),
//         paymentMethod: 'Card',
//         isPaid: true,
//         paidAt: new Date(),
//         paymentResult: { clientSecret },
//       };

//       const createdOrder = await dispatch(createOrderThunk(orderData)).unwrap();
//       if (createdOrder) {
//         setAlertTitle('Order Placed');
//         setAlertMessage(
//           'You have successfully purchased the products in your cart. Check your history for details.'
//         );
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               clearCart();
//               navigation.navigate('PurchaseHistory');
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         throw new Error('Failed to place order.');
//       }
//     } catch (error) {
//       setAlertTitle('Checkout Failed');
//       setAlertMessage(error.message || 'An error occurred during checkout.');
//       setAlertIcon('close-circle');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//     }
//     setLoading(false);
//   };

//   return (
//     <View style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[0]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={[styles.header,{paddingTop:insets.top+10}]}
//         start={[0, 0]}
//         end={[0, 1]}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             Your Cart
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Review your selected items
//           </Text>
//         </View>
//       </LinearGradient>

//       <FlatList
//         data={cartItems}
//         keyExtractor={(item) => item._id}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="cart-outline" size={80} color={currentTheme.placeholderTextColor} />
//             <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//               Your cart is empty.
//             </Text>
//           </View>
//         }
//         ListFooterComponent={() =>
//           cartItems.length > 0 ? (
//             <View style={styles.footer}>
//               <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
//                 Total:{' '}
//                 <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
//               </Text>
//               <TouchableOpacity
//                 style={[
//                   styles.checkoutButton,
//                   { backgroundColor: currentTheme.primaryColor },
//                   loading && styles.disabledButton,
//                 ]}
//                 onPress={handleCheckout}
//                 disabled={loading}
//               >
//                 <Text style={styles.checkoutButtonText}>
//                   {loading ? 'Processing...' : 'Checkout'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : null
//         }
//       />

//       <CustomAlert
//         visible={alertVisible}
//         title={alertTitle}
//         message={alertMessage}
//         icon={alertIcon}
//         onClose={() => setAlertVisible(false)}
//         buttons={alertButtons}
//       />
//     </View>
//   );
// };

// export default CartPage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     width: '100%',
//     paddingVertical: 12,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: Platform.OS === 'ios' ? 60 : 10,
//     padding: 8,
//     zIndex: 10,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   listContent: {
//     padding: 20,
//     paddingBottom: 140,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     marginTop: 50,
//   },
//   emptyText: {
//     fontSize: 16,
//     marginTop: 15,
//     textAlign: 'center',
//     paddingHorizontal: 20,
//   },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//   },
//   cartItemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   cartItemDetails: {
//     flex: 1,
//     marginRight: 10,
//   },
//   cartItemName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 2,
//   },
//   cartItemSubtitle: {
//     fontSize: 13,
//     marginBottom: 4,
//   },
//   cartItemFooter: {
//     flexDirection: 'row',
//   },
//   cartItemPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footer: {
//     paddingTop: 15,
//     paddingBottom: 15,
//     marginBottom: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#ddd',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   totalText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkoutButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//     elevation: 3,
//   },
//   checkoutButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
// });








// // src/screens/CartPage.js
// import React, { useContext, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useStripe } from '@stripe/stripe-react-native';

// import api, { fetchPaymentIntent } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import CustomAlert from '../components/CustomAlert';

// const { width } = Dimensions.get('window');

// const CartPage = () => {
//   const navigation = useNavigation();
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();

//   const [loading, setLoading] = useState(false);

//   const totalPrice = cartItems
//     .reduce((sum, item) => sum + parseFloat(item.price), 0)
//     .toFixed(2);

//   useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   const renderItem = ({ item }) => (
//     <View style={[styles.cartItem, { backgroundColor: currentTheme.cardBackground }]}>
//       <Image source={{ uri: item.image }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={[styles.cartItemName, { color: currentTheme.cardTextColor }]} numberOfLines={1}>
//           {item.examName || item.name}
//         </Text>
//         <Text style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]} numberOfLines={1}>
//           {item.subjectName} ({item.subjectCode})
//         </Text>
//         <View style={styles.cartItemFooter}>
//           <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>
//             ${item.price}
//           </Text>
//         </View>
//       </View>
//       <TouchableOpacity onPress={() => removeFromCart(item._id)}>
//         <Ionicons name="trash-outline" size={24} color="#E53935" />
//       </TouchableOpacity>
//     </View>
//   );

//   const handleCheckout = async () => {
//     setLoading(true);
//     if (cartItems.length === 0) {
//       setAlertTitle('Cart Empty');
//       setAlertMessage('Your cart is empty. Add items before checkout.');
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     const clientSecret = await fetchPaymentIntent(totalPrice);
//     if (!clientSecret) {
//       setLoading(false);
//       return;
//     }

//     const { error: initError } = await initPaymentSheet({
//       paymentIntentClientSecret: clientSecret,
//       merchantDisplayName: 'Ai-Nsider',
//     });
//     if (initError) {
//       setAlertTitle('Payment Failed');
//       setAlertMessage(initError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     const { error: paymentError } = await presentPaymentSheet();
//     if (paymentError) {
//       setAlertTitle('Payment Failed');
//       setAlertMessage(paymentError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Payment success
//     try {
//       const orderData = {
//         orderItems: cartItems.map((item) => ({
//           product: item._id,
//           examName: item.examName,
//           subjectName: item.subjectName,
//           subjectCode: item.subjectCode,
//           price: item.price,
//           image: item.image,
//           quantity: 1,
//         })),
//         totalPrice: parseFloat(totalPrice),
//         paymentMethod: 'Card',
//         isPaid: true,
//         paidAt: new Date(),
//         paymentResult: { clientSecret },
//       };

//       const response = await api.createOrder(orderData);
//       if (response.success && response.data) {
//         const createdOrder = response.data;
//         createdOrder.orderItems.forEach((orderItem) => {
//           console.log(`PDF Link for ${orderItem.examName}: ${orderItem.product.pdfLink}`);
//         });

//         setAlertTitle('Order Placed');
//         setAlertMessage(
//           'You have successfully purchased the products in your cart. Check your history for details.'
//         );
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               clearCart();
//               navigation.navigate('PurchaseHistory');
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         throw new Error(response.message || 'Failed to place order.');
//       }
//     } catch (error) {
//       setAlertTitle('Checkout Failed');
//       setAlertMessage(error.message || 'An error occurred during checkout.');
//       setAlertIcon('close-circle');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//     }
//     setLoading(false);
//   };

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={[0, 0]}
//         end={[0, 1]}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             Your Cart
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Review your selected items
//           </Text>
//         </View>
//       </LinearGradient>

//       <FlatList
//         data={cartItems}
//         keyExtractor={(item) => item._id}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="cart-outline" size={80} color={currentTheme.placeholderTextColor} />
//             <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//               Your cart is empty.
//             </Text>
//           </View>
//         }
//         ListFooterComponent={() =>
//           cartItems.length > 0 ? (
//             <View style={styles.footer}>
//               <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
//                 Total:{' '}
//                 <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
//               </Text>
//               <TouchableOpacity
//                 style={[
//                   styles.checkoutButton,
//                   { backgroundColor: currentTheme.primaryColor },
//                   loading && styles.disabledButton,
//                 ]}
//                 onPress={handleCheckout}
//                 disabled={loading}
//               >
//                 <Text style={styles.checkoutButtonText}>
//                   {loading ? 'Processing...' : 'Checkout'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : null
//         }
//       />

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

// export default CartPage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     width: '100%',
//     paddingVertical: 12,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: 10,
//     padding: 8,
//     zIndex: 10,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   listContent: {
//     padding: 20,
//     paddingBottom: 140,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     marginTop: 50,
//   },
//   emptyText: {
//     fontSize: 16,
//     marginTop: 15,
//     textAlign: 'center',
//     paddingHorizontal: 20,
//   },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//   },
//   cartItemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   cartItemDetails: {
//     flex: 1,
//     marginRight: 10,
//   },
//   cartItemName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 2,
//   },
//   cartItemSubtitle: {
//     fontSize: 13,
//     marginBottom: 4,
//   },
//   cartItemFooter: {
//     flexDirection: 'row',
//   },
//   cartItemPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footer: {
//     paddingTop: 15,
//     paddingBottom: 15,
//     marginBottom: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#ddd',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   totalText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkoutButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//     elevation: 3,
//   },
//   checkoutButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
// });






// // src/screens/CartPage.js

// import React, { useContext, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useStripe } from '@stripe/stripe-react-native';

// import api, { fetchPaymentIntent } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import CustomAlert from '../components/CustomAlert';

// const { width } = Dimensions.get('window');

// const CartPage = () => {
//   const navigation = useNavigation();

//   // Theme
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Cart
//   const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

//   // Stripe
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();
//   const [loading, setLoading] = useState(false);

//   // Calculate total
//   const totalPrice = cartItems
//     .reduce((sum, item) => sum + parseFloat(item.price), 0)
//     .toFixed(2);

//   // Hide header (we use our custom header below)
//   useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   // CustomAlert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // Render a single cart item
//   const renderItem = ({ item }) => (
//     <View style={[styles.cartItem, { backgroundColor: currentTheme.cardBackground }]}>
//       <Image source={{ uri: item.image }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={[styles.cartItemName, { color: currentTheme.cardTextColor }]}>{item.examName}</Text>
//         <Text style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]}>
//           {item.subjectName} ({item.subjectCode})
//         </Text>
//         <View style={styles.cartItemFooter}>
//           <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>${item.price}</Text>
//         </View>
//       </View>
//       <TouchableOpacity
//         onPress={() => removeFromCart(item._id)}
//         accessibilityLabel={`Remove ${item.examName} from cart`}
//       >
//         <Ionicons name="trash-outline" size={24} color="#E53935" />
//       </TouchableOpacity>
//     </View>
//   );

//   // Checkout handler
//   const handleCheckout = async () => {
//     setLoading(true);
//     if (cartItems.length === 0) {
//       setAlertTitle('Cart Empty');
//       setAlertMessage('Your cart is empty. Add items before checkout.');
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Get Payment Intent
//     const clientSecret = await fetchPaymentIntent(totalPrice);
//     if (!clientSecret) {
//       setLoading(false);
//       return;
//     }

//     // Initialize Payment Sheet
//     const { error: initError } = await initPaymentSheet({
//       paymentIntentClientSecret: clientSecret,
//       merchantDisplayName: 'Your App Name',
//     });
//     if (initError) {
//       console.error('initPaymentSheet Error:', initError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(initError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Present Payment Sheet
//     const { error: paymentError } = await presentPaymentSheet();
//     if (paymentError) {
//       console.error('Payment Error:', paymentError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(paymentError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // If payment succeeds, create order
//     try {
//       const orderData = {
//         orderItems: cartItems.map((item) => ({
//           product: item._id,
//           examName: item.examName,
//           subjectName: item.subjectName,
//           subjectCode: item.subjectCode,
//           price: item.price,
//           image: item.image,
//           quantity: 1,
//         })),
//         totalPrice: parseFloat(totalPrice),
//         paymentMethod: 'Card',
//         isPaid: true,
//         paidAt: new Date(),
//         paymentResult: { clientSecret },
//       };

//       const response = await api.createOrder(orderData);
//       if (response.success && response.data) {
//         const createdOrder = response.data;
//         createdOrder.orderItems.forEach((orderItem) => {
//           console.log(`PDF Link for ${orderItem.examName}: ${orderItem.product.pdfLink}`);
//         });

//         setAlertTitle('Order Placed');
//         setAlertMessage(
//           'You have successfully purchased the products in your cart. Check your purchase history for details.'
//         );
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               clearCart();
//               navigation.navigate('PurchaseHistory');
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         throw new Error(response.message || 'Failed to place order.');
//       }
//     } catch (error) {
//       console.error('Checkout Error:', error);
//       setAlertTitle('Checkout Failed');
//       setAlertMessage(error.message || 'An error occurred during checkout.');
//       setAlertIcon('close-circle');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//     }
//     setLoading(false);
//   };

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       {/* Unified Curved Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={[0, 0]}
//         end={[0, 1]}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             Your Cart
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Review your selected items
//           </Text>
//         </View>
//       </LinearGradient>

//       {/* Cart Items List with Footer Component */}
//       <FlatList
//         data={cartItems}
//         keyExtractor={(item) => item._id}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="cart-outline" size={80} color={currentTheme.placeholderTextColor} />
//             <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//               Your cart is empty.
//             </Text>
//           </View>
//         }
//         ListFooterComponent={() =>
//           cartItems.length > 0 ? (
//             <View style={styles.footer}>
//               <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
//                 Total: <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
//               </Text>
//               <TouchableOpacity
//                 style={[
//                   styles.checkoutButton,
//                   { backgroundColor: currentTheme.primaryColor },
//                   loading && styles.disabledButton,
//                 ]}
//                 onPress={handleCheckout}
//                 disabled={loading}
//               >
//                 <Text style={styles.checkoutButtonText}>
//                   {loading ? 'Processing...' : 'Checkout'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : null
//         }
//       />

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

// export default CartPage;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1 },
//   header: {
//     width: '100%',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   backButton: { position: 'absolute', left: 15, top: 10, padding: 8 },
//   headerTitleContainer: { alignItems: 'center' },
//   headerTitle: { fontSize: 22, fontWeight: '700' },
//   headerSubtitle: { fontSize: 14, marginTop: 4 },
//   listContent: { padding: 20, paddingBottom: 140 },
//   emptyContainer: { alignItems: 'center', marginTop: 50 },
//   emptyText: { fontSize: 16, marginTop: 15, textAlign: 'center', paddingHorizontal: 20 },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//   },
//   cartItemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
//   cartItemDetails: { flex: 1 },
//   cartItemName: { fontSize: 16, fontWeight: 'bold' },
//   cartItemSubtitle: { fontSize: 14, marginTop: 2 },
//   cartItemFooter: { flexDirection: 'row', marginTop: 5 },
//   cartItemPrice: { fontSize: 16, fontWeight: 'bold' },
//   footer: {
//     paddingTop: 15,
//     paddingBottom: 15,
//     borderTopWidth: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   totalText: { fontSize: 16, fontWeight: 'bold' },
//   checkoutButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//   },
//   checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
//   disabledButton: { opacity: 0.7 },
// });










// // src/screens/CartPage.js

// import React, { useContext, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useStripe } from '@stripe/stripe-react-native';

// import api, { fetchPaymentIntent } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import CustomAlert from '../components/CustomAlert';

// const { width } = Dimensions.get('window');

// const CartPage = () => {
//   const navigation = useNavigation();

//   // Theme
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Cart
//   const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

//   // Stripe
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();
//   const [loading, setLoading] = useState(false);

//   // Calculate total
//   const totalPrice = cartItems
//     .reduce((sum, item) => sum + parseFloat(item.price), 0)
//     .toFixed(2);

//   // Hide header (we use our custom header below)
//   useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   // CustomAlert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // Render a single cart item
//   const renderItem = ({ item }) => (
//     <View style={[styles.cartItem, { backgroundColor: currentTheme.cardBackground }]}>
//       <Image source={{ uri: item.image }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={[styles.cartItemName, { color: currentTheme.cardTextColor }]}>{item.examName}</Text>
//         <Text style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]}>
//           {item.subjectName} ({item.subjectCode})
//         </Text>
//         <View style={styles.cartItemFooter}>
//           <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>${item.price}</Text>
//         </View>
//       </View>
//       <TouchableOpacity
//         onPress={() => removeFromCart(item._id)}
//         accessibilityLabel={`Remove ${item.examName} from cart`}
//       >
//         <Ionicons name="trash-outline" size={24} color="#E53935" />
//       </TouchableOpacity>
//     </View>
//   );

//   // Checkout handler
//   const handleCheckout = async () => {
//     setLoading(true);
//     if (cartItems.length === 0) {
//       setAlertTitle('Cart Empty');
//       setAlertMessage('Your cart is empty. Add items before checkout.');
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Get Payment Intent
//     const clientSecret = await fetchPaymentIntent(totalPrice);
//     if (!clientSecret) {
//       setLoading(false);
//       return;
//     }

//     // Initialize Payment Sheet
//     const { error: initError } = await initPaymentSheet({
//       paymentIntentClientSecret: clientSecret,
//       merchantDisplayName: 'Your App Name',
//     });
//     if (initError) {
//       console.error('initPaymentSheet Error:', initError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(initError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Present Payment Sheet
//     const { error: paymentError } = await presentPaymentSheet();
//     if (paymentError) {
//       console.error('Payment Error:', paymentError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(paymentError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // If payment succeeds, create order
//     try {
//       const orderData = {
//         orderItems: cartItems.map((item) => ({
//           product: item._id,
//           examName: item.examName,
//           subjectName: item.subjectName,
//           subjectCode: item.subjectCode,
//           price: item.price,
//           image: item.image,
//           quantity: 1,
//         })),
//         totalPrice: parseFloat(totalPrice),
//         paymentMethod: 'Card',
//         isPaid: true,
//         paidAt: new Date(),
//         paymentResult: { clientSecret },
//       };

//       const response = await api.createOrder(orderData);
//       if (response.success && response.data) {
//         const createdOrder = response.data;
//         createdOrder.orderItems.forEach((orderItem) => {
//           console.log(`PDF Link for ${orderItem.examName}: ${orderItem.product.pdfLink}`);
//         });

//         setAlertTitle('Order Placed');
//         setAlertMessage(
//           'You have successfully purchased the products in your cart. Check your purchase history for details.'
//         );
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               clearCart();
//               navigation.navigate('PurchaseHistory');
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         throw new Error(response.message || 'Failed to place order.');
//       }
//     } catch (error) {
//       console.error('Checkout Error:', error);
//       setAlertTitle('Checkout Failed');
//       setAlertMessage(error.message || 'An error occurred during checkout.');
//       setAlertIcon('close-circle');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//     }
//     setLoading(false);
//   };

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />

//       {/* Unified Curved Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={[0, 0]}
//         end={[0, 1]}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             Your Cart
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Review your selected items
//           </Text>
//         </View>
//       </LinearGradient>

//       {/* Cart Items List with Footer Component */}
//       <FlatList
//         data={cartItems}
//         keyExtractor={(item) => item._id}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="cart-outline" size={80} color={currentTheme.placeholderTextColor} />
//             <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//               Your cart is empty.
//             </Text>
//           </View>
//         }
//         ListFooterComponent={() => (
//           <View style={styles.footer}>
//             <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
//               Total: <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
//             </Text>
//             <TouchableOpacity
//               style={[
//                 styles.checkoutButton,
//                 { backgroundColor: currentTheme.primaryColor },
//                 loading && styles.disabledButton,
//               ]}
//               onPress={handleCheckout}
//               disabled={loading}
//             >
//               <Text style={styles.checkoutButtonText}>
//                 {loading ? 'Processing...' : 'Checkout'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />

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

// export default CartPage;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1 },
//   header: {
//     width: '100%',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   backButton: { position: 'absolute', left: 15, top: 10, padding: 8 },
//   headerTitleContainer: { alignItems: 'center' },
//   headerTitle: { fontSize: 22, fontWeight: '700' },
//   headerSubtitle: { fontSize: 14, marginTop: 4 },
//   listContent: { padding: 20, paddingBottom: 140 },
//   emptyContainer: { alignItems: 'center', marginTop: 50 },
//   emptyText: { fontSize: 16, marginTop: 15, textAlign: 'center', paddingHorizontal: 20 },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//   },
//   cartItemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
//   cartItemDetails: { flex: 1 },
//   cartItemName: { fontSize: 16, fontWeight: 'bold' },
//   cartItemSubtitle: { fontSize: 14, marginTop: 2 },
//   cartItemFooter: { flexDirection: 'row', marginTop: 5 },
//   cartItemPrice: { fontSize: 16, fontWeight: 'bold' },
//   footer: {
//     paddingTop: 15,
//     paddingBottom: 15,
//     borderTopWidth: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   totalText: { fontSize: 16, fontWeight: 'bold' },
//   checkoutButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//   },
//   checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
//   disabledButton: { opacity: 0.7 },
// });










// src/screens/CartPage.js

// import React, { useContext, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useStripe } from '@stripe/stripe-react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import api, { fetchPaymentIntent } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import { CartContext } from '../contexts/CartContext';
// import CustomAlert from '../components/CustomAlert';

// const { width } = Dimensions.get('window');

// const CartPage = () => {
//   const navigation = useNavigation();

//   // Theme
//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Cart
//   const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

//   // Stripe
//   const { initPaymentSheet, presentPaymentSheet } = useStripe();
//   const [loading, setLoading] = useState(false);

//   // Calculate total
//   const totalPrice = cartItems
//     .reduce((sum, item) => sum + parseFloat(item.price), 0)
//     .toFixed(2);

//   // Hide header
//   useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   // CustomAlert
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // Render single cart item
//   const renderItem = ({ item }) => (
//     <View
//       style={[styles.cartItem, { backgroundColor: currentTheme.cardBackground }]}
//     >
//       <Image source={{ uri: item.image }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={[styles.cartItemName, { color: currentTheme.cardTextColor }]}>
//           {item.examName}
//         </Text>
//         <Text style={[styles.cartItemSubtitle, { color: currentTheme.textColor }]}>
//           {item.subjectName} ({item.subjectCode})
//         </Text>
//         <View style={styles.cartItemFooter}>
//           <Text style={[styles.cartItemPrice, { color: currentTheme.priceColor }]}>
//             ${item.price}
//           </Text>
//         </View>
//       </View>
//       <TouchableOpacity
//         onPress={() => removeFromCart(item._id)}
//         accessibilityLabel={`Remove ${item.examName} from cart`}
//       >
//         <Ionicons name="trash-outline" size={24} color="#E53935" />
//       </TouchableOpacity>
//     </View>
//   );

//   // Checkout
//   const handleCheckout = async () => {
//     setLoading(true);
//     if (cartItems.length === 0) {
//       setAlertTitle('Cart Empty');
//       setAlertMessage('Your cart is empty. Add items before checkout.');
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Get Payment Intent
//     const clientSecret = await fetchPaymentIntent(totalPrice);
//     if (!clientSecret) {
//       setLoading(false);
//       return;
//     }

//     // Initialize Payment Sheet
//     const { error: initError } = await initPaymentSheet({
//       paymentIntentClientSecret: clientSecret,
//       merchantDisplayName: 'Your App Name',
//     });
//     if (initError) {
//       console.error('initPaymentSheet Error:', initError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(initError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // Present Payment Sheet
//     const { error: paymentError } = await presentPaymentSheet();
//     if (paymentError) {
//       console.error('Payment Error:', paymentError);
//       setAlertTitle('Payment Failed');
//       setAlertMessage(paymentError.message);
//       setAlertIcon('cart-outline');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//       setLoading(false);
//       return;
//     }

//     // If payment success, create order
//     try {
//       const orderData = {
//         orderItems: cartItems.map((item) => ({
//           product: item._id,
//           examName: item.examName,
//           subjectName: item.subjectName,
//           subjectCode: item.subjectCode,
//           price: item.price,
//           image: item.image,
//           quantity: 1,
//         })),
//         totalPrice: parseFloat(totalPrice),
//         paymentMethod: 'Card',
//         isPaid: true,
//         paidAt: new Date(),
//         paymentResult: { clientSecret },
//       };

//       const response = await api.createOrder(orderData);
//       if (response.success && response.data) {
//         // Access pdf links if needed
//         const createdOrder = response.data;
//         createdOrder.orderItems.forEach((orderItem) => {
//           console.log(`PDF Link for ${orderItem.examName}: ${orderItem.product.pdfLink}`);
//         });

//         setAlertTitle('Order Placed');
//         setAlertMessage(
//           'You have successfully purchased the products in your cart. Check your purchase history for details.'
//         );
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               clearCart();
//               navigation.navigate('PurchaseHistory');
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         throw new Error(response.message || 'Failed to place order.');
//       }
//     } catch (error) {
//       console.error('Checkout Error:', error);
//       setAlertTitle('Checkout Failed');
//       setAlertMessage(error.message || 'An error occurred during checkout.');
//       setAlertIcon('close-circle');
//       setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//       setAlertVisible(true);
//     }
//     setLoading(false);
//   };

//   return (
//     <SafeAreaView
//       style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}
//     >
//       <StatusBar
//         backgroundColor={currentTheme.headerBackground[1]}
//         barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
//       />
//       {/* Header */}
//       <LinearGradient
//         colors={currentTheme.headerBackground}
//         style={styles.header}
//         start={[0, 0]}
//         end={[0, 1]}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityLabel="Go Back"
//         >
//           <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={[styles.headerTitle, { color: currentTheme.headerTextColor }]}>
//             Your Cart
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: currentTheme.headerTextColor }]}>
//             Review your selected items
//           </Text>
//         </View>
//       </LinearGradient>

//       {/* Cart Items */}
//       <FlatList
//         data={cartItems}
//         keyExtractor={(item) => item._id}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons
//               name="cart-outline"
//               size={80}
//               color={currentTheme.placeholderTextColor}
//             />
//             <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
//               Your cart is empty.
//             </Text>
//           </View>
//         }
//       />

//       {/* Footer (Total + Checkout) */}
//       {cartItems.length > 0 && (
//         <View style={[styles.footer, { borderTopColor: currentTheme.borderColor, backgroundColor: currentTheme.cardBackground }]}>
//           <Text style={[styles.totalText, { color: currentTheme.textColor }]}>
//             Total:{' '}
//             <Text style={{ color: currentTheme.priceColor }}>${totalPrice}</Text>
//           </Text>
//           <TouchableOpacity
//             style={[
//               styles.checkoutButton,
//               { backgroundColor: currentTheme.primaryColor },
//               loading && styles.disabledButton,
//             ]}
//             onPress={handleCheckout}
//             disabled={loading}
//           >
//             <Text style={styles.checkoutButtonText}>
//               {loading ? 'Processing...' : 'Checkout'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* CustomAlert */}
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

// export default CartPage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     width: '100%',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: 10,
//     padding: 8,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   listContent: {
//     padding: 20,
//     paddingBottom: 80,
//   },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//   },
//   cartItemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   cartItemDetails: {
//     flex: 1,
//   },
//   cartItemName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   cartItemSubtitle: {
//     fontSize: 14,
//     marginTop: 2,
//   },
//   cartItemFooter: {
//     flexDirection: 'row',
//     marginTop: 5,
//   },
//   cartItemPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     padding: 15,
//     borderTopWidth: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   totalText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkoutButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//   },
//   checkoutButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     marginTop: 50,
//   },
//   emptyText: {
//     fontSize: 16,
//     marginTop: 15,
//     textAlign: 'center',
//     paddingHorizontal: 20,
//   },
// });
