import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LiveTranslationScreen from './LiveTranslationScreen';

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { otherUser } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>In-App Call</Text>
        {otherUser && (
          <>
            <Text style={styles.userName}>{otherUser.firstName} {otherUser.lastName}</Text>
            <Text style={styles.userPhone}>{otherUser.phoneNumber}</Text>
          </>
        )}
        <TouchableOpacity style={styles.endCallButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>
      </View>
      {/* Reuse the live translation UI for the call */}
      <View style={styles.translationContainer}>
        <LiveTranslationScreen />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  userName: { fontSize: 20, marginTop: 8 },
  userPhone: { fontSize: 16, color: '#888' },
  endCallButton: { marginTop: 16, backgroundColor: '#ff4444', padding: 12, borderRadius: 8 },
  endCallText: { color: 'white', fontWeight: 'bold' },
  translationContainer: { flex: 1 },
}); 