import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, StyleSheet, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import LiveTranslationScreen from './src/screens/LiveTranslationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SignInScreen from './src/screens/SignInScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';
import NearbyScreen from './src/screens/NearbyScreen';
import CallScreen from './src/screens/CallScreen';

// Import context and theme
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  
  if (!theme) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#ffffff' }]}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Live Translation') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'TransConnection' }}
      />
      <Tab.Screen 
        name="Live Translation" 
        component={LiveTranslationScreen}
        options={{ title: 'Live Translation' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Translation History' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { theme, loading: themeLoading } = useTheme();

  if (authLoading || themeLoading || !theme) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#ffffff' }]}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: theme.colors.background,
          border: theme.colors.outline,
          card: theme.colors.surface,
          primary: theme.colors.primary,
          text: theme.colors.onSurface,
          notification: theme.colors.error,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Edit Profile', headerStyle: { backgroundColor: theme.colors.primary }, headerTintColor: theme.colors.onPrimary, headerTitleStyle: { fontWeight: 'bold' }, }} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ headerShown: true, title: 'QR Code Connect' }} />
            <Stack.Screen name="Nearby" component={NearbyScreen} options={{ headerShown: true, title: 'Nearby Users' }} />
            <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1976D2" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
