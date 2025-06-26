import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  List,
  Divider,
  Surface,
  Button,
  Avatar,
  Card,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import UserService from '../services/UserService';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const userData = await UserService.exportUserData();
      Alert.alert(
        'User Data Export',
        `Total Users: ${userData.totalUsers}\n\nCurrent User: ${userData.currentUser ? `${userData.currentUser.firstName} ${userData.currentUser.lastName}` : 'None'}\n\nAll Users:\n${userData.allUsers.map(u => `- ${u.firstName} ${u.lastName} (${u.email})`).join('\n')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to send an email to our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Email', 
          onPress: () => {
            const email = 'andy.li.zh2010@gmail.com';
            const subject = 'TransConnection Support Request';
            const body = `Hello,\n\nI need help with TransConnection.\n\nUser: ${user ? `${user.firstName} ${user.lastName}` : 'Guest'}\nEmail: ${user ? user.email : 'Not signed in'}\n\nIssue:\n`;
            
            const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            Linking.canOpenURL(mailtoUrl).then(supported => {
              if (supported) {
                Linking.openURL(mailtoUrl);
              } else {
                Alert.alert('Error', 'No email app found on your device');
              }
            });
          }
        },
      ]
    );
  };

  const userProfile = {
    name: user ? `${user.firstName} ${user.lastName}` : 'Guest User',
    email: user ? user.email : 'guest@example.com',
    phoneNumber: user ? user.phoneNumber : 'N/A',
    avatar: 'https://via.placeholder.com/100',
    premium: true,
    translationsToday: 127,
    totalTranslations: 1543,
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          subtitle: userProfile.name,
          type: 'navigate',
          icon: 'account-circle',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          title: 'Email',
          subtitle: userProfile.email,
          type: 'navigate',
          icon: 'email',
          onPress: () => Alert.alert('Email', 'Email editing coming soon!'),
        },
        {
          title: 'Phone Number',
          subtitle: userProfile.phoneNumber,
          type: 'navigate',
          icon: 'phone',
          onPress: () => Alert.alert('Phone', 'Phone number editing coming soon!'),
        },
        {
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          type: 'navigate',
          icon: 'logout',
          onPress: handleSignOut,
        },
      ],
    },
    {
      title: 'Translation Settings',
      items: [
        {
          title: 'Auto-translate',
          subtitle: 'Automatically translate speech',
          type: 'switch',
          value: autoTranslate,
          onValueChange: setAutoTranslate,
          icon: 'auto-fix',
        },
        {
          title: 'Voice Feedback',
          subtitle: 'Speak translated text aloud',
          type: 'switch',
          value: voiceFeedback,
          onValueChange: setVoiceFeedback,
          icon: 'volume-high',
        },
        {
          title: 'Save Translation History',
          subtitle: 'Store your translations locally',
          type: 'switch',
          value: saveHistory,
          onValueChange: setSaveHistory,
          icon: 'history',
        },
        {
          title: 'Offline Mode',
          subtitle: 'Use offline translation models',
          type: 'switch',
          value: offlineMode,
          onValueChange: setOfflineMode,
          icon: 'wifi-off',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'switch',
          value: isDarkMode,
          onValueChange: toggleTheme,
          icon: 'weather-night',
        },
        {
          title: 'Notifications',
          subtitle: 'Receive app notifications',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
          icon: 'bell',
        },
        {
          title: 'Language',
          subtitle: 'English (US)',
          type: 'navigate',
          icon: 'translate',
          onPress: () => Alert.alert('Language', 'Language selection coming soon!'),
        },
        {
          title: 'Region',
          subtitle: 'United States',
          type: 'navigate',
          icon: 'earth',
          onPress: () => Alert.alert('Region', 'Region selection coming soon!'),
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          title: 'Export Data',
          subtitle: 'View all stored user data',
          type: 'navigate',
          icon: 'download',
          onPress: handleExportData,
        },
        {
          title: 'Clear History',
          subtitle: 'Delete all translation history',
          type: 'navigate',
          icon: 'delete',
          onPress: () => {
            Alert.alert(
              'Clear History',
              'Are you sure you want to delete all translation history? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Success', 'History cleared!') },
              ]
            );
          },
        },
        {
          title: 'Privacy Policy',
          subtitle: 'Read our privacy policy',
          type: 'navigate',
          icon: 'shield-check',
          onPress: () => Alert.alert('Privacy Policy', 'Privacy policy coming soon!'),
        },
        {
          title: 'Terms of Service',
          subtitle: 'Read our terms of service',
          type: 'navigate',
          icon: 'file-document',
          onPress: () => Alert.alert('Terms', 'Terms of service coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Help & FAQ',
          subtitle: 'Get help and find answers',
          type: 'navigate',
          icon: 'help-circle',
          onPress: () => Alert.alert('Help', 'Help section coming soon!'),
        },
        {
          title: 'Contact Support',
          subtitle: 'Send email to andy.li.zh2010@gmail.com',
          type: 'navigate',
          icon: 'email',
          onPress: handleContactSupport,
        },
        {
          title: 'Rate App',
          subtitle: 'Rate us on the app store',
          type: 'navigate',
          icon: 'star',
          onPress: () => Alert.alert('Rate', 'App rating coming soon!'),
        },
        {
          title: 'Share App',
          subtitle: 'Share with friends and family',
          type: 'navigate',
          icon: 'share-variant',
          onPress: () => Alert.alert('Share', 'Share app coming soon!'),
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    const isLast = index === settingsSections.find(section => 
      section.items.includes(item)
    ).items.length - 1;

    return (
      <React.Fragment key={item.title}>
        <List.Item
          title={item.title}
          description={item.subtitle}
          left={(props) => (
            <List.Icon
              {...props}
              icon={item.icon}
              color={theme.colors.primary}
            />
          )}
          right={() => {
            if (item.type === 'switch') {
              return (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: theme.colors.outline, true: theme.colors.primaryContainer }}
                  thumbColor={item.value ? theme.colors.primary : theme.colors.outline}
                />
              );
            } else if (item.type === 'navigate') {
              return (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
              );
            }
            return null;
          }}
          onPress={item.onPress}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
        {!isLast && <Divider style={{ marginLeft: 56 }} />}
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileSection}>
          <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.profileContent}>
              <View style={styles.profileHeader}>
                <Avatar.Image
                  size={60}
                  source={{ uri: userProfile.avatar }}
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                />
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {userProfile.name}
                    </Text>
                    {userProfile.premium && (
                      <Chip
                        icon="crown"
                        style={[styles.premiumChip, { backgroundColor: theme.colors.secondaryContainer }]}
                        textStyle={{ color: theme.colors.secondary }}
                      >
                        Premium
                      </Chip>
                    )}
                  </View>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {userProfile.email}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {userProfile.translationsToday}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Today
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {userProfile.totalTranslations}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Total
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {section.title}
            </Text>
            <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </Surface>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            TransConnection v1.0.0
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            © 2024 TransConnection. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileCard: {
    elevation: 2,
    borderRadius: 16,
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  premiumChip: {
    height: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 12,
    elevation: 2,
  },
  accountSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  accountButton: {
    borderRadius: 8,
  },
  versionSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 4,
  },
}); 