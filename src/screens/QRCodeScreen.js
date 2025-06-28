import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'qrcode';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from 'react-native-paper';
import UserService from '../services/UserService';

export default function QRCodeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (user) {
      generateQRCode();
    }
  }, [user]);

  const generateQRCode = async () => {
    try {
      const data = user.id || user.phoneNumber;
      const qrCodeUrl = await QRCode.toDataURL(data);
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
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
          {qrCodeDataUrl && (
            <Image 
              source={{ uri: qrCodeDataUrl }} 
              style={styles.qrCode} 
              resizeMode="contain"
            />
          )}
        </Card.Content>
      </Card>
      <Button mode="contained" onPress={() => setScanning(!scanning)} style={styles.button}>
        {scanning ? 'Stop Scanning' : 'Scan QR Code'}
      </Button>
      {scanning && (
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={styles.scanner}
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
  qrCode: { width: 200, height: 200 },
}); 