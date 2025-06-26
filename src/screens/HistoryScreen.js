import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  List,
  Divider,
  FAB,
  Menu,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'translation_history';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load translation history from storage
  useEffect(() => {
    loadTranslationHistory();
  }, []);

  const loadTranslationHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        // Filter by current user if signed in
        const userHistory = user ? history.filter(item => item.userId === user.id) : history;
        setTranslations(userHistory);
      }
    } catch (error) {
      console.error('Error loading translation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTranslationHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving translation history:', error);
    }
  };

  const addTranslation = async (translation) => {
    const newTranslation = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
      ...translation,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newTranslation, ...translations];
    setTranslations(updatedHistory);
    await saveTranslationHistory(updatedHistory);
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all translation history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: async () => {
            setTranslations([]);
            await AsyncStorage.removeItem(HISTORY_KEY);
            Alert.alert('Success', 'Translation history cleared!');
          }
        },
      ]
    );
  };

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Voice', value: 'voice' },
    { label: 'Text', value: 'text' },
    { label: 'Camera', value: 'camera' },
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
  ];

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'voice':
        return 'mic';
      case 'text':
        return 'text';
      case 'camera':
        return 'camera';
      default:
        return 'translate';
    }
  };

  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = translation.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         translation.translated.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || translation.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const renderTranslationItem = ({ item }) => (
    <Card style={[styles.translationCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.translationHeader}>
          <View style={styles.translationMeta}>
            <View style={styles.typeContainer}>
              <Ionicons 
                name={getTypeIcon(item.type)} 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                {item.type.toUpperCase()}
              </Text>
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
        
        <View style={styles.translationContent}>
          <View style={styles.languageRow}>
            <Chip 
              mode="outlined" 
              compact 
              style={[styles.languageChip, { borderColor: theme.colors.outline }]}
            >
              {item.fromLang}
            </Chip>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.onSurfaceVariant} />
            <Chip 
              mode="outlined" 
              compact 
              style={[styles.languageChip, { borderColor: theme.colors.outline }]}
            >
              {item.toLang}
            </Chip>
          </View>
          
          <Text variant="bodyLarge" style={[styles.originalText, { color: theme.colors.onSurface }]}>
            {item.original}
          </Text>
          <Text variant="bodyLarge" style={[styles.translatedText, { color: theme.colors.primary }]}>
            {item.translated}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.onSurface }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Translation History
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {filteredTranslations.length} translations found
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search translations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.onSurfaceVariant}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              mode={selectedFilter === filter.value ? 'flat' : 'outlined'}
              onPress={() => setSelectedFilter(filter.value)}
              style={[
                styles.filterChip,
                selectedFilter === filter.value && { backgroundColor: theme.colors.primaryContainer }
              ]}
              textStyle={{ color: selectedFilter === filter.value ? theme.colors.primary : theme.colors.onSurface }}
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Translation List */}
      {filteredTranslations.length > 0 ? (
        <FlatList
          data={filteredTranslations}
          renderItem={renderTranslationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            No translations yet
          </Text>
          <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Start translating to see your history here
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Live Translation')}
            style={styles.startButton}
          >
            Start Translating
          </Button>
        </View>
      )}

      {/* FAB Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('Live Translation');
          }}
          title="New Translation"
          leadingIcon="mic"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            clearHistory();
          }}
          title="Clear History"
          leadingIcon="delete"
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  translationCard: {
    elevation: 2,
    borderRadius: 12,
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  translationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translationContent: {
    gap: 8,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageChip: {
    height: 24,
  },
  originalText: {
    fontWeight: '500',
  },
  translatedText: {
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: 16,
  },
  emptySubtitle: {
    marginBottom: 24,
  },
  startButton: {
    marginTop: 24,
  },
}); 