// src/components/templateStyles.js
export const templateStyles = {
  promo: {
    // Flashy, high-contrast look for promotions
    cardHeight: 320,
    cardWidth: 360,
    gradientColors: ['rgba(255,20,147,0.9)', 'rgba(255,69,0,0.7)'],
    badgeColor: '#ff1493',
    defaultImage: 'https://via.placeholder.com/360x320.png?text=Promotion',
    borderColor: '#ff69b4',
    carousel: {
      mode: 'default',
      continuousScroll: true,
    },
    inner: {
      gradientColors: ['#ff7f50', '#ff1493'],
      badgeColor: '#ff1493',
      textColor: '#ffffff',
      fontSizeTitle: 28,
      fontWeightTitle: '900',
      fontSizeSubtitle: 20,
      fontSizeDetail: 16,
      textAlign: 'center',
      padding: 15,
    },
  },
  newCourse: {
    // Clean and modern look for new courses
    cardHeight: 280,
    cardWidth: 340,
    gradientColors: ['rgba(30,144,255,0.85)', 'rgba(65,105,225,0.65)'],
    badgeColor: '#1e90ff',
    defaultImage: 'https://via.placeholder.com/340x280.png?text=New+Course',
    borderColor: '#1e90ff',
    carousel: {
      mode: 'depth',
      continuousScroll: false,
      modeConfig: { depth: 200 },
    },
    inner: {
      gradientColors: ['rgba(30,144,255,0.85)', 'rgba(65,105,225,0.65)'],
      badgeColor: '#1e90ff',
      textColor: '#ffffff',
      fontSizeTitle: 24,
      fontWeightTitle: '800',
      fontSizeSubtitle: 18,
      fontSizeDetail: 16,
      textAlign: 'left',
      padding: 15,
    },
  },
  sale: {
    // Energetic look for sale events with bold colors
    cardHeight: 300,
    cardWidth: 350,
    gradientColors: ['rgba(255,140,0,0.85)', 'rgba(255,69,0,0.65)'],
    badgeColor: '#ff8c00',
    defaultImage: 'https://via.placeholder.com/350x300.png?text=Sale',
    borderColor: '#ffa500',
    carousel: {
      mode: 'horizontal-stack',
      continuousScroll: false,
      modeConfig: { activeStackScale: 0.85, activeStackOffset: 30 },
    },
    inner: {
      gradientColors: ['rgba(255,140,0,0.85)', 'rgba(255,69,0,0.65)'],
      badgeColor: '#ff8c00',
      textColor: '#ffffff',
      fontSizeTitle: 26,
      fontWeightTitle: '900',
      fontSizeSubtitle: 20,
      fontSizeDetail: 16,
      textAlign: 'center',
      padding: 15,
    },
  },
  event: {
    // Cinematic look for events with bold text and moody gradients
    cardHeight: 340,
    cardWidth: 380,
    gradientColors: ['rgba(75,0,130,0.85)', 'rgba(138,43,226,0.65)'],
    badgeColor: '#8a2be2',
    defaultImage: 'https://via.placeholder.com/380x340.png?text=Event',
    borderColor: '#8a2be2',
    carousel: {
      mode: 'tinder',
      continuousScroll: false,
      modeConfig: { duration: 400 },
    },
    inner: {
      gradientColors: ['rgba(75,0,130,0.85)', 'rgba(138,43,226,0.65)'],
      badgeColor: '#8a2be2',
      textColor: '#ffffff',
      fontSizeTitle: 26,
      fontWeightTitle: '800',
      fontSizeSubtitle: 20,
      fontSizeDetail: 16,
      textAlign: 'center',
      padding: 15,
    },
  },
};







// // src/components/templateStyles.js
// export const templateStyles = {
//   promo: {
//     // Flashy, high-contrast look for promotions
//     cardHeight: 150,
//     cardWidth: 360,
//     gradientColors: [''],
//     badgeColor: '#ff1493',
//     defaultImage: 'https://via.placeholder.com/360x320.png?text=Promotion',
//     borderColor: '#ff69b4',
//     // Carousel: continuous scrolling (marquee style) for dynamic promos
//     carousel: {
//       mode: 'default',
//       continuousScroll: true,
//     },
//   },
//   newCourse: {
//     // Clean and modern look for new courses
//     cardHeight: 280,
//     cardWidth: 340,
//     gradientColors: ['rgba(30, 144, 255, 0.85)', 'rgba(65, 105, 225, 0.65)'],
//     badgeColor: '#1e90ff',
//     defaultImage: 'https://via.placeholder.com/340x280.png?text=New+Course',
//     borderColor: '#1e90ff',
//     // Carousel: depth mode gives a 3D stacking effect
//     carousel: {
//       mode: 'depth',
//       continuousScroll: false,
//       modeConfig: { depth: 200 },
//     },
//   },
//   sale: {
//     // Energetic look for sale events with bright, bold colors
//     cardHeight: 300,
//     cardWidth: 350,
//     gradientColors: ['rgba(255, 140, 0, 0.85)', 'rgba(255, 69, 0, 0.65)'],
//     badgeColor: '#ff8c00',
//     defaultImage: 'https://via.placeholder.com/350x300.png?text=Sale',
//     borderColor: '#ffa500',
//     // Carousel: horizontal-stack to emphasize overlapping cards
//     carousel: {
//       mode: 'horizontal-stack',
//       continuousScroll: false,
//       modeConfig: { activeStackScale: 0.85, activeStackOffset: 30 },
//     },
//   },
//   event: {
//     // Cinematic look for events—with a dark, moody gradient and bold text
//     cardHeight: 340,
//     cardWidth: 380,
//     gradientColors: ['rgba(75, 0, 130, 0.85)', 'rgba(138, 43, 226, 0.65)'],
//     badgeColor: '#8a2be2',
//     defaultImage: 'https://via.placeholder.com/380x340.png?text=Event',
//     borderColor: '#8a2be2',
//     // Carousel: tinder-style for a dynamic, swipeable experience
//     carousel: {
//       mode: 'tinder',
//       continuousScroll: false,
//       modeConfig: { duration: 400 },
//     },
//   },
// };




