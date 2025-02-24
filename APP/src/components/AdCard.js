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
  const {
    image,
    title = 'Check out this ad!',
    subtitle = '',
    category = 'General',
    cardDesign = 'basic',
    templateId,
    customStyles,
    promoCode,
    limitedOffer,
    instructor,
    courseInfo,
    rating,
    originalPrice,
    salePrice,
    discountPercentage,
    saleEnds,
    eventDate,
    eventLocation,
  } = adData || {};

  // Get structural properties from template and merge inner styles
  const baseStyle = templateStyles[templateId] || templateStyles.newCourse;
  const structureStyle = {
    cardWidth: baseStyle.cardWidth,
    cardHeight: baseStyle.cardHeight,
    borderColor: baseStyle.borderColor,
    defaultImage: baseStyle.defaultImage,
  };
  const innerDefault = baseStyle.inner || {};
  const innerStyles = { ...innerDefault, ...customStyles };

  const animationType = animationMapping[cardDesign] || animationMapping.basic;

  let contentLayout;
  switch (templateId) {
    case 'promo':
      contentLayout = (
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeTitle, fontWeight: innerStyles.fontWeightTitle, textAlign: innerStyles.textAlign }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeSubtitle, textAlign: innerStyles.textAlign }]}>
              {subtitle}
            </Text>
          )}
          {promoCode && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Use Code: {promoCode}
            </Text>
          )}
          {limitedOffer && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Limited Time Offer!
            </Text>
          )}
        </View>
      );
      break;
    case 'newCourse':
      contentLayout = (
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeTitle, fontWeight: innerStyles.fontWeightTitle, textAlign: innerStyles.textAlign }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeSubtitle, textAlign: innerStyles.textAlign }]}>
              {subtitle}
            </Text>
          )}
          {instructor && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Instructor: {instructor}
            </Text>
          )}
          {courseInfo && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              {courseInfo}
            </Text>
          )}
          {rating && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Rating: {rating} / 5
            </Text>
          )}
        </View>
      );
      break;
    case 'sale':
      contentLayout = (
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeTitle, fontWeight: innerStyles.fontWeightTitle, textAlign: innerStyles.textAlign }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeSubtitle, textAlign: innerStyles.textAlign }]}>
              {subtitle}
            </Text>
          )}
          {(originalPrice && salePrice) && (
            <View style={styles.priceContainer}>
              <Text style={[styles.originalPrice, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
                ${originalPrice}
              </Text>
              <Text style={[styles.salePrice, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
                ${salePrice}
              </Text>
            </View>
          )}
          {discountPercentage && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Save {discountPercentage}%
            </Text>
          )}
          {saleEnds && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Sale ends: {saleEnds}
            </Text>
          )}
        </View>
      );
      break;
    case 'event':
      contentLayout = (
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeTitle, fontWeight: innerStyles.fontWeightTitle, textAlign: innerStyles.textAlign }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeSubtitle, textAlign: innerStyles.textAlign }]}>
              {subtitle}
            </Text>
          )}
          {eventDate && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Date: {eventDate}
            </Text>
          )}
          {eventLocation && (
            <Text style={[styles.detail, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeDetail }]}>
              Location: {eventLocation}
            </Text>
          )}
        </View>
      );
      break;
    default:
      contentLayout = (
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeTitle, fontWeight: innerStyles.fontWeightTitle, textAlign: innerStyles.textAlign }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: innerStyles.textColor, fontSize: innerStyles.fontSizeSubtitle, textAlign: innerStyles.textAlign }]}>
              {subtitle}
            </Text>
          )}
        </View>
      );
  }

  return (
    <Animatable.View
      animation={animationType}
      duration={800}
      style={[
        styles.adContainer,
        {
          width: structureStyle.cardWidth,
          height: structureStyle.cardHeight,
          borderColor: structureStyle.borderColor,
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
        <ImageBackground
          source={{ uri: image || structureStyle.defaultImage }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={innerStyles.gradientColors}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={[styles.gradientOverlay, { padding: innerStyles.padding }]}
          >
            {contentLayout}
            <View style={[styles.badge, { backgroundColor: innerStyles.badgeColor }]}>
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
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginVertical: 10,
  },
  touchable: { flex: 1 },
  imageBackground: { flex: 1, justifyContent: 'flex-end' },
  imageStyle: { resizeMode: 'cover' },
  gradientOverlay: { flex: 1, justifyContent: 'flex-end' },
  contentContainer: { flex: 1, justifyContent: 'center' },
  title: {},
  subtitle: { marginTop: 5 },
  detail: { marginTop: 5 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  originalPrice: { textDecorationLine: 'line-through', marginRight: 8 },
  salePrice: { fontWeight: 'bold' },
  badge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default AdCard;





// // src/components/AdCard.js
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Animatable from 'react-native-animatable';
// import { templateStyles } from './templateStyles';

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
//     category = 'General',
//     cardDesign = 'basic',
//     templateId,
//     customStyles,
//     // Additional details for enhanced templates:
//     promoCode,
//     limitedOffer,
//     instructor,
//     courseInfo,
//     rating,
//     originalPrice,
//     salePrice,
//     discountPercentage,
//     saleEnds,
//     eventDate,
//     eventLocation,
//   } = adData || {};

//   const baseStyle = templateStyles[templateId] || templateStyles.newCourse;
//   const mergedStyle = { ...baseStyle, ...customStyles };
//   const animationType = animationMapping[cardDesign] || animationMapping.basic;

//   let contentLayout;
//   switch (templateId) {
//     case 'promo':
//       contentLayout = (
//         <View style={styles.promoTextContainer}>
//           <Text style={[styles.promoTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//           {subtitle ? (
//             <Text style={[styles.promoSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//           ) : null}
//           {promoCode ? (
//             <Text style={[styles.promoDetail, { color: currentTheme?.adTextColor || '#ffeb3b' }]}>
//               Use Code: {promoCode}
//             </Text>
//           ) : null}
//           {limitedOffer ? (
//             <Text style={[styles.promoDetail, { color: currentTheme?.adTextColor || '#ff5722' }]}>
//               Limited Time Offer!
//             </Text>
//           ) : null}
//         </View>
//       );
//       break;
//     case 'newCourse':
//       contentLayout = (
//         <View style={styles.newCourseTextContainer}>
//           <Text style={[styles.newCourseTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//           {subtitle ? (
//             <Text style={[styles.newCourseSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//           ) : null}
//           {instructor ? (
//             <Text style={[styles.courseDetail, { color: currentTheme?.adTextColor || '#cddc39' }]}>
//               Instructor: {instructor}
//             </Text>
//           ) : null}
//           {courseInfo ? (
//             <Text style={[styles.courseDetail, { color: currentTheme?.adTextColor || '#cddc39' }]}>
//               {courseInfo}
//             </Text>
//           ) : null}
//           {rating ? (
//             <Text style={[styles.courseDetail, { color: currentTheme?.adTextColor || '#ffc107' }]}>
//               Rating: {rating} / 5
//             </Text>
//           ) : null}
//         </View>
//       );
//       break;
//     case 'sale':
//       contentLayout = (
//         <View style={styles.saleTextContainer}>
//           <Text style={[styles.saleTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//           {subtitle ? (
//             <Text style={[styles.saleSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//           ) : null}
//           {(originalPrice && salePrice) ? (
//             <View style={styles.priceContainer}>
//               <Text style={[styles.originalPrice, { color: currentTheme?.adTextColor || '#fff' }]}>
//                 ${originalPrice}
//               </Text>
//               <Text style={[styles.salePrice, { color: currentTheme?.adTextColor || '#ffeb3b' }]}>
//                 ${salePrice}
//               </Text>
//             </View>
//           ) : null}
//           {discountPercentage ? (
//             <Text style={[styles.discountText, { color: currentTheme?.adTextColor || '#ff5722' }]}>
//               Save {discountPercentage}%
//             </Text>
//           ) : null}
//           {saleEnds ? (
//             <Text style={[styles.saleEndsText, { color: currentTheme?.adTextColor || '#e91e63' }]}>
//               Sale ends: {saleEnds}
//             </Text>
//           ) : null}
//         </View>
//       );
//       break;
//     case 'event':
//       contentLayout = (
//         <View style={styles.eventTextContainer}>
//           <Text style={[styles.eventTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//           {subtitle ? (
//             <Text style={[styles.eventSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//           ) : null}
//           {eventDate ? (
//             <Text style={[styles.eventDetail, { color: currentTheme?.adTextColor || '#8bc34a' }]}>
//               Date: {eventDate}
//             </Text>
//           ) : null}
//           {eventLocation ? (
//             <Text style={[styles.eventDetail, { color: currentTheme?.adTextColor || '#8bc34a' }]}>
//               Location: {eventLocation}
//             </Text>
//           ) : null}
//         </View>
//       );
//       break;
//     default:
//       contentLayout = (
//         <View style={styles.defaultTextContainer}>
//           <Text style={[styles.defaultTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//           {subtitle ? (
//             <Text style={[styles.defaultSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//           ) : null}
//         </View>
//       );
//   }

//   return (
//     <Animatable.View
//       animation={animationType}
//       duration={800}
//       style={[
//         styles.adContainer,
//         {
//           width: mergedStyle.cardWidth,
//           height: mergedStyle.cardHeight,
//           borderColor: mergedStyle.borderColor,
//           borderWidth: 1,
//         },
//       ]}
//     >
//       <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
//         <ImageBackground
//           source={{ uri: image || mergedStyle.defaultImage }}
//           style={styles.imageBackground}
//           imageStyle={styles.imageStyle}
//         >
//           <LinearGradient
//             colors={mergedStyle.gradientColors}
//             start={{ x: 0, y: 1 }}
//             end={{ x: 0, y: 0 }}
//             style={styles.gradientOverlay}
//           >
//             {contentLayout}
//             <View style={[styles.badge, { backgroundColor: mergedStyle.badgeColor }]}>
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
//     borderRadius: 15,
//     overflow: 'hidden',
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowRadius: 6,
//     shadowOpacity: 0.2,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//     marginVertical: 10,
//   },
//   touchable: { flex: 1 },
//   imageBackground: { flex: 1, justifyContent: 'flex-end' },
//   imageStyle: { resizeMode: 'cover' },
//   gradientOverlay: { flex: 1, justifyContent: 'flex-end', padding: 15 },
//   // Promo layout
//   promoTextContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
//   promoTitle: { fontSize: 28, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 5 },
//   promoSubtitle: { fontSize: 20, marginTop: 5, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
//   promoDetail: { fontSize: 16, marginTop: 5 },
//   // New Course layout
//   newCourseTextContainer: { alignItems: 'flex-start', justifyContent: 'flex-start', flex: 1 },
//   newCourseTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
//   newCourseSubtitle: { fontSize: 18, opacity: 0.9 },
//   courseDetail: { fontSize: 16, marginTop: 4 },
//   // Sale layout
//   saleTextContainer: { transform: [{ rotate: '-2deg' }], alignItems: 'center', justifyContent: 'center', flex: 1 },
//   saleTitle: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
//   saleSubtitle: { fontSize: 20, opacity: 0.9 },
//   priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
//   originalPrice: { fontSize: 16, textDecorationLine: 'line-through', marginRight: 8 },
//   salePrice: { fontSize: 20, fontWeight: 'bold' },
//   discountText: { fontSize: 16, marginTop: 5 },
//   saleEndsText: { fontSize: 14, marginTop: 3, fontStyle: 'italic' },
//   // Event layout
//   eventTextContainer: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, paddingTop: 20 },
//   eventTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
//   eventSubtitle: { fontSize: 20, opacity: 0.9 },
//   eventDetail: { fontSize: 16, marginTop: 4 },
//   // Default layout (fallback)
//   defaultTextContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
//   defaultTitle: { fontSize: 24, fontWeight: '800' },
//   defaultSubtitle: { fontSize: 18, opacity: 0.9 },
//   badge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
//   badgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
// });

// export default AdCard;









// // src/components/AdCard.js
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Animatable from 'react-native-animatable';
// import { templateStyles } from './templateStyles';

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
//     category = 'General',
//     cardDesign = 'basic',
//     templateId,
//     customStyles,
//   } = adData || {};

//   const baseStyle = templateStyles[templateId] || templateStyles.newCourse;
//   const mergedStyle = { ...baseStyle, ...customStyles };
//   const animationType = animationMapping[cardDesign] || animationMapping.basic;

//   return (
//     <Animatable.View
//       animation={animationType}
//       duration={800}
//       style={[
//         styles.adContainer,
//         {
//           width: mergedStyle.cardWidth,
//           height: mergedStyle.cardHeight,
//           borderColor: mergedStyle.borderColor,
//           borderWidth: 1,
//         },
//       ]}
//     >
//       <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
//         <ImageBackground
//           source={{ uri: image || mergedStyle.defaultImage }}
//           style={styles.imageBackground}
//           imageStyle={styles.imageStyle}
//         >
//           <LinearGradient
//             colors={mergedStyle.gradientColors}
//             start={{ x: 0, y: 1 }}
//             end={{ x: 0, y: 0 }}
//             style={styles.gradientOverlay}
//           >
//             <View style={styles.textContainer}>
//               <Text style={[styles.adTitle, { color: currentTheme?.adTextColor || '#fff' }]}>{title}</Text>
//               {subtitle ? (
//                 <Text style={[styles.adSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>{subtitle}</Text>
//               ) : null}
//             </View>
//             <View style={[styles.badge, { backgroundColor: mergedStyle.badgeColor }]}>
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
//     borderRadius: 15,
//     overflow: 'hidden',
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowRadius: 6,
//     shadowOpacity: 0.2,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//     marginVertical: 10,
//   },
//   touchable: { flex: 1 },
//   imageBackground: { flex: 1, justifyContent: 'flex-end' },
//   imageStyle: { resizeMode: 'cover' },
//   gradientOverlay: { flex: 1, justifyContent: 'flex-end', padding: 15 },
//   textContainer: {
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     borderRadius: 10,
//     padding: 10,
//     marginBottom: 20,
//   },
//   adTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     textShadowColor: 'rgba(0,0,0,0.7)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   adSubtitle: {
//     fontSize: 18,
//     marginTop: 5,
//     textShadowColor: 'rgba(0,0,0,0.7)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 3,
//   },
//   badge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 14,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },
// });

// export default AdCard;










// // // src/components/AdCard.js
// // import React from 'react';
// // import {
// //   View,
// //   Text,
// //   TouchableOpacity,
// //   StyleSheet,
// //   ImageBackground,
// //   Dimensions,
// // } from 'react-native';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import * as Animatable from 'react-native-animatable';

// // const { width: viewportWidth } = Dimensions.get('window');

// // // Mapping for category-based styling
// // const categoryStyles = {
// //   'New Course': {
// //     gradient: ['rgba(0, 0, 0, 0.4)', 'transparent'],
// //     badgeColor: '#3498db',
// //     defaultImage: 'https://via.placeholder.com/300x180.png?text=New+Courses',
// //   },
// //   Product: {
// //     gradient: ['rgba(0, 0, 0, 0.5)', 'transparent'],
// //     badgeColor: '#e67e22',
// //     defaultImage: 'https://via.placeholder.com/300x180.png?text=Product',
// //   },
// //   Sale: {
// //     gradient: ['rgba(192, 57, 43, 0.6)', 'transparent'],
// //     badgeColor: '#c0392b',
// //     defaultImage: 'https://via.placeholder.com/300x180.png?text=Sale',
// //   },
// //   Promotion: {
// //     gradient: ['rgba(39, 174, 96, 0.6)', 'transparent'],
// //     badgeColor: '#27ae60',
// //     defaultImage: 'https://via.placeholder.com/300x180.png?text=Promotion',
// //   },
// //   Event: {
// //     gradient: ['rgba(142, 68, 173, 0.6)', 'transparent'],
// //     badgeColor: '#8e44ad',
// //     defaultImage: 'https://via.placeholder.com/300x180.png?text=Event',
// //   },
// // };

// // // Mapping for design-level animations
// // const animationMapping = {
// //   basic: 'fadeIn',
// //   modern: 'slideInRight',
// //   minimal: 'zoomIn',
// //   detailed: 'flipInY',
// // };

// // const AdCard = ({ onPress, currentTheme, adData }) => {
// //   const {
// //     image,
// //     title = 'Check out this ad!',
// //     subtitle = '',
// //     category = 'New Course',
// //     cardDesign = 'basic',
// //   } = adData || {};

// //   const catStyle = categoryStyles[category] || categoryStyles['New Course'];
// //   const animationType = animationMapping[cardDesign] || animationMapping.basic;

// //   return (
// //     <Animatable.View animation={animationType} duration={800} style={styles.adContainer}>
// //       <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.adContainer}>
// //         <ImageBackground
// //           source={{ uri: image || catStyle.defaultImage }}
// //           style={styles.imageBackground}
// //           imageStyle={styles.imageStyle}
// //         >
// //           <LinearGradient
// //             colors={catStyle.gradient}
// //             start={{ x: 0, y: 1 }}
// //             end={{ x: 0, y: 0 }}
// //             style={styles.gradientOverlay}
// //           >
// //             <View style={styles.textContainer}>
// //               <Text style={[styles.adTitle, { color: currentTheme?.adTextColor || '#fff' }]}>
// //                 {title}
// //               </Text>
// //               {subtitle ? (
// //                 <Text style={[styles.adSubtitle, { color: currentTheme?.adTextColor || '#eee' }]}>
// //                   {subtitle}
// //                 </Text>
// //               ) : null}
// //             </View>
// //             <View style={[styles.badge, { backgroundColor: catStyle.badgeColor }]}>
// //               <Text style={styles.badgeText}>{category}</Text>
// //             </View>
// //           </LinearGradient>
// //         </ImageBackground>
// //       </TouchableOpacity>
// //     </Animatable.View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   adContainer: {
// //     width: viewportWidth * 0.8,
// //     height: 220,
// //     borderRadius: 15,
// //     overflow: 'hidden',
// //     backgroundColor: '#fff',
// //     shadowColor: '#000',
// //     shadowRadius: 6,
// //     shadowOpacity: 0.15,
// //     shadowOffset: { width: 0, height: 3 },
// //     elevation: 5,
// //   },
// //   imageBackground: {
// //     flex: 1,
// //     justifyContent: 'flex-end',
// //   },
// //   imageStyle: {
// //     resizeMode: 'cover',
// //   },
// //   gradientOverlay: {
// //     flex: 1,
// //     justifyContent: 'flex-end',
// //     padding: 15,
// //   },
// //   textContainer: {
// //     backgroundColor: 'rgba(0,0,0,0.3)',
// //     borderRadius: 10,
// //     padding: 10,
// //   },
// //   adTitle: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     textShadowColor: 'rgba(0,0,0,0.5)',
// //     textShadowOffset: { width: 0, height: 1 },
// //     textShadowRadius: 3,
// //   },
// //   adSubtitle: {
// //     fontSize: 14,
// //     marginTop: 5,
// //     textShadowColor: 'rgba(0,0,0,0.5)',
// //     textShadowOffset: { width: 0, height: 1 },
// //     textShadowRadius: 2,
// //   },
// //   badge: {
// //     position: 'absolute',
// //     top: 10,
// //     right: 10,
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //   },
// //   badgeText: {
// //     color: '#fff',
// //     fontSize: 12,
// //     fontWeight: 'bold',
// //   },
// // });

// // export default AdCard;
