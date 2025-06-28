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
  Switch,
  HelperText,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

const SignInScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (isSignUp) {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (isSignUp && !phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (isSignUp && !/^\+\d{1,4}\d{7,15}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number with country code';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && !confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Register new user
        await signUp({
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
        });
        Alert.alert('Success', 'Account created successfully!');
      } else {
        // Sign in existing user
        await signIn(email, password);
        Alert.alert('Success', 'Signed in successfully!');
      }
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearForm();
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
            <Title style={[styles.title, { color: theme.colors.primary }]}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Title>
            <Paragraph style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              {isSignUp 
                ? 'Sign up to start using TransConnection'
                : 'Sign in to continue using TransConnection'
              }
            </Paragraph>

            {isSignUp && (
              <>
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

                <PhoneInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  error={!!errors.phoneNumber}
                  placeholder="Enter phone number"
                />
                <HelperText type="error" visible={!!errors.phoneNumber}>
                  {errors.phoneNumber}
                </HelperText>
              </>
            )}

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

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              error={!!errors.password}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            {isSignUp && (
              <>
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.confirmPassword}>
                  {errors.confirmPassword}
                </HelperText>
              </>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: theme.colors.onSurface }]}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Button
                mode="text"
                onPress={toggleMode}
                style={styles.switchButton}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
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
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  switchText: {
    opacity: 0.7,
  },
  switchButton: {
    marginLeft: 4,
  },
});

export default SignInScreen; 