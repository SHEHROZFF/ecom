// src/components/AdsSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import NewCourseAdsList from './NewCourseAdsList';
import { fetchAds } from '../services/api';

const AdsSection = ({ currentTheme, onAdPress, refreshSignal }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAds();
      if (response?.success) {
        setAds(response.data);
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
  }, [getAds, refreshSignal]); // triggers a re-fetch when refreshSignal changes

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
      </View>
    );
  }

  if (!ads.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      <Text style={[styles.sectionTitle, { color: currentTheme.cardTextColor }]}>
        Sponsored Ads
      </Text>
      <View style={styles.sectionDivider} />
      <NewCourseAdsList ads={ads} onAdPress={onAdPress} currentTheme={currentTheme} />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 15,
    marginBottom: 20,
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
