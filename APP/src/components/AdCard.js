import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useResponsiveTemplateStyles } from './templateStyles';

const animationMapping = {
  promo: 'fadeInDown',
  newCourse: 'fadeInUp',
  sale: 'zoomIn',
  event: 'slideInLeft',
  default: 'fadeIn',
};

const AdCard = ({ onPress, currentTheme, adData }) => {
  const templateStyles = useResponsiveTemplateStyles(currentTheme);
  const {
    image,
    title = 'Check out this ad!',
    subtitle = '',
    category = 'General',
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
    // saleEnabled,
  } = adData || {};

  // Merge base template styles with any overrides
  const baseStyle = templateStyles[templateId] || templateStyles.newCourse;
  const structureStyle = {
    cardWidth: baseStyle.cardWidth,
    cardHeight: baseStyle.cardHeight,
    borderColor: baseStyle.borderColor,
    defaultImage: baseStyle.defaultImage,
  };
  const innerDefault = baseStyle.inner || {};
  const innerStyles = { ...innerDefault, ...customStyles };

  const animationType = animationMapping[templateId] || animationMapping.default;

  // PROMO LAYOUT
  if (templateId === 'promo') {
    return (
      <>
        <View style={[styles.categoryBadge, { backgroundColor: innerStyles.badgeColor, top: 15, right: -10, zIndex: 1, transform: [{ rotate: '30deg' }] }]}>
          <Text style={styles.badgeLabel} allowFontScaling>
            {category}
          </Text>
        </View>
        <Animatable.View
          animation={animationType}
          duration={900}
          style={[styles.cardContainer, { width: structureStyle.cardWidth, height: structureStyle.cardHeight, borderColor: structureStyle.borderColor }]}
        >
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardTouchable}>
            <ImageBackground
              source={{ uri: image || structureStyle.defaultImage }}
              style={styles.promoImage}
              imageStyle={styles.promoImageStyle}
            >
              <LinearGradient
                colors={innerStyles.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.promoOverlay, { padding: innerStyles.padding }]}
              >
                <Text
                  style={[styles.promoTitle, { fontSize: innerStyles.fontSizeTitle || 32, color: innerStyles.textColor || '#fff', transform: [{ rotate: '-5deg' }] }]}
                  allowFontScaling
                >
                  {title.toUpperCase()}
                </Text>
                {subtitle ? (
                  <Text
                    style={[styles.promoSubtitle, { fontSize: innerStyles.fontSizeSubtitle || 20, color: innerStyles.textColor || '#fff' }]}
                    allowFontScaling
                  >
                    {subtitle}
                  </Text>
                ) : null}
                {promoCode ? (
                  <View style={styles.promoCodeContainer}>
                    <Text style={[styles.promoCodeText, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                      {promoCode}
                    </Text>
                  </View>
                ) : null}
                {limitedOffer ? (
                  <Text style={[styles.limitedOfferText, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                    Limited Time Offer!
                  </Text>
                ) : null}
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </Animatable.View>
      </>
    );
  }

  // NEW COURSE LAYOUT (Updated)
  if (templateId === 'newCourse') {
    return (
      <>
        <View style={[styles.categoryBadge, {    position: 'absolute', 
            bottom: 120, 
            right: -20, 
            zIndex: 1,
            transform: [{ rotate: '90deg' }],
            backgroundColor: innerStyles.badgeColor, 
            borderRadius: 20, 
            paddingVertical: 4, 
            paddingHorizontal: 12, 
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,}]}>
          <Text style={styles.badgeLabel} allowFontScaling>
            {category}
          </Text>
        </View>
        <Animatable.View
          animation={animationType}
          duration={900}
          style={[styles.cardContainer, {
            width: structureStyle.cardWidth,
            height: structureStyle.cardHeight,
            borderColor: structureStyle.borderColor,
            borderRadius: 14,
            overflow: 'hidden',
            elevation: 5,
            backgroundColor:innerStyles.gradientColors[0],
          }]}
        >
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardTouchable}>
            <ImageBackground
              source={{ uri: image || structureStyle.defaultImage }}
              style={styles.newCourseImageUpdated}
              imageStyle={styles.newCourseImageStyleUpdated}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
                style={[styles.newCourseOverlay, { padding: 20, borderRadius: 14 }]}
              >
                <View style={styles.newCourseTextContainerUpdated}>
                  <Text
                    style={[styles.newCourseTitle, {
                      fontSize: innerStyles.fontSizeTitle + 2,
                      color: '#fff',
                      textAlign: 'left',
                      fontWeight: 'bold',
                    }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    allowFontScaling
                  >
                    {title}
                  </Text>
                  {subtitle && (
                    <Text
                      style={[styles.newCourseSubtitle, {
                        fontSize: innerStyles.fontSizeSubtitle,
                        color: '#ddd',
                        textAlign: 'left',
                      }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      allowFontScaling
                    >
                      {subtitle}
                    </Text>
                  )}
                  {instructor && (
                    <Text
                      style={[styles.newCourseInstructor, {
                        fontSize: innerStyles.fontSizeDetail,
                        color: '#bbb',
                        textAlign: 'left',
                        marginTop: 4,
                      }]}
                      allowFontScaling
                    >
                      By {instructor}
                    </Text>
                  )}
                  {courseInfo && (
                    <Text
                      style={[styles.newCourseInfo, {
                        fontSize: innerStyles.fontSizeDetail,
                        color: '#ccc',
                        textAlign: 'left',
                        marginTop: 6,
                      }]}
                      allowFontScaling
                    >
                      {courseInfo}
                    </Text>
                  )}
                  {rating && (
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.newCourseRating, { fontSize: innerStyles.fontSizeDetail, color: '#ffcc00' }]}>
                        ⭐ {rating}/5
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </Animatable.View>
      </>
    );
  }

  // EVENT LAYOUT (Updated)
  if (templateId === 'event') {
    return (
      <>
      <View style={[styles.categoryBadge, { backgroundColor: innerStyles.badgeColor, top: 10, alignItems: 'center', zIndex: 1 }]}>
        <Text style={styles.badgeLabel} allowFontScaling>
          {category}
        </Text>
      </View>
      <Animatable.View
        animation={animationType}
        duration={900}
        style={[styles.cardContainer, { width: structureStyle.cardWidth, height: structureStyle.cardHeight, borderColor: structureStyle.borderColor }]}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardTouchable}>
          <ImageBackground
            source={{ uri: image || structureStyle.defaultImage }}
            style={styles.eventImageUpdated}
            imageStyle={styles.eventImageStyleUpdated}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.eventOverlayUpdated}
            >
              <View style={styles.eventDetailsUpdated}>
                <Text
                  style={[styles.eventTitle, { fontSize: innerStyles.fontSizeTitle || 26, color: innerStyles.textColor || '#fff' }]}
                  allowFontScaling
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={[styles.eventSubtitle, { fontSize: innerStyles.fontSizeSubtitle || 18, color: innerStyles.textColor || '#fff' }]}
                    allowFontScaling
                  >
                    {subtitle}
                  </Text>
                ) : null}
                {eventDate ? (
                  <Text
                    style={[styles.eventDate, { fontSize: innerStyles.fontSizeDetail || 14, color: innerStyles.textColor || '#fff' }]}
                    allowFontScaling
                  >
                    {eventDate}
                  </Text>
                ) : null}
                {eventLocation ? (
                  <Text
                    style={[styles.eventLocation, { fontSize: innerStyles.fontSizeDetail || 14, color: innerStyles.textColor || '#fff' }]}
                    allowFontScaling
                  >
                    {eventLocation}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animatable.View>
      </>
    );
  }

  // SALE LAYOUT
  if (templateId === 'sale') {
    return (
      <>
        <View style={[styles.categoryBadge, { backgroundColor: innerStyles.badgeColor, left: 1, top: 45, zIndex: 1 }]}>
          <Text style={styles.badgeLabel} allowFontScaling>
            {category}
          </Text>
        </View>
        <Animatable.View
          animation={animationType}
          duration={900}
          style={[styles.cardContainer, { width: structureStyle.cardWidth, height: structureStyle.cardHeight, borderColor: structureStyle.borderColor }]}
        >
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardTouchable}>
            <View style={styles.saleContainer}>
              <ImageBackground
                source={{ uri: image || structureStyle.defaultImage }}
                style={styles.saleImage}
                imageStyle={styles.saleImageStyle}
              >
                <LinearGradient
                  colors={innerStyles.gradientColors}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.saleImageOverlay, { padding: innerStyles.padding }]}
                >
                  <Text
                    style={[styles.saleTitle, { fontSize: innerStyles.fontSizeTitle || 30, color: innerStyles.textColor || '#fff' }]}
                    allowFontScaling
                  >
                    {title}
                  </Text>
                </LinearGradient>
              </ImageBackground>
              <View style={styles.saleDetails}>
                {subtitle ? (
                  <Text style={[styles.saleSubtitle, { fontSize: innerStyles.fontSizeSubtitle || 20 }]} allowFontScaling>
                    {subtitle}
                  </Text>
                ) : null}
                {(originalPrice && salePrice) ? (
                  <View style={styles.salePriceContainer}>
                    <Text style={[styles.originalPrice, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                      ${originalPrice}
                    </Text>
                    <Text style={[styles.salePrice, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                      ${salePrice}
                    </Text>
                  </View>
                ) : null}
                {discountPercentage ? (
                  <Text style={[styles.discountText, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                    Save {discountPercentage}%
                  </Text>
                ) : null}
                {saleEnds ? (
                  <Text style={[styles.saleEndsText, { fontSize: innerStyles.fontSizeDetail || 16 }]} allowFontScaling>
                    Ends: {saleEnds}
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </Animatable.View>
      </>
    );
  }

  // DEFAULT LAYOUT
  return (
    <Animatable.View
      animation={animationType}
      duration={900}
      style={[styles.cardContainer, { width: structureStyle.cardWidth, height: structureStyle.cardHeight, borderColor: structureStyle.borderColor }]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardTouchable}>
        <ImageBackground
          source={{ uri: image || structureStyle.defaultImage }}
          style={styles.defaultImage}
          imageStyle={styles.defaultImageStyle}
        >
          <LinearGradient
            colors={innerStyles.gradientColors}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={[styles.defaultOverlay, { padding: innerStyles.padding }]}
          >
            <Text
              style={[styles.defaultTitle, { fontSize: innerStyles.fontSizeTitle || 28, color: innerStyles.textColor || '#fff' }]}
              allowFontScaling
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.defaultSubtitle, { fontSize: innerStyles.fontSizeSubtitle || 18, color: innerStyles.textColor || '#fff' }]}
                allowFontScaling
              >
                {subtitle}
              </Text>
            ) : null}
          </LinearGradient>
          <View style={[styles.categoryBadge, { backgroundColor: innerStyles.badgeColor }]}>
            <Text style={styles.badgeLabel} allowFontScaling>
              {category}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginVertical: 12,
  },
  cardTouchable: { flex: 1 },
  // Promo Styles
  promoImage: { flex: 1 },
  promoImageStyle: { resizeMode: 'cover' },
  promoOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  promoTitle: {
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
    top: 15,
  },
  promoSubtitle: {
    marginTop: 10,
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  promoCodeContainer: { marginTop: 14, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  promoCodeText: { fontWeight: 'bold', color: '#000' },
  limitedOfferText: { marginTop: 10, fontStyle: 'italic' },
    // Updated New Course Styles (Improved UI)
    newCourseImageUpdated: { 
      flex: 1, 
      justifyContent: 'flex-end',
      borderRadius: 14,
    },
    newCourseImageStyleUpdated: { 
      resizeMode: 'cover', 
      borderRadius: 14,
    },
    newCourseOverlay: { 
      ...StyleSheet.absoluteFillObject, 
      justifyContent: 'flex-end', 
      padding: 18,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.1)', // Darker overlay for better contrast
    },
    newCourseTextContainerUpdated: { 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      borderRadius: 12, 
      padding: 12,
    },
    newCourseTitle: { 
      fontWeight: 'bold', 
      fontSize: 18, 
      color: '#fff', 
      marginBottom: 6, 
      flexShrink: 1, 
      flexWrap: 'wrap' 
    },
    newCourseSubtitle: { 
      marginTop: 4, 
      fontSize: 14, 
      color: '#ddd', 
      flexWrap: 'wrap' 
    },
    newCourseInstructor: { 
      marginTop: 8, 
      fontSize: 14, 
      fontStyle: 'italic', 
      color: '#bbb',
      flexWrap: 'wrap'
    },
    newCourseInfo: { 
      marginTop: 6, 
      fontSize: 14, 
      color: '#ccc', 
      flexWrap: 'wrap' 
    },
    newCourseRating: { 
      marginTop: 6, 
      fontSize: 14, 
      fontWeight: 'bold', 
      color: '#ffcc00', 
      flexWrap: 'wrap' 
    },
  // Sale Styles
  saleContainer: { flex: 1, flexDirection: 'row' },
  saleImage: { width: '55%', height: '100%' },
  saleImageStyle: { resizeMode: 'cover' },
  saleImageOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  saleDetails: { flex: 1, backgroundColor: '#fff', padding: 10, justifyContent: 'center' },
  saleTitle: { fontWeight: '700', marginBottom: 8, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  saleSubtitle: { marginBottom: 10, flexWrap: 'wrap' },
  salePriceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  originalPrice: { textDecorationLine: 'line-through', marginRight: 10, color: '#888' },
  salePrice: { fontWeight: 'bold', color: '#000', transform: [{ rotate: '-29deg' }], flexWrap: 'wrap', right: 5, bottom: 5 },
  discountText: { color: '#e53935', fontWeight: '600' },
  saleEndsText: { color: '#757575', flexWrap: 'wrap' },
  // Event Styles (Original)
  eventImage: { flex: 1 },
  eventImageStyle: { resizeMode: 'cover' },
  eventOverlay: { flex: 1, justifyContent: 'flex-end', paddingVertical: 16 },
  eventDetails: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderTopLeftRadius: 16 },
  eventTitle: { fontWeight: '800', marginBottom: 4, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  eventSubtitle: { marginTop: 4, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  eventDate: { marginTop: 6, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  eventLocation: { marginTop: 4, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  // Updated Event Styles
  eventImageUpdated: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  eventImageStyleUpdated: { 
    resizeMode: 'cover' 
  },
  eventOverlayUpdated: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'flex-end', 
    padding: 16 
  },
  eventDetailsUpdated: { 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 10, 
    padding: 12 
  },
  // Default Styles
  defaultImage: { flex: 1 },
  defaultImageStyle: { resizeMode: 'cover' },
  defaultOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  defaultTitle: { fontWeight: '700', flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  defaultSubtitle: { marginTop: 6, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  // Badge (common)
  categoryBadge: { position: 'absolute', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeLabel: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});

export default AdCard;






