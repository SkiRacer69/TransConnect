import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Surface,
  Avatar,
  List,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const quickActions = [
    {
      title: 'Live Translation',
      subtitle: 'Real-time voice translation',
      icon: 'mic',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Live Translation'),
    },
    {
      title: 'Text Translation',
      subtitle: 'Translate written text',
      icon: 'text',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('Live Translation'),
    },
    {
      title: 'Camera Translation',
      subtitle: 'Translate text from images',
      icon: 'camera',
      color: theme.colors.tertiary,
      onPress: () => navigation.navigate('Live Translation'),
    },
  ];

  const recentTranslations = [
    {
      id: 1,
      original: 'Hello, how are you?',
      translated: 'Hola, ¿cómo estás?',
      fromLang: 'English',
      toLang: 'Spanish',
      timestamp: '2 minutes ago',
    },
    {
      id: 2,
      original: 'Thank you very much',
      translated: 'Merci beaucoup',
      fromLang: 'English',
      toLang: 'French',
      timestamp: '5 minutes ago',
    },
    {
      id: 3,
      original: 'Good morning',
      translated: 'Guten Morgen',
      fromLang: 'English',
      toLang: 'German',
      timestamp: '10 minutes ago',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={[styles.greeting, { color: theme.colors.onBackground }]}>
              Welcome back!
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Ready to break language barriers?
            </Text>
          </View>
          <Avatar.Icon 
            size={50} 
            icon="account" 
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.primary}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={action.onPress}
              >
                <Card.Content style={styles.actionCardContent}>
                  <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      {action.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {action.subtitle}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Translations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Recent Translations
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('History')}
              textColor={theme.colors.primary}
            >
              View All
            </Button>
          </View>
          <Surface style={[styles.recentContainer, { backgroundColor: theme.colors.surface }]}>
            {recentTranslations.map((translation, index) => (
              <React.Fragment key={translation.id}>
                <List.Item
                  title={translation.original}
                  description={translation.translated}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="translate"
                      color={theme.colors.primary}
                    />
                  )}
                  right={(props) => (
                    <View style={styles.translationMeta}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {translation.fromLang} → {translation.toLang}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {translation.timestamp}
                      </Text>
                    </View>
                  )}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
                {index < recentTranslations.length - 1 && (
                  <Divider style={{ marginHorizontal: 16 }} />
                )}
              </React.Fragment>
            ))}
          </Surface>
        </View>

        {/* Stats Card */}
        <View style={styles.section}>
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  127
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  Translations Today
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  15
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  Languages Used
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  98%
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  Accuracy Rate
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    gap: 12,
  },
  actionCard: {
    marginBottom: 8,
    elevation: 2,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  recentContainer: {
    borderRadius: 12,
    elevation: 2,
  },
  translationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statsCard: {
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
}); 