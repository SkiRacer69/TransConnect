import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import UserService from '../services/UserService';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

function getDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat)/2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function NearbyScreen() {
  const [location, setLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      // Save user's location (for demo)
      await UserService.updateUserProfile(user.id, { location: loc.coords });
      // Get all users and filter by distance
      const allUsers = await UserService.getAllUsers();
      const nearby = allUsers.filter(u =>
        u.id !== user.id &&
        u.location &&
        getDistance(loc.coords.latitude, loc.coords.longitude, u.location.latitude, u.location.longitude) < 1 // 1km radius
      );
      setNearbyUsers(nearby);
      setLoading(false);
    })();
  }, []);

  const connectToUser = (otherUser) => {
    Alert.alert('Connected!', `You are now connected with ${otherUser.firstName}`);
    navigation.navigate('Call', { otherUser });
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Users</Text>
      <FlatList
        data={nearbyUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => connectToUser(item)}>
            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.userPhone}>{item.phoneNumber}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No users nearby.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  userItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  userName: { fontSize: 18 },
  userPhone: { fontSize: 14, color: '#888' },
}); 