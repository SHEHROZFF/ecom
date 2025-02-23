// src/screens/SettingsScreen.js

import React, { useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeContext } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../themes';
import { UserContext } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation();

  // Theme & Auth
  const { theme, toggleTheme } = useContext(ThemeContext);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { logout } = useContext(UserContext);

  // Local State
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [aboutUsVisible, setAboutUsVisible] = useState(false);

  // (Optional) Animations for future use
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Handlers
  const toggleNotifications = () => setIsNotificationsEnabled((prev) => !prev);
  const handleToggleTheme = () => toggleTheme();
  const handleNavigate = (screen) => navigation.navigate(screen);
  const handleLogout = async () => {
    const response = await logout();
    // Optionally navigate to Login or display an alert
  };
  const handleAboutUsPress = () => setAboutUsVisible(true);
  const closeAboutUsModal = () => setAboutUsVisible(false);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Bold, Modern Header */}
        <LinearGradient
          colors={currentTheme.headerBackground}
          style={styles.uniqueHeader}
          start={[0, 0]}
          end={[1, 1]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.headerTextColor} />
          </TouchableOpacity>
          <Text style={[styles.uniqueHeaderTitle, { color: currentTheme.headerTextColor }]}>
            App Settings
          </Text>
        </LinearGradient>

        {/* Card-Style Settings Options */}
        <View style={styles.cardsContainer}>
          {/* Enable Notifications */}
          <TouchableOpacity style={[styles.card, { borderColor: currentTheme.borderColor }]} activeOpacity={0.8}>
            <View style={styles.cardRow}>
              <Ionicons name="notifications" size={24} color={currentTheme.primaryColor} style={styles.icon} />
              <Text style={[styles.cardText, { color: currentTheme.textColor }]}>
                Enable Notifications
              </Text>
            </View>
            <Switch
              trackColor={{
                false: currentTheme.switchTrackColorFalse,
                true: currentTheme.switchTrackColorTrue,
              }}
              thumbColor={currentTheme.switchThumbColor}
              ios_backgroundColor={currentTheme.switchIosBackgroundColor}
              onValueChange={toggleNotifications}
              value={isNotificationsEnabled}
            />
          </TouchableOpacity>

          {/* Dark Theme */}
          <TouchableOpacity style={[styles.card, { borderColor: currentTheme.borderColor }]} activeOpacity={0.8}>
            <View style={styles.cardRow}>
              <Ionicons name="moon" size={24} color={currentTheme.primaryColor} style={styles.icon} />
              <Text style={[styles.cardText, { color: currentTheme.textColor }]}>
                Dark Theme
              </Text>
            </View>
            <Switch
              trackColor={{
                false: currentTheme.switchTrackColorFalse,
                true: currentTheme.switchTrackColorTrue,
              }}
              thumbColor={currentTheme.switchThumbColor}
              ios_backgroundColor={currentTheme.switchIosBackgroundColor}
              onValueChange={handleToggleTheme}
              value={theme === 'dark'}
            />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.card, { borderColor: currentTheme.borderColor }]}
            activeOpacity={0.8}
            onPress={() => handleNavigate('ChangePassword')}
          >
            <View style={styles.cardRow}>
              <Ionicons name="lock-closed" size={24} color={currentTheme.primaryColor} style={styles.icon} />
              <Text style={[styles.cardText, { color: currentTheme.textColor }]}>
                Change Password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.placeholderTextColor} />
          </TouchableOpacity>

          {/* My Enrollments */}
          <TouchableOpacity
            style={[styles.card, { borderColor: currentTheme.borderColor }]}
            activeOpacity={0.8}
            onPress={() => handleNavigate('MyEnrollmentsScreen')}
          >
            <View style={styles.cardRow}>
              <Ionicons name="school" size={24} color={currentTheme.primaryColor} style={styles.icon} />
              <Text style={[styles.cardText, { color: currentTheme.textColor }]}>
                My Enrollments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.placeholderTextColor} />
          </TouchableOpacity>

          {/* About Us */}
          <TouchableOpacity
            style={[styles.card, { borderColor: currentTheme.borderColor }]}
            activeOpacity={0.8}
            onPress={handleAboutUsPress}
          >
            <View style={styles.cardRow}>
              <Ionicons name="information-circle" size={24} color={currentTheme.primaryColor} style={styles.icon} />
              <Text style={[styles.cardText, { color: currentTheme.textColor }]}>
                About Us
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.placeholderTextColor} />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: currentTheme.primaryColor }]}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About Us Modal */}
      <Modal visible={aboutUsVisible} animationType="fade" transparent onRequestClose={closeAboutUsModal}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.cardTextColor }]}>About Us</Text>
              <TouchableOpacity
                onPress={closeAboutUsModal}
                style={styles.modalCloseButton}
                accessibilityLabel="Close About Us"
              >
                <Ionicons name="close" size={24} color={currentTheme.textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>
                Welcome to House Of Cert! We are dedicated to providing an exceptional user experience through innovation, quality, and transparency. Our platform empowers learners with top-notch educational resources and seamless shopping experiences.
              </Text>
              <Text style={[styles.modalHeading, { color: currentTheme.textColor }]}>Our Mission</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>
                To empower individuals globally with high-quality learning resources and unforgettable experiences.
              </Text>
              <Text style={[styles.modalHeading, { color: currentTheme.textColor }]}>Our Team</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>
                A diverse group of creatives and experts driven by passion and innovation.
              </Text>
              <Text style={[styles.modalHeading, { color: currentTheme.textColor }]}>Our Values</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>
                • Transparency: Open, honest communication. {'\n'}• Quality: Premium products and services. {'\n'}• Integrity: Ethical practices always.
              </Text>
              <Text style={[styles.modalHeading, { color: currentTheme.textColor }]}>Get in Touch</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>
                Reach us at Idri.gueye@gmail.com.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={closeAboutUsModal}
              style={[styles.closeModalButton, { backgroundColor: currentTheme.primaryColor }]}
              accessibilityLabel="Close About Us Popup"
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  uniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 25,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
    borderRadius: 20,
  },
  uniqueHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  cardsContainer: {
    marginHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
  },
  icon: {
    marginRight: 15,
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  /* Modal Styles */
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    marginTop: 15,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  closeModalButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
