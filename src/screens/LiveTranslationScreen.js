import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import translationService from '../services/translationService';
import speechService from '../services/speechService';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import {
  Card,
  Button,
  TextInput,
  IconButton,
  Portal,
  Modal,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import * as Device from 'expo-device';
import UserService from '../services/UserService';

const languages = [
  { code: 'English', name: 'English', flag: '🇺🇸' },
  { code: 'Spanish', name: 'Español', flag: '🇪🇸' },
  { code: 'French', name: 'Français', flag: '🇫🇷' },
  { code: 'German', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'Italian', name: 'Italiano', flag: '🇮🇹' },
  { code: 'Portuguese', name: 'Português', flag: '🇵🇹' },
  { code: 'Russian', name: 'Русский', flag: '🇷🇺' },
  { code: 'Japanese', name: '日本語', flag: '🇯🇵' },
  { code: 'Korean', name: '한국어', flag: '🇰🇷' },
  { code: 'Chinese', name: '中文', flag: '🇨🇳' },
  { code: 'Arabic', name: 'العربية', flag: '🇸🇦' },
  { code: 'Hindi', name: 'हिन्दी', flag: '🇮🇳' },
];

export default function LiveTranslationScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSelectionType, setLanguageSelectionType] = useState('source');
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [usage, setUsage] = useState(0);
  const [subscription, setSubscription] = useState({ plan: 'free', usage: 0 });
  const [deviceAllowed, setDeviceAllowed] = useState(true);
  const WEEKLY_LIMITS = { free: 30, weekly: 180, monthly: 9999, yearly: 9999 };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const saveToHistory = async (original, translated, type = 'voice') => {
    try {
      if (!user) return;
      
      const historyItem = {
        id: Date.now().toString(),
        original,
        translated,
        sourceLanguage,
        targetLanguage,
        type,
        timestamp: new Date().toISOString(),
      };

      // This would typically save to AsyncStorage or a database
      console.log('Saving to history:', historyItem);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const checkCooldown = () => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime;
    const cooldownPeriod = 2000; // 2 seconds

    if (timeSinceLastAction < cooldownPeriod) {
      Alert.alert('Please wait', 'Please wait a moment before trying again.');
      return false;
    }

    setLastActionTime(now);
    return true;
  };

  // Initialize services
  useEffect(() => {
    // Initialize services with API key
    const apiKey = process.env.OPENAI_API_KEY || 'your_openai_api_key_here';
    translationService.initialize(apiKey);
    speechService.initialize(apiKey);
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const deviceId = Device.osInternalBuildId || Device.deviceName || 'unknown-device';
      const allowed = await UserService.checkDevice(user.id, deviceId);
      setDeviceAllowed(allowed);
      const sub = await UserService.getSubscription(user.id);
      setSubscription(sub);
      const used = await UserService.getUsage(user.id);
      setUsage(used);
    })();
  }, [user]);

  // Before starting translation, check usage
  const canTranslate = () => {
    const limit = WEEKLY_LIMITS[subscription.plan] || 30;
    return usage < limit;
  };

  // After each translation, update usage
  const afterTranslate = async (minutes) => {
    if (user) {
      await UserService.updateUsage(user.id, minutes);
      const used = await UserService.getUsage(user.id);
      setUsage(used);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const startListening = async () => {
    try {
      // Check cooldown before starting
      if (!checkCooldown()) {
        return;
      }

      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required for speech recognition');
        return;
      }

      setIsListening(true);
      setIsRecording(true);
      setCurrentText('Listening...');
      setTranslatedText('');

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsListening(false);
      setIsRecording(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsRecording(false);
      setCurrentText('Processing...');

      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAudioUri(uri);
        setRecording(null);

        // Transcribe the audio
        await transcribeAudio(uri);
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsListening(false);
      setIsRecording(false);
      setCurrentText('');
    }
  };

  const transcribeAudio = async (uri) => {
    try {
      setIsTranslating(true);
      
      // Transcribe using OpenAI Whisper
      const transcription = await speechService.transcribeAudio(uri);
      
      if (transcription && transcription.success) {
        setCurrentText(transcription.text);
        // Translate the transcribed text
        await translateText(transcription.text);
      } else {
        setCurrentText('Could not transcribe audio. Please try again.');
        setIsTranslating(false);
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setCurrentText('Error transcribing audio. Please try again.');
      setIsTranslating(false);
    }
  };

  const translateText = async (text) => {
    try {
      setIsTranslating(true);
      
      const translation = await translationService.translateText(text, sourceLanguage, targetLanguage);
      
      if (translation && translation.success) {
        setTranslatedText(translation.translatedText);
        // Save to history
        await saveToHistory(text, translation.translatedText, 'voice');
        await afterTranslate(1); // Use 1 minute as default translation time
      } else {
        setTranslatedText('Translation failed. Please try again.');
      }

    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Error translating text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speakTranslation = async () => {
    if (!translatedText) return;

    try {
      // Use OpenAI GPT-4o TTS for speech
      // Map targetLanguage to language code (default to 'en' if not found)
      const languageMap = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Italian': 'it',
        'Portuguese': 'pt',
        'Russian': 'ru',
        'Japanese': 'ja',
        'Korean': 'ko',
        'Chinese': 'zh',
        'Arabic': 'ar',
        'Hindi': 'hi',
      };
      const langCode = languageMap[targetLanguage] || 'en';
      await speechService.speakWithOpenAITTS(translatedText, langCode);
    } catch (error) {
      console.error('Speech error:', error);
      Alert.alert('Error', 'Failed to speak translation');
    }
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  const LanguageModal = () => {
    const modalBgColor = theme?.colors?.surface || '#ffffff';
    const textColor = theme?.colors?.onSurface || '#000000';
    const primaryColor = theme?.colors?.primary || '#1976D2';
    
    return (
      <Portal>
        <Modal
          visible={showLanguageModal}
          onDismiss={() => setShowLanguageModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: modalBgColor }]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: textColor }}>
                Select Language
              </Text>
              <IconButton
                icon="close"
                onPress={() => setShowLanguageModal(false)}
              />
            </View>
            <View style={styles.languageListContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageItem,
                      {
                        backgroundColor: modalBgColor,
                        borderColor: primaryColor,
                      }
                    ]}
                    onPress={() => {
                      if (languageSelectionType === 'source') {
                        setSourceLanguage(language.code);
                      } else {
                        setTargetLanguage(language.code);
                      }
                      setShowLanguageModal(false);
                    }}
                  >
                    <Text style={[styles.languageFlag, { color: textColor }]}>
                      {language.flag}
                    </Text>
                    <Text style={[styles.languageName, { color: textColor }]}>
                      {language.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  const cardBgColor = theme?.colors?.surface || '#ffffff';
  const textColor = theme?.colors?.onSurface || '#000000';
  const primaryColor = theme?.colors?.primary || '#1976D2';
  const surfaceVariantColor = theme?.colors?.surfaceVariant || '#f5f5f5';

  if (!deviceAllowed) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Your subscription is active on another device.</Text></View>;
  }
  if (!canTranslate()) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>You have reached your weekly limit. Upgrade to continue.</Text></View>;
  }

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: theme?.colors?.background || '#f5f5f5' }]}>
        <Card style={[styles.card, { backgroundColor: cardBgColor }]}>
          <Card.Content>
            {/* Language Selection */}
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={[styles.languageButton, { backgroundColor: surfaceVariantColor }]}
                onPress={() => {
                  setLanguageSelectionType('source');
                  setShowLanguageModal(true);
                }}
              >
                <Text style={[styles.languageText, { color: textColor }]}>
                  {languages.find(l => l.code === sourceLanguage)?.flag} {sourceLanguage}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={textColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.swapButton}
                onPress={swapLanguages}
                disabled={isListening || isTranslating}
              >
                <MaterialIcons name="swap-horiz" size={24} color={primaryColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languageButton, { backgroundColor: surfaceVariantColor }]}
                onPress={() => {
                  setLanguageSelectionType('target');
                  setShowLanguageModal(true);
                }}
              >
                <Text style={[styles.languageText, { color: textColor }]}>
                  {languages.find(l => l.code === targetLanguage)?.flag} {targetLanguage}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Voice Recording Section */}
            <View style={styles.recordingSection}>
              <Animated.View
                style={[
                  styles.recordButton,
                  {
                    backgroundColor: isListening ? '#ff4444' : primaryColor,
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.recordButtonInner}
                  onPress={isListening ? stopListening : startListening}
                  disabled={isTranslating}
                >
                  {isListening ? (
                    <MaterialIcons name="stop" size={40} color="white" />
                  ) : (
                    <MaterialIcons name="mic" size={40} color="white" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Text style={[styles.recordButtonText, { color: textColor }]}>
                {isListening ? 'Tap to stop' : 'Tap to speak'}
              </Text>
            </View>

            {/* Text Display */}
            <View style={styles.textContainer}>
              {currentText && (
                <View style={styles.textSection}>
                  <Text style={[styles.textLabel, { color: textColor }]}>
                    {sourceLanguage}:
                  </Text>
                  <Text style={[styles.textContent, { color: textColor }]}>
                    {currentText}
                  </Text>
                </View>
              )}

              {isTranslating && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text style={[styles.loadingText, { color: textColor }]}>
                    Translating...
                  </Text>
                </View>
              )}

              {translatedText && (
                <View style={styles.textSection}>
                  <View style={styles.translatedHeader}>
                    <Text style={[styles.textLabel, { color: textColor }]}>
                      {targetLanguage}:
                    </Text>
                    <TouchableOpacity
                      onPress={speakTranslation}
                      style={styles.speakButton}
                    >
                      <MaterialIcons name="volume-up" size={20} color={primaryColor} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.textContent, { color: textColor }]}>
                    {translatedText}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <LanguageModal />
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    marginBottom: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  swapButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textContainer: {
    flex: 1,
  },
  textSection: {
    marginBottom: 16,
  },
  textLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  translatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  speakButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  languageListContainer: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    flex: 1,
  },
}); 