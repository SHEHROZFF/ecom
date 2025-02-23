// src/components/AdCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { templateStyles } from './templateStyles';

const animationMapping = {
  basic: 'fadeIn',
  modern: 'slideInRight',
  minimal: 'zoomIn',
  detailed: 'flipInY',
};

const AdCard = ({ onPress, currentTheme, adData }) => {
  const { image, title = 'Check out this ad!', subtitle = '', category = 'General', cardDesign = 'basic', templateId, customStyles } = adData || {};
  const baseStyle = templateStyles[templateId] || templateStyles.newCourse;
  const mergedStyle = { ...baseStyle, ...customStyles };
  const animationType = animationMapping[cardDesign] || animationMapping.basic;

  return (
    <Animatable.View animation={animationType} duration={800} style={[styles.adContainer, { width: mergedStyle.cardWidth, height: mergedStyle.cardHeight }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
        <ImageBackground source={{ uri: image || mergedStyle.defaultImage }} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={mergedStyle.gradientColors} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.gradientOverlay}>
            <View style={styles.textContainer}>
              <Text style={[styles.adTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
              {subtitle ? <Text style={[styles.adSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text> : null}
            </View>
            <View style={[styles.badge, { backgroundColor: mergedStyle.badgeColor }]}>
              <Text style={styles.badgeText}>{category}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginVertical: 10,
  },
  touchable: { flex: 1 },
  imageBackground: { flex: 1, justifyContent: 'flex-end' },
  imageStyle: { resizeMode: 'cover' },
  gradientOverlay: { flex: 1, justifyContent: 'flex-end', padding: 15 },
  textContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10, marginBottom: 20 },
  adTitle: {
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  adSubtitle: {
    fontSize: 16,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});

export default AdCard;










// // src/components/AdCard.js
// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ImageBackground,
//   Dimensions,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Animatable from 'react-native-animatable';

// const { width: viewportWidth } = Dimensions.get('window');

// // Mapping for category-based styling
// const categoryStyles = {
//   'New Course': {
//     gradient: ['rgba(0, 0, 0, 0.4)', 'transparent'],
//     badgeColor: '#3498db',
//     defaultImage: 'https://via.placeholder.com/300x180.png?text=New+Courses',
//   },
//   Product: {
//     gradient: ['rgba(0, 0, 0, 0.5)', 'transparent'],
//     badgeColor: '#e67e22',
//     defaultImage: 'https://via.placeholder.com/300x180.png?text=Product',
//   },
//   Sale: {
//     gradient: ['rgba(192, 57, 43, 0.6)', 'transparent'],
//     badgeColor: '#c0392b',
//     defaultImage: 'https://via.placeholder.com/300x180.png?text=Sale',
//   },
//   Promotion: {
//     gradient: ['rgba(39, 174, 96, 0.6)', 'transparent'],
//     badgeColor: '#27ae60',
//     defaultImage: 'https://via.placeholder.com/300x180.png?text=Promotion',
//   },
//   Event: {
//     gradient: ['rgba(142, 68, 173, 0.6)', 'transparent'],
//     badgeColor: '#8e44ad',
//     defaultImage: 'https://via.placeholder.com/300x180.png?text=Event',
//   },
// };

// // Mapping for design-level animations
// const animationMapping = {
//   basic: 'fadeIn',
//   modern: 'slideInRight',
//   minimal: 'zoomIn',
//   detailed: 'flipInY',
// };

// const AdCard = ({ onPress, currentTheme, adData }) => {
//   const {
//     image,
//     title = 'Check out this ad!',
//     subtitle = '',
//     category = 'New Course',
//     cardDesign = 'basic',
//   } = adData || {};

//   const catStyle = categoryStyles[category] || categoryStyles['New Course'];
//   const animationType = animationMapping[cardDesign] || animationMapping.basic;

//   return (
//     <Animatable.View animation={animationType} duration={800} style={styles.adContainer}>
//       <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.adContainer}>
//         <ImageBackground
//           source={{ uri: image || catStyle.defaultImage }}
//           style={styles.imageBackground}
//           imageStyle={styles.imageStyle}
//         >
//           <LinearGradient
//             colors={catStyle.gradient}
//             start={{ x: 0, y: 1 }}
//             end={{ x: 0, y: 0 }}
//             style={styles.gradientOverlay}
//           >
//             <View style={styles.textContainer}>
//               <Text style={[styles.adTitle, { color: currentTheme?.adTextColor || '#fff' }]}>
//                 {title}
//               </Text>
//               {subtitle ? (
//                 <Text style={[styles.adSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>
//                   {subtitle}
//                 </Text>
//               ) : null}
//             </View>
//             <View style={[styles.badge, { backgroundColor: catStyle.badgeColor }]}>
//               <Text style={styles.badgeText}>{category}</Text>
//             </View>
//           </LinearGradient>
//         </ImageBackground>
//       </TouchableOpacity>
//     </Animatable.View>
//   );
// };

// const styles = StyleSheet.create({
//   adContainer: {
//     width: viewportWidth * 0.8,
//     height: 220,
//     borderRadius: 15,
//     overflow: 'hidden',
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowRadius: 6,
//     shadowOpacity: 0.15,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//   },
//   imageBackground: {
//     flex: 1,
//     justifyContent: 'flex-end',
//   },
//   imageStyle: {
//     resizeMode: 'cover',
//   },
//   gradientOverlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     padding: 15,
//   },
//   textContainer: {
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     borderRadius: 10,
//     padding: 10,
//   },
//   adTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     textShadowColor: 'rgba(0,0,0,0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   adSubtitle: {
//     fontSize: 14,
//     marginTop: 5,
//     textShadowColor: 'rgba(0,0,0,0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   badge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
// });

// export default AdCard;
