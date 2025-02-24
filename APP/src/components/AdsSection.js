// src/components/AdsSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AdsList from './AdsList';
import { fetchAds } from '../services/api';

const AdsSection = ({ currentTheme, onAdPress, refreshSignal, categoryFilter, templateFilter = 'all' }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group ads by templateId
  const groupAdsByTemplate = (adsArray) =>
    adsArray.reduce((groups, ad) => {
      const key = ad.templateId || 'newCourse';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ad);
      return groups;
    }, {});

  const getAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAds();
      if (response?.success) {
        // Now we assume API returns ads as an array in response.data directly
        let fetchedAds = response.data.data || [];
        if (categoryFilter) {
          if (typeof categoryFilter === 'string') {
            fetchedAds = fetchedAds.filter(ad => ad.category === categoryFilter);
          } else if (Array.isArray(categoryFilter)) {
            fetchedAds = fetchedAds.filter(ad => categoryFilter.includes(ad.category));
          }
        }
        setAds(fetchedAds);
      } else {
        setAds([]);
      }
    } catch (error) {
      console.error('Ads fetch error', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    getAds();
  }, [getAds, refreshSignal]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
      </View>
    );
  }
  if (!ads.length) return null;

  const adsToShow = templateFilter === 'all'
    ? groupAdsByTemplate(ads)
    : { [templateFilter]: ads.filter(ad => ad.templateId === templateFilter) };

  return (
    <View style={styles.sectionWrapper}>
      {Object.keys(adsToShow).map((templateKey) => (
        <View key={templateKey} style={styles.templateGroup}>
          <Text style={[styles.groupHeader, { color: currentTheme.cardTextColor }]}>
            {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Ads
          </Text>
          <View style={styles.sectionDivider} />
          <AdsList
            ads={adsToShow[templateKey]}
            onAdPress={onAdPress}
            currentTheme={currentTheme}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  templateGroup: { marginBottom: 25 },
  groupHeader: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionDivider: {
    height: 4,
    backgroundColor: '#00aced',
    marginVertical: 10,
    borderRadius: 3,
    marginHorizontal: 50,
  },
  loadingContainer: { marginVertical: 10, alignItems: 'center' },
});

export default AdsSection;





// // src/components/AdsSection.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// import AdsList from './AdsList';
// import { fetchAds } from '../services/api';

// const AdsSection = ({ currentTheme, onAdPress, refreshSignal, categoryFilter, templateFilter = 'all' }) => {
//   const [ads, setAds] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Group ads by templateId
//   const groupAdsByTemplate = (adsArray) =>
//     adsArray.reduce((groups, ad) => {
//       const key = ad.templateId || 'newCourse';
//       if (!groups[key]) groups[key] = [];
//       groups[key].push(ad);
//       return groups;
//     }, {});

//   const getAds = useCallback(async () => {
//     setLoading(true);
//     try {
//       const response = await fetchAds();
//       if (response?.success) {
//         let fetchedAds = response.data?.data || [];
//         if (categoryFilter) {
//           if (typeof categoryFilter === 'string') {
//             fetchedAds = fetchedAds.filter(ad => ad.category === categoryFilter);
//           } else if (Array.isArray(categoryFilter)) {
//             fetchedAds = fetchedAds.filter(ad => categoryFilter.includes(ad.category));
//           }
//         }
//         setAds(fetchedAds);
//       } else {
//         setAds([]);
//       }
//     } catch (error) {
//       console.error('Ads fetch error', error);
//       setAds([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [categoryFilter]);

//   useEffect(() => {
//     getAds();
//   }, [getAds, refreshSignal]);

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }
//   if (!ads.length) return null;

//   const adsToShow = templateFilter === 'all'
//     ? groupAdsByTemplate(ads)
//     : { [templateFilter]: ads.filter(ad => ad.templateId === templateFilter) };

//   return (
//     <View style={styles.sectionWrapper}>
//       {Object.keys(adsToShow).map((templateKey) => (
//         <View key={templateKey} style={styles.templateGroup}>
//           <Text style={[styles.groupHeader, { color: currentTheme.cardTextColor }]}>
//             {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Ads
//           </Text>
//           <View style={styles.sectionDivider} />
//           <AdsList
//             ads={adsToShow[templateKey]}
//             onAdPress={onAdPress}
//             currentTheme={currentTheme}
//           />
//         </View>
//       ))}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//     paddingVertical: 15,
//     backgroundColor: 'rgba(255,255,255,0.95)',
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   templateGroup: { marginBottom: 25 },
//   groupHeader: {
//     fontSize: 26,
//     fontWeight: '800',
//     marginBottom: 5,
//     textAlign: 'center',
//   },
//   sectionDivider: {
//     height: 4,
//     backgroundColor: '#00aced',
//     marginVertical: 10,
//     borderRadius: 3,
//     marginHorizontal: 50,
//   },
//   loadingContainer: { marginVertical: 10, alignItems: 'center' },
// });

// export default AdsSection;












// // src/components/AdsSection.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// import AdsList from './AdsList';
// import { fetchAds } from '../services/api';

// const AdsSection = ({ currentTheme, onAdPress, refreshSignal, categoryFilter }) => {
//   const [ads, setAds] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const getAds = useCallback(async () => {
//     setLoading(true);
//     try {
//       const response = await fetchAds();
//       // Our API returns nested data: response.data.data
//       if (response?.success) {
//         let filteredAds = response.data?.data || [];
//         if (categoryFilter) {
//           if (typeof categoryFilter === 'string') {
//             filteredAds = filteredAds.filter(ad => ad.category === categoryFilter);
//           } else if (Array.isArray(categoryFilter)) {
//             filteredAds = filteredAds.filter(ad => categoryFilter.includes(ad.category));
//           }
//         }
//         setAds(filteredAds);
//       } else {
//         setAds([]);
//       }
//     } catch (error) {
//       console.error('Ads fetch error', error);
//       setAds([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [categoryFilter]);

//   useEffect(() => {
//     getAds();
//   }, [getAds, refreshSignal]);

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
//       </View>
//     );
//   }
//   if (!ads.length) return null;

//   return (
//     <View style={styles.sectionWrapper}>
//       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
//         Sponsored Ads {categoryFilter ? `- ${Array.isArray(categoryFilter) ? categoryFilter.join(', ') : categoryFilter}` : ''}
//       </Text>
//       <View style={styles.sectionDivider} />
//       <AdsList ads={ads} onAdPress={onAdPress} currentTheme={currentTheme} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   // sectionWrapper: {
//   //   marginHorizontal: 15,
//   //   marginBottom: 20,
//   //   paddingVertical: 15,
//   //   paddingHorizontal: 10,
//   //   backgroundColor: 'rgba(255,255,255,0.95)',
//   //   borderRadius: 12,
//   //   shadowColor: '#000',
//   //   shadowOpacity: 0.12,
//   //   shadowRadius: 10,
//   //   elevation: 4,
//   // },
//   sectionTitle: {
//     fontSize: 26,
//     fontWeight: '800',
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   sectionDivider: {
//     height: 4,
//     backgroundColor: '#00aced',
//     marginVertical: 15,
//     borderRadius: 3,
//     marginHorizontal: 50,
//   },
//   loadingContainer: {
//     marginVertical: 10,
//     alignItems: 'center',
//   },
// });

// export default AdsSection;










// // import React, { useState, useEffect, useCallback } from 'react';
// // import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// // import AdsList from './AdsList';
// // import { fetchAds } from '../services/api';

// // const AdsSection = ({ currentTheme, onAdPress, refreshSignal, categoryFilter }) => {
// //   const [ads, setAds] = useState([]);
// //   const [loading, setLoading] = useState(false);

// //   const getAds = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       const response = await fetchAds();
// //       if (response?.success) {
// //         // If categoryFilter is an array, filter ads that match any; otherwise, filter by single string.
// //         const filteredAds = Array.isArray(categoryFilter) && categoryFilter.length
// //           ? response.data.filter((ad) => categoryFilter.includes(ad.category))
// //           : categoryFilter
// //           ? response.data.filter((ad) => ad.category === categoryFilter)
// //           : response.data;
// //         setAds(filteredAds);
// //       } else {
// //         setAds([]);
// //       }
// //     } catch (error) {
// //       console.error('Ads fetch error', error);
// //       setAds([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [categoryFilter]);

// //   useEffect(() => {
// //     getAds();
// //   }, [getAds, refreshSignal]);

// //   if (loading) {
// //     return (
// //       <View style={styles.loadingContainer}>
// //         <ActivityIndicator size="small" color={currentTheme.primaryColor} />
// //       </View>
// //     );
// //   }

// //   if (!ads.length) return null;

// //   return (
// //     <View style={styles.sectionWrapper}>
// //       <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
// //         Sponsored Ads {categoryFilter ? `- ${Array.isArray(categoryFilter) ? categoryFilter.join(', ') : categoryFilter}` : ''}
// //       </Text>
// //       <View style={styles.sectionDivider} />
// //       <AdsList ads={ads} onAdPress={onAdPress} currentTheme={currentTheme} category={categoryFilter} />
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   sectionWrapper: {
// //     marginHorizontal: 15,
// //     marginBottom: 20,
// //   },
// //   sectionTitle: {
// //     fontSize: 22,
// //     fontWeight: '700',
// //     marginTop: 15,
// //   },
// //   sectionDivider: {
// //     height: 2,
// //     backgroundColor: 'rgba(0,0,0,0.1)',
// //     marginVertical: 8,
// //     borderRadius: 2,
// //   },
// //   loadingContainer: {
// //     marginVertical: 10,
// //     alignItems: 'center',
// //   },
// // });

// // export default AdsSection;
