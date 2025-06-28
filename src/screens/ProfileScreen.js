import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
  HelperText,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  
  // Error states
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+\d{1,4}\d{7,15}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number with country code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      firstName !== user?.firstName ||
      lastName !== user?.lastName ||
      email !== user?.email ||
      phoneNumber !== user?.phoneNumber
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Text 
                size={80} 
                label={`${firstName.charAt(0)}${lastName.charAt(0)}`}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              />
              <Title style={[styles.title, { color: theme.colors.primary }]}>Edit Profile</Title>
              <Paragraph style={[styles.subtitle, { color: theme.colors.onSurface }]}>
                Update your personal information
              </Paragraph>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={styles.input}
              error={!!errors.firstName}
              autoCapitalize="words"
            />
            <HelperText type="error" visible={!!errors.firstName}>
              {errors.firstName}
            </HelperText>

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
              error={!!errors.lastName}
              autoCapitalize="words"
            />
            <HelperText type="error" visible={!!errors.lastName}>
              {errors.lastName}
            </HelperText>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <PhoneInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              error={!!errors.phoneNumber}
              placeholder="Enter phone number"
            />
            <HelperText type="error" visible={!!errors.phoneNumber}>
              {errors.phoneNumber}
            </HelperText>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.button, styles.cancelButton]}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
                loading={loading}
                disabled={loading || !hasChanges()}
              >
                Save Changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  divider: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: '#E2E8F0',
  },
});

export default ProfileScreen; 