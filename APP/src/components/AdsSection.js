import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AdsList from './AdsList';
import { fetchAds } from '../services/api';

// Define the layout types you support
const layoutTypes = ['large', 'medium', 'small'];

const AdsSection = ({ currentTheme, onAdPress, refreshSignal }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAds();
      if (response?.success) {
        // Optionally filter only active ads or do further filtering
        const activeAds = response.data.filter(ad => ad.status === 'Active');
        setAds(activeAds);
      } else {
        setAds([]);
      }
    } catch (error) {
      console.error('Ads fetch error', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Group ads by layoutType
  const groupedAds = layoutTypes.reduce((acc, type) => {
    acc[type] = ads.filter(ad => ad.layoutType === type);
    return acc;
  }, {});

  return (
    <View style={styles.sectionWrapper}>
      {layoutTypes.map(type => {
        const adsForType = groupedAds[type];
        if (!adsForType || !adsForType.length) return null;
        return (
          <View key={type} style={styles.groupSection}>
            <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
              {type.toUpperCase()} Ads
            </Text>
            <View style={styles.sectionDivider} />
            <AdsList
              ads={adsForType.sort((a, b) => a.displayPriority - b.displayPriority)}
              onAdPress={onAdPress}
              currentTheme={currentTheme}
              layoutType={type}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  groupSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 15,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
    borderRadius: 2,
  },
  loadingContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
});

export default AdsSection;










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
//       if (response?.success) {
//         // If categoryFilter is an array, filter ads that match any; otherwise, filter by single string.
//         const filteredAds = Array.isArray(categoryFilter) && categoryFilter.length
//           ? response.data.filter((ad) => categoryFilter.includes(ad.category))
//           : categoryFilter
//           ? response.data.filter((ad) => ad.category === categoryFilter)
//           : response.data;
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
//       <AdsList ads={ads} onAdPress={onAdPress} currentTheme={currentTheme} category={categoryFilter} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   sectionWrapper: {
//     marginHorizontal: 15,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginTop: 15,
//   },
//   sectionDivider: {
//     height: 2,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//     marginVertical: 8,
//     borderRadius: 2,
//   },
//   loadingContainer: {
//     marginVertical: 10,
//     alignItems: 'center',
//   },
// });

// export default AdsSection;
