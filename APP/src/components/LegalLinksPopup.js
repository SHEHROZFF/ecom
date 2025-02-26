// src/components/LegalLinksPopup.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DynamicContentPopup from './DynamicContentPopup';
import { fetchPolicy } from '../services/api';

const LegalLinksPopup = ({
  textStyle = {},
  containerStyle = {},
  separator = ' | ',
  // fetchContent,
  staticContent,
  themeStyles,
  headerBackground,
  headerTextColor = '#fff',
}) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('');

  const openPopup = (type) => {
    setPopupType(type);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setPopupType('');
  };

  return (
    <View style={containerStyle}>
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => openPopup('privacy')}>
          <Text style={[styles.linkText, textStyle]}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={[styles.separator, textStyle]}>{separator}</Text>
        <TouchableOpacity onPress={() => openPopup('terms')}>
          <Text style={[styles.linkText, textStyle]}>Terms of Use</Text>
        </TouchableOpacity>
      </View>
      <DynamicContentPopup
        visible={popupVisible}
        type={popupType}
        onClose={closePopup}
        // fetchContent={fetchContent}
        staticContent={staticContent}
        themeStyles={themeStyles}
        headerBackground={headerBackground}
        headerTextColor={headerTextColor}
        fetchContent={fetchPolicy}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 5,
  },
});

export default LegalLinksPopup;
