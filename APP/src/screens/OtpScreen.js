// src/screens/OtpScreen.js

import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import CustomAlert from '../components/CustomAlert';
import LegalLinksPopup from '../components/LegalLinksPopup';

// NEW: Reusable brand component and Redux imports
import AppBrandName from '../components/AppBrandName';
import { useDispatch } from 'react-redux';
import { verifyOtpThunk } from '../store/slices/authSlice';

const useCountdown = (initialValue) => {
  const [count, setCount] = useState(initialValue);
  useEffect(() => {
    if (count <= 0) return;
    const interval = setInterval(() => setCount((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [count]);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  return [count, reset];
};

const OtpScreen = () => {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;

  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIcon, setAlertIcon] = useState('');
  const [alertButtons, setAlertButtons] = useState([]);

  // For the shake animation on error
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  // Timer (60s)
  const [timer, resetTimer] = useCountdown(60);

  // Shake animation on error
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Auto-verify on last digit
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      handleVerifyOtp(otpString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // NEW: Redux dispatcher
  const dispatch = useDispatch();

  const handleVerifyOtp = async (otpStringParam) => {
    const otpString = otpStringParam || otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      triggerShake();
      Vibration.vibrate(500);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use Redux thunk for OTP verification
      await dispatch(verifyOtpThunk({ email, otp: otpString })).unwrap();
      setLoading(false);
      setAlertTitle('Success');
      setAlertMessage('OTP verified successfully!');
      setAlertIcon('checkmark-circle');
      setAlertButtons([
        {
          text: 'OK',
          onPress: () => {
            setAlertVisible(false);
            navigation.navigate('NewPassword', { email });
          },
        },
      ]);
      setAlertVisible(true);
    } catch (err) {
      setLoading(false);
      setError('Invalid OTP. Please try again.');
      triggerShake();
      Vibration.vibrate(500);
      console.error('OTP Verification Error:', err);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    try {
      // Here we still call the forgotPassword API (or you may dispatch forgotPwd if desired)
      const response = await forgotPassword(email);
      setLoading(false);
      if (response) {
        setAlertTitle('Success');
        setAlertMessage('A new OTP has been sent to your email.');
        setAlertIcon('mail');
        setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
        setAlertVisible(true);
        resetTimer();
        setOtp(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        setError('Failed to resend OTP. Please try again later.');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
      console.error('Resend OTP Error:', err);
    }
  };

  const handleChange = (value, index) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const getOtpInputSize = () => (width >= 400 ? 50 : width >= 375 ? 45 : 40);
  const getOtpInputGap = () => (width >= 400 ? 15 : width >= 375 ? 12 : 8);

  return (
    <LinearGradient
      colors={
        theme === 'light'
          ? ['#f7efff', '#e0c3fc']
          : ['#0f0c29', '#302b63']
      }
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
          <AppBrandName
            brandName="Ai-Nsider"
            primaryColor={currentTheme.primaryColor}
            textColor={currentTheme.textColor}
          />
          <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>
            OTP Verification
          </Text>

          <Text style={[styles.instructions, { color: currentTheme.textColor }]}>
            Please enter the 6-digit code sent to your email.
          </Text>

          <View style={[styles.otpContainer, { gap: getOtpInputGap() }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                value={digit}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                style={[
                  styles.otpInput,
                  {
                    borderColor: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    width: getOtpInputSize(),
                    height: getOtpInputSize(),
                    fontSize: getOtpInputSize() - 10,
                    color: currentTheme.textColor,
                  },
                ]}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="•"
                placeholderTextColor={currentTheme.placeholderTextColor}
                returnKeyType="done"
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentTheme.primaryColor }]}
              onPress={() => handleVerifyOtp()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>VERIFY OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: currentTheme.textColor }]}>
              {timer > 0 ? `Resend OTP in ${timer}s` : 'You can resend the OTP now.'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleResendOtp}
            style={[styles.resendButton, { opacity: timer === 0 ? 1 : 0.6 }]}
            disabled={timer !== 0 || loading}
          >
            <Text style={[styles.resendText, { color: currentTheme.secondaryColor }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <LegalLinksPopup
              staticContent="<p>Your legal content goes here. Replace this with actual content.</p>"
              themeStyles={{
                cardBackground: currentTheme.cardBackground,
                textColor: currentTheme.textColor,
                primaryColor: currentTheme.primaryColor,
              }}
              headerBackground={[currentTheme.primaryColor, currentTheme.secondaryColor]}
              textStyle={{ color: currentTheme.secondaryColor }}
            />
          </View>

          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            icon={alertIcon}
            onClose={() => setAlertVisible(false)}
            buttons={alertButtons}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
    maxWidth: 400,
    marginBottom: 15,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.1,
  },
  timerContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 14,
  },
  resendButton: {
    marginBottom: 20,
  },
  resendText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});








// // src/screens/OtpScreen.js

// import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Vibration,
//   useWindowDimensions,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// import { verifyOtp, forgotPassword } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import CustomAlert from '../components/CustomAlert';
// import LegalLinksPopup from '../components/LegalLinksPopup';

// // NEW: Reusable brand-name component
// import AppBrandName from '../components/AppBrandName';

// const useCountdown = (initialValue) => {
//   const [count, setCount] = useState(initialValue);
//   useEffect(() => {
//     if (count <= 0) return;
//     const interval = setInterval(() => setCount((prev) => prev - 1), 1000);
//     return () => clearInterval(interval);
//   }, [count]);
//   const reset = useCallback(() => setCount(initialValue), [initialValue]);
//   return [count, reset];
// };

// const OtpScreen = () => {
//   const [otp, setOtp] = useState(Array(6).fill(''));
//   const inputRefs = useRef([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const navigation = useNavigation();
//   const route = useRoute();
//   const { email } = route.params;

//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // For the shake animation on error
//   const shakeAnim = useRef(new Animated.Value(0)).current;
//   const { width } = useWindowDimensions();

//   // Timer (60s)
//   const [timer, resetTimer] = useCountdown(60);

//   // Shake animation on error
//   const triggerShake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   // Auto-verify on last digit
//   useEffect(() => {
//     const otpString = otp.join('');
//     if (otpString.length === 6) {
//       handleVerifyOtp(otpString);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [otp]);

//   const handleVerifyOtp = async (otpStringParam) => {
//     const otpString = otpStringParam || otp.join('');
//     if (otpString.length < 6) {
//       setError('Please enter all 6 digits of the OTP.');
//       triggerShake();
//       Vibration.vibrate(500);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const response = await verifyOtp(email, otpString);
//       setLoading(false);
//       if (response.success) {
//         setAlertTitle('Success');
//         setAlertMessage('OTP verified successfully!');
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               navigation.navigate('NewPassword', { email });
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         setError('Invalid OTP. Please try again.');
//         triggerShake();
//         Vibration.vibrate(500);
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       triggerShake();
//       Vibration.vibrate(500);
//       console.error('OTP Verification Error:', err);
//     }
//   };

//   const handleResendOtp = async () => {
//     if (timer > 0) return;
//     setLoading(true);
//     setError('');
//     try {
//       const response = await forgotPassword(email);
//       setLoading(false);
//       if (response) {
//         setAlertTitle('Success');
//         setAlertMessage('A new OTP has been sent to your email.');
//         setAlertIcon('mail');
//         setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//         setAlertVisible(true);
//         resetTimer();
//         setOtp(Array(6).fill(''));
//         inputRefs.current[0]?.focus();
//       } else {
//         setError('Failed to resend OTP. Please try again later.');
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       console.error('Resend OTP Error:', err);
//     }
//   };

//   const handleChange = (value, index) => {
//     if (/^\d*$/.test(value) && value.length <= 1) {
//       const newOtp = [...otp];
//       newOtp[index] = value;
//       setOtp(newOtp);
//       if (value && index < otp.length - 1) {
//         inputRefs.current[index + 1]?.focus();
//       }
//     }
//   };

//   const handleKeyPress = (e, index) => {
//     if (e.nativeEvent.key === 'Backspace') {
//       const newOtp = [...otp];
//       newOtp[index] = '';
//       setOtp(newOtp);
//       if (index > 0) {
//         inputRefs.current[index - 1]?.focus();
//       }
//     }
//   };

//   const getOtpInputSize = () => (width >= 400 ? 50 : width >= 375 ? 45 : 40);
//   const getOtpInputGap = () => (width >= 400 ? 15 : width >= 375 ? 12 : 8);

//   return (
//     <LinearGradient
//       colors={
//         theme === 'light'
//           ? ['#f7efff', '#e0c3fc']
//           : ['#0f0c29', '#302b63']
//       }
//       style={styles.background}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.overlay}
//       >
//         {/* Entire container with shake effect */}
//         <Animated.View
//           style={[
//             styles.container,
//             { transform: [{ translateX: shakeAnim }] },
//           ]}
//         >
//           {/* Reusable brand name + subtitle */}
//           <AppBrandName
//             brandName="Ai-Nsider"
//             primaryColor={currentTheme.primaryColor}
//             textColor={currentTheme.textColor}
//           />
//           <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>
//             OTP Verification
//           </Text>

//           <Text style={[styles.instructions, { color: currentTheme.textColor }]}>
//             Please enter the 6-digit code sent to your email.
//           </Text>

//           <View style={[styles.otpContainer, { gap: getOtpInputGap() }]}>
//             {otp.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={(ref) => (inputRefs.current[index] = ref)}
//                 value={digit}
//                 onChangeText={(value) => handleChange(value, index)}
//                 onKeyPress={(e) => handleKeyPress(e, index)}
//                 style={[
//                   styles.otpInput,
//                   {
//                     borderColor: '#FFFFFF',
//                     backgroundColor: 'rgba(255,255,255,0.2)',
//                     width: getOtpInputSize(),
//                     height: getOtpInputSize(),
//                     fontSize: getOtpInputSize() - 10,
//                     color: currentTheme.textColor,
//                   },
//                 ]}
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 placeholder="•"
//                 placeholderTextColor={currentTheme.placeholderTextColor}
//                 returnKeyType="done"
//                 textContentType="oneTimeCode"
//               />
//             ))}
//           </View>

//           {error ? <Text style={styles.errorText}>{error}</Text> : null}

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[
//                 styles.button,
//                 { backgroundColor: currentTheme.primaryColor },
//               ]}
//               onPress={() => handleVerifyOtp()}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#FFFFFF" />
//               ) : (
//                 <Text style={styles.buttonText}>VERIFY OTP</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           <View style={styles.timerContainer}>
//             <Text style={[styles.timerText, { color: currentTheme.textColor }]}>
//               {timer > 0 ? `Resend OTP in ${timer}s` : 'You can resend the OTP now.'}
//             </Text>
//           </View>

//           <TouchableOpacity
//             onPress={handleResendOtp}
//             style={[styles.resendButton, { opacity: timer === 0 ? 1 : 0.6 }]}
//             disabled={timer !== 0 || loading}
//           >
//             <Text style={[styles.resendText, { color: currentTheme.secondaryColor }]}>
//               Resend OTP
//             </Text>
//           </TouchableOpacity>

//           <View style={styles.legalContainer}>
//             <LegalLinksPopup
//               staticContent="<p>Your legal content goes here. Replace this with actual content.</p>"
//               themeStyles={{
//                 cardBackground: currentTheme.cardBackground,
//                 textColor: currentTheme.textColor,
//                 primaryColor: currentTheme.primaryColor,
//               }}
//               headerBackground={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               textStyle={{ color: currentTheme.secondaryColor }}
//             />
//           </View>

//           <CustomAlert
//             visible={alertVisible}
//             title={alertTitle}
//             message={alertMessage}
//             icon={alertIcon}
//             onClose={() => setAlertVisible(false)}
//             buttons={alertButtons}
//           />
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// };

// export default OtpScreen;

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   container: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   subtitle: {
//     fontSize: 18,
//     marginBottom: 5,
//     fontWeight: '600',
//   },
//   instructions: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     paddingHorizontal: 10,
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     width: '80%',
//     maxWidth: 400,
//     marginBottom: 15,
//   },
//   otpInput: {
//     borderWidth: 1,
//     borderRadius: 10,
//     textAlign: 'center',
//   },
//   errorText: {
//     color: '#E53935',
//     fontSize: 14,
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     width: '80%',
//     marginTop: 10,
//   },
//   button: {
//     width: '100%',
//     paddingVertical: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//     elevation: 3,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 1.1,
//   },
//   timerContainer: {
//     marginTop: 15,
//     marginBottom: 10,
//   },
//   timerText: {
//     fontSize: 14,
//   },
//   resendButton: {
//     marginBottom: 20,
//   },
//   resendText: {
//     fontSize: 16,
//     textDecorationLine: 'underline',
//   },
//   legalContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//   },
// });






// // src/screens/OtpScreen.js

// import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Vibration,
//   useWindowDimensions,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// import { verifyOtp, forgotPassword } from '../services/api';
// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import CustomAlert from '../components/CustomAlert';
// import LegalLinksPopup from '../components/LegalLinksPopup';

// const useCountdown = (initialValue) => {
//   const [count, setCount] = useState(initialValue);
//   useEffect(() => {
//     if (count <= 0) return;
//     const interval = setInterval(() => setCount((prev) => prev - 1), 1000);
//     return () => clearInterval(interval);
//   }, [count]);
//   const reset = useCallback(() => setCount(initialValue), [initialValue]);
//   return [count, reset];
// };

// const OtpScreen = () => {
//   const [otp, setOtp] = useState(Array(6).fill(''));
//   const inputRefs = useRef([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const navigation = useNavigation();
//   const route = useRoute();
//   const { email } = route.params;

//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // Animations
//   const iconOpacity = useRef(new Animated.Value(0)).current;
//   const iconTranslateY = useRef(new Animated.Value(-50)).current;
//   const shakeAnim = useRef(new Animated.Value(0)).current;
//   const { width } = useWindowDimensions();

//   // Timer
//   const [timer, resetTimer] = useCountdown(60);

//   // Entrance animations
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(iconOpacity, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.spring(iconTranslateY, {
//         toValue: 0,
//         friction: 5,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [iconOpacity, iconTranslateY]);

//   // Shake animation on error
//   const triggerShake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   useEffect(() => {
//     const otpString = otp.join('');
//     if (otpString.length === 6) {
//       handleVerifyOtp(otpString);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [otp]);

//   const handleVerifyOtp = async (otpStringParam) => {
//     const otpString = otpStringParam || otp.join('');
//     if (otpString.length < 6) {
//       setError('Please enter all 6 digits of the OTP.');
//       triggerShake();
//       Vibration.vibrate(500);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const response = await verifyOtp(email, otpString);
//       setLoading(false);
//       if (response.success) {
//         setAlertTitle('Success');
//         setAlertMessage('OTP verified successfully!');
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               navigation.navigate('NewPassword', { email });
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         setError('Invalid OTP. Please try again.');
//         triggerShake();
//         Vibration.vibrate(500);
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       triggerShake();
//       Vibration.vibrate(500);
//       console.error('OTP Verification Error:', err);
//     }
//   };

//   const handleResendOtp = async () => {
//     if (timer > 0) return;
//     setLoading(true);
//     setError('');
//     try {
//       const response = await forgotPassword(email);
//       setLoading(false);
//       if (response) {
//         setAlertTitle('Success');
//         setAlertMessage('A new OTP has been sent to your email.');
//         setAlertIcon('mail');
//         setAlertButtons([{ text: 'OK', onPress: () => setAlertVisible(false) }]);
//         setAlertVisible(true);
//         resetTimer();
//         setOtp(Array(6).fill(''));
//         inputRefs.current[0]?.focus();
//       } else {
//         setError('Failed to resend OTP. Please try again later.');
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       console.error('Resend OTP Error:', err);
//     }
//   };

//   const handleChange = (value, index) => {
//     if (/^\d*$/.test(value) && value.length <= 1) {
//       const newOtp = [...otp];
//       newOtp[index] = value;
//       setOtp(newOtp);
//       if (value && index < otp.length - 1) {
//         inputRefs.current[index + 1]?.focus();
//       }
//     }
//   };

//   const handleKeyPress = (e, index) => {
//     if (e.nativeEvent.key === 'Backspace') {
//       const newOtp = [...otp];
//       newOtp[index] = '';
//       setOtp(newOtp);
//       if (index > 0) {
//         inputRefs.current[index - 1]?.focus();
//       }
//     }
//   };

//   const getOtpInputSize = () => (width >= 400 ? 50 : width >= 375 ? 45 : 40);
//   const getOtpInputGap = () => (width >= 400 ? 15 : width >= 375 ? 12 : 8);

//   return (
//     <LinearGradient
//       colors={
//         theme === 'light'
//           ? ['#f7efff', '#e0c3fc']
//           : ['#0f0c29', '#302b63']
//       }
//       style={styles.background}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.overlay}
//       >
//         <Animated.View
//           style={[
//             styles.container,
//             { transform: [{ translateX: shakeAnim }] },
//           ]}
//         >
//           <Animated.View
//             style={{
//               opacity: iconOpacity,
//               transform: [{ translateY: iconTranslateY }],
//               alignItems: 'center',
//               marginBottom: 30,
//             }}
//           >
//             <Text style={[styles.brandTitle, { color: currentTheme.primaryColor }]}>
//               Ai-Nsider
//             </Text>
//             <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>
//               OTP Verification
//             </Text>
//           </Animated.View>

//           <Text style={[styles.instructions, { color: currentTheme.textColor }]}>
//             Please enter the 6-digit code sent to your email.
//           </Text>

//           <View style={[styles.otpContainer, { gap: getOtpInputGap() }]}>
//             {otp.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={(ref) => (inputRefs.current[index] = ref)}
//                 value={digit}
//                 onChangeText={(value) => handleChange(value, index)}
//                 onKeyPress={(e) => handleKeyPress(e, index)}
//                 style={[
//                   styles.otpInput,
//                   {
//                     borderColor: '#FFFFFF',
//                     backgroundColor: 'rgba(255,255,255,0.2)',
//                     width: getOtpInputSize(),
//                     height: getOtpInputSize(),
//                     fontSize: getOtpInputSize() - 10,
//                     color: currentTheme.textColor,
//                   },
//                 ]}
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 placeholder="•"
//                 placeholderTextColor={currentTheme.placeholderTextColor}
//                 returnKeyType="done"
//                 accessibilityLabel={`OTP Digit ${index + 1}`}
//                 textContentType="oneTimeCode"
//               />
//             ))}
//           </View>

//           {error ? <Text style={styles.errorText}>{error}</Text> : null}

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[
//                 styles.button,
//                 { backgroundColor: currentTheme.primaryColor },
//               ]}
//               onPress={() => handleVerifyOtp()}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#FFFFFF" />
//               ) : (
//                 <Text style={styles.buttonText}>VERIFY OTP</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           <View style={styles.timerContainer}>
//             <Text style={[styles.timerText, { color: currentTheme.textColor }]}>
//               {timer > 0 ? `Resend OTP in ${timer}s` : 'You can resend the OTP now.'}
//             </Text>
//           </View>

//           <TouchableOpacity
//             onPress={handleResendOtp}
//             style={[styles.resendButton, { opacity: timer === 0 ? 1 : 0.6 }]}
//             disabled={timer !== 0 || loading}
//           >
//             <Text style={[styles.resendText, { color: currentTheme.secondaryColor }]}>
//               Resend OTP
//             </Text>
//           </TouchableOpacity>

//           <View style={styles.legalContainer}>
//             <LegalLinksPopup
//               staticContent="<p>Your legal content goes here. Replace this with actual content.</p>"
//               themeStyles={{
//                 cardBackground: currentTheme.cardBackground,
//                 textColor: currentTheme.textColor,
//                 primaryColor: currentTheme.primaryColor,
//               }}
//               headerBackground={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               textStyle={{ color: currentTheme.secondaryColor }}
//             />
//           </View>

//           <CustomAlert
//             visible={alertVisible}
//             title={alertTitle}
//             message={alertMessage}
//             icon={alertIcon}
//             onClose={() => setAlertVisible(false)}
//             buttons={alertButtons}
//           />
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// };

// export default OtpScreen;

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   container: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   brandTitle: {
//     fontSize: 36,
//     fontWeight: '900',
//     textTransform: 'uppercase',
//     letterSpacing: 1.2,
//   },
//   subtitle: {
//     fontSize: 18,
//     marginTop: 5,
//     fontWeight: '600',
//   },
//   instructions: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     paddingHorizontal: 10,
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     width: '80%',
//     maxWidth: 400,
//     marginBottom: 15,
//   },
//   otpInput: {
//     borderWidth: 1,
//     borderRadius: 10,
//     textAlign: 'center',
//     // elevation: 5,
//   },
//   errorText: {
//     color: '#E53935',
//     fontSize: 14,
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     width: '80%',
//     marginTop: 10,
//   },
//   button: {
//     width: '100%',
//     paddingVertical: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//     elevation: 3,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 1.1,
//   },
//   timerContainer: {
//     marginTop: 15,
//     marginBottom: 10,
//   },
//   timerText: {
//     fontSize: 14,
//   },
//   resendButton: {
//     marginBottom: 20,
//   },
//   resendText: {
//     fontSize: 16,
//     textDecorationLine: 'underline',
//   },
//   legalContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//   },
// });









// // src/screens/OtpScreen.js
// import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Vibration,
//   useWindowDimensions,
// } from 'react-native';
// import { verifyOtp, forgotPassword } from '../services/api';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// import { ThemeContext } from '../../ThemeContext';
// import { lightTheme, darkTheme } from '../../themes';
// import CustomAlert from '../components/CustomAlert';
// import LegalLinksPopup from '../components/LegalLinksPopup';

// // Custom hook for countdown timer
// const useCountdown = (initialValue) => {
//   const [count, setCount] = useState(initialValue);
//   useEffect(() => {
//     if (count <= 0) return;
//     const interval = setInterval(() => {
//       setCount((prev) => prev - 1);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [count]);
//   const reset = useCallback(() => setCount(initialValue), [initialValue]);
//   return [count, reset];
// };

// const OtpScreen = () => {
//   const [otp, setOtp] = useState(Array(6).fill(''));
//   const inputRefs = useRef([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { email } = route.params;

//   const { theme } = useContext(ThemeContext);
//   const currentTheme = theme === 'light' ? lightTheme : darkTheme;

//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertIcon, setAlertIcon] = useState('');
//   const [alertButtons, setAlertButtons] = useState([]);

//   // Animations
//   const iconOpacity = useRef(new Animated.Value(0)).current;
//   const iconTranslateY = useRef(new Animated.Value(-50)).current;
//   const shakeAnim = useRef(new Animated.Value(0)).current;
//   const { width } = useWindowDimensions();

//   // Timer using custom hook
//   const [timer, resetTimer] = useCountdown(60);

//   // Start entrance animations
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(iconOpacity, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.spring(iconTranslateY, {
//         toValue: 0,
//         friction: 5,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [iconOpacity, iconTranslateY]);

//   // Trigger shake animation on error
//   const triggerShake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   // Auto-verify OTP if all digits are entered
//   useEffect(() => {
//     const otpString = otp.join('');
//     if (otpString.length === 6) {
//       handleVerifyOtp(otpString);
//     }
//   }, [otp]);

//   const handleVerifyOtp = async (otpStringParam) => {
//     const otpString = otpStringParam || otp.join('');
//     if (otpString.length < 6) {
//       setError('Please enter all 6 digits of the OTP.');
//       triggerShake();
//       Vibration.vibrate(500);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const response = await verifyOtp(email, otpString);
//       setLoading(false);
//       if (response.success) {
//         // Show success alert then navigate
//         setAlertTitle('Success');
//         setAlertMessage('OTP verified successfully!');
//         setAlertIcon('checkmark-circle');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => {
//               setAlertVisible(false);
//               navigation.navigate('NewPassword', { email });
//             },
//           },
//         ]);
//         setAlertVisible(true);
//       } else {
//         setError('Invalid OTP. Please try again.');
//         triggerShake();
//         Vibration.vibrate(500);
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       triggerShake();
//       Vibration.vibrate(500);
//       console.error('OTP Verification Error:', err);
//     }
//   };

//   const handleResendOtp = async () => {
//     if (timer > 0) return; // prevent resending until timer expires
//     setLoading(true);
//     setError('');
//     try {
//       const response = await forgotPassword(email);
//       setLoading(false);
//       if (response) {
//         setAlertTitle('Success');
//         setAlertMessage('A new OTP has been sent to your email.');
//         setAlertIcon('mail');
//         setAlertButtons([
//           {
//             text: 'OK',
//             onPress: () => setAlertVisible(false),
//           },
//         ]);
//         setAlertVisible(true);
//         resetTimer();
//         setOtp(Array(6).fill(''));
//         inputRefs.current[0]?.focus();
//       } else {
//         setError('Failed to resend OTP. Please try again later.');
//       }
//     } catch (err) {
//       setLoading(false);
//       setError('An error occurred. Please try again.');
//       console.error('Resend OTP Error:', err);
//     }
//   };

//   const handleChange = (value, index) => {
//     if (/^\d*$/.test(value) && value.length <= 1) {
//       const newOtp = [...otp];
//       newOtp[index] = value;
//       setOtp(newOtp);
//       if (value && index < otp.length - 1) {
//         inputRefs.current[index + 1]?.focus();
//       }
//     }
//   };

//   const handleKeyPress = (e, index) => {
//     if (e.nativeEvent.key === 'Backspace') {
//       const newOtp = [...otp];
//       newOtp[index] = '';
//       setOtp(newOtp);
//       if (index > 0) {
//         inputRefs.current[index - 1]?.focus();
//       }
//     }
//   };

//   // Responsive OTP input size and gap
//   const getOtpInputSize = () => (width >= 400 ? 50 : width >= 375 ? 45 : 40);
//   const getOtpInputGap = () => (width >= 400 ? 15 : width >= 375 ? 12 : 8);

//   return (
//     <LinearGradient
//       colors={theme === 'light' ? ['#ffffff', '#e6f7ff'] : ['#121212', '#1f1f1f']}
//       style={styles.background}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.overlay}
//       >
//         <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
//           <Animated.View style={{ opacity: iconOpacity, transform: [{ translateY: iconTranslateY }], alignItems: 'center', marginBottom: 20 }}>
//             <Ionicons
//               name="checkmark-done-circle-outline"
//               size={getOtpInputSize() + 20}
//               color={currentTheme.primaryColor}
//             />
//             <Text style={[styles.title, { color: currentTheme.textColor }]}>Verify OTP</Text>
//           </Animated.View>
//           <Text style={[styles.instructions, { color: currentTheme.textColor }]}>
//             Please enter the OTP sent to your email.
//           </Text>
//           <View style={[styles.otpContainer, { gap: getOtpInputGap() }]}>
//             {otp.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={(ref) => (inputRefs.current[index] = ref)}
//                 value={digit}
//                 onChangeText={(value) => handleChange(value, index)}
//                 onKeyPress={(e) => handleKeyPress(e, index)}
//                 style={[
//                   styles.otpInput,
//                   {
//                     borderColor: error ? '#E53935' : currentTheme.primaryColor,
//                     color: currentTheme.textColor,
//                     backgroundColor: currentTheme.inputBackground,
//                     width: getOtpInputSize(),
//                     height: getOtpInputSize(),
//                     fontSize: getOtpInputSize() - 10,
//                   },
//                 ]}
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 placeholder="•"
//                 placeholderTextColor={currentTheme.placeholderTextColor}
//                 returnKeyType="done"
//                 accessibilityLabel={`OTP Digit ${index + 1}`}
//                 textContentType="oneTimeCode"
//               />
//             ))}
//           </View>
//           {error ? <Text style={styles.errorText}>{error}</Text> : null}
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: currentTheme.primaryColor }, loading && styles.buttonLoading]}
//               onPress={() => handleVerifyOtp()}
//               disabled={loading}
//               accessibilityLabel="Verify OTP Button"
//             >
//               {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>VERIFY OTP</Text>}
//             </TouchableOpacity>
//           </View>
//           <View style={styles.timerContainer}>
//             <Text style={[styles.timerText, { color: currentTheme.textColor }]}>
//               {timer > 0 ? `Resend OTP in ${timer}s` : 'You can resend the OTP now.'}
//             </Text>
//           </View>
//           <TouchableOpacity
//             onPress={handleResendOtp}
//             style={[styles.resendButton, { opacity: timer === 0 ? 1 : 0.6 }]}
//             disabled={timer !== 0 || loading}
//             accessibilityLabel="Resend OTP Button"
//           >
//             <Text style={[styles.resendText, { color: currentTheme.secondaryColor }]}>Resend OTP</Text>
//           </TouchableOpacity>

//           <View style={styles.legalContainer}>
//             <LegalLinksPopup
//               // fetchContent={null} // or your fetch function
//               staticContent="<p>Your legal content goes here. Replace this with actual content.</p>"
//               themeStyles={{
//                 cardBackground: currentTheme.cardBackground,
//                 textColor: currentTheme.textColor,
//                 primaryColor: currentTheme.primaryColor,
//               }}
//               headerBackground={[currentTheme.primaryColor, currentTheme.secondaryColor]}
//               textStyle={{ color: currentTheme.placeholderTextColor }}
//             />
//           </View>

//           {/* CustomAlert Component */}
//           <CustomAlert
//             visible={alertVisible}
//             title={alertTitle}
//             message={alertMessage}
//             icon={alertIcon}
//             onClose={() => setAlertVisible(false)}
//             buttons={alertButtons}
//           />
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   container: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginTop: 10,
//   },
//   instructions: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     paddingHorizontal: 10,
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     width: '80%',
//     maxWidth: 400,
//     marginBottom: 10,
//   },
//   otpInput: {
//     borderWidth: 1,
//     borderRadius: 10,
//     textAlign: 'center',
//     shadowColor: '#fff',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 0.41,
//     elevation: 1,
//   },
//   errorText: {
//     color: '#E53935',
//     fontSize: 14,
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     width: '100%',
//     marginTop: 10,
//   },
//   button: {
//     width: '100%',
//     paddingVertical: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   buttonLoading: {
//     backgroundColor: '#388E3C',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   timerContainer: {
//     marginTop: 10,
//     marginBottom: 10,
//   },
//   timerText: {
//     fontSize: 14,
//   },
//   resendButton: {
//     marginTop: 10,
//   },
//   resendText: {
//     fontSize: 16,
//     textDecorationLine: 'underline',
//   },
//   legalContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 20,
//   },
// });

// export default OtpScreen;

