// src/components/AppBrandName.js
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

// Replace with your Lottie brand animation file:
import brandAnimation from '../../assets/applogo.json';

const AppBrandName = ({
  brandName = 'Ai-Nsider',
  primaryColor = '#6C63FF',
  // You can pass textColor if you need it, though we’re mostly
  // animating color now via interpolation
  textColor = '#333',
  style,
}) => {
  // 1) Fade in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // 2) Scale from small to normal
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  // 3) Rotate from 0 to 1 => 0deg to 360deg
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // 4) Translate text from below
  const translateY = useRef(new Animated.Value(50)).current;
  // 5) Interpolate color from #999 to primaryColor
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // A short delay before the text blasts in
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false, // color interpolation doesn’t use native driver
        }),
      ]),
    ]).start();
  }, [fadeAnim, scaleAnim, rotateAnim, translateY, colorAnim]);

  // Rotate interpolation => 0 -> 360 deg
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Color interpolation => #999 -> primaryColor
  const colorInterpolate = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#999', primaryColor],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Big fancy Lottie behind/above the brand title */}
      <View style={styles.lottieWrapper}>
        <LottieView
          source={brandAnimation}
          autoPlay
          loop
          style={styles.lottieStyle}
        />
      </View>

      {/* Dramatic, multi-step animated brand text */}
      <Animated.View
        style={[
          styles.textWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
              { translateY },
            ],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.brandTitle,
            {
              color: colorInterpolate,
            },
          ]}
        >
          {brandName}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

export default AppBrandName;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  lottieWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -60,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieStyle: {
    width: 200,
    height: 200,
  },
  textWrapper: {
    marginTop: 80,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
