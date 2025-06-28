import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from 'react-native-paper';
import UserService from '../services/UserService';

export default function QRCodeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setScanning(false);
    // Assume data is user ID or phone number
    const connectedUser = await UserService.findUserByIdOrPhone(data);
    if (connectedUser) {
      Alert.alert('Connected!', `You are now connected with ${connectedUser.firstName}`);
      navigation.navigate('Call', { otherUser: connectedUser });
    } else {
      Alert.alert('User not found', 'No user found for this QR code.');
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Your QR Code" />
        <Card.Content>
          {user && (
            <QRCode
              value={user.id || user.phoneNumber || 'unknown'}
              size={200}
            />
          )}
        </Card.Content>
      </Card>
      <Button mode="contained" onPress={() => { setScanning(!scanning); setScanned(false); }} style={styles.button}>
        {scanning ? 'Stop Scanning' : 'Scan QR Code'}
      </Button>
      {scanning && (
        <Camera
          ref={cameraRef}
          style={styles.scanner}
          type="back"
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { marginBottom: 24, width: '100%', alignItems: 'center' },
  button: { marginVertical: 16 },
  scanner: { width: 300, height: 300, marginTop: 16 },
}); 