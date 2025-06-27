// Speech Service for TransConnection App
// Handles speech-to-text transcription using OpenAI Whisper API

class SpeechService {
  constructor() {
    this.apiKey = null;
    this.whisperUrl = 'https://api.openai.com/v1/audio/transcriptions';
    this.supportedLanguages = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
    };
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests
  }

  // Initialize with API key
  initialize(apiKey) {
    this.apiKey = apiKey;
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Retry mechanism with exponential backoff
  async retryRequest(requestFn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        return await requestFn();
      } catch (error) {
        if (error.message.includes('429') && attempt < maxRetries - 1) {
          // Rate limited - wait longer before retry
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }

  // Transcribe audio file using Whisper API
  async transcribeAudio(audioUri, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      return await this.retryRequest(async () => {
        // Create form data for audio file
        const formData = new FormData();
        formData.append('file', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        });
        formData.append('model', 'whisper-1');
        formData.append('language', language);
        formData.append('response_format', 'json');

        const response = await fetch(this.whisperUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 'Unknown error';
          
          if (response.status === 429) {
            throw new Error(`Rate limit exceeded: ${errorMessage}`);
          } else if (response.status === 401) {
            throw new Error(`Authentication failed: ${errorMessage}`);
          } else if (response.status === 400) {
            throw new Error(`Invalid request: ${errorMessage}`);
          } else {
            throw new Error(`Whisper API error: ${response.status} - ${errorMessage}`);
          }
        }

        const data = await response.json();
        
        return {
          success: true,
          text: data.text,
          language: data.language,
          duration: data.duration,
          timestamp: new Date().toISOString(),
        };
      });

    } catch (error) {
      console.error('Speech transcription error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Transcription failed';
      if (error.message.includes('Rate limit')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('Authentication')) {
        userMessage = 'API key error. Please check your configuration.';
      } else if (error.message.includes('Invalid request')) {
        userMessage = 'Invalid audio format. Please try recording again.';
      }
      
      return {
        success: false,
        error: error.message,
        userMessage,
        text: null,
        language: null,
        duration: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Detect language from audio
  async detectLanguageFromAudio(audioUri) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      return await this.retryRequest(async () => {
        const formData = new FormData();
        formData.append('file', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        });
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');

        const response = await fetch(this.whisperUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 'Unknown error';
          
          if (response.status === 429) {
            throw new Error(`Rate limit exceeded: ${errorMessage}`);
          } else if (response.status === 401) {
            throw new Error(`Authentication failed: ${errorMessage}`);
          } else if (response.status === 400) {
            throw new Error(`Invalid request: ${errorMessage}`);
          } else {
            throw new Error(`Language detection error: ${response.status} - ${errorMessage}`);
          }
        }

        const data = await response.json();
        
        return {
          success: true,
          detectedLanguage: data.language,
          languageName: this.supportedLanguages[data.language] || 'Unknown',
          confidence: 0.95,
          text: data.text,
        };
      });

    } catch (error) {
      console.error('Language detection error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Language detection failed';
      if (error.message.includes('Rate limit')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('Authentication')) {
        userMessage = 'API key error. Please check your configuration.';
      } else if (error.message.includes('Invalid request')) {
        userMessage = 'Invalid audio format. Please try recording again.';
      }
      
      return {
        success: false,
        error: error.message,
        userMessage,
        detectedLanguage: 'en',
        languageName: 'English',
        confidence: 0.0,
        text: null,
      };
    }
  }

  // Get supported languages for Whisper
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is supported
  isLanguageSupported(languageCode) {
    return languageCode in this.supportedLanguages;
  }

  // Generate and play speech using OpenAI GPT-4o TTS
  async speakWithOpenAITTS(text, languageCode = 'en') {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }
    // Map language code to OpenAI TTS voice
    // 'onyx' (English), 'nova' (Spanish), 'shimmer' (French), default to 'onyx'
    const voiceMap = {
      'en': 'onyx',
      'es': 'nova',
      'fr': 'shimmer',
      // Add more mappings as OpenAI releases more voices
    };
    const voice = voiceMap[languageCode] || 'onyx';
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS error: ${response.status} - ${errorText}`);
      }
      // Get audio data as a blob
      const audioData = await response.blob();
      // Save to a local file
      const fileReaderInstance = new FileReader();
      return new Promise((resolve, reject) => {
        fileReaderInstance.onloadend = async () => {
          const base64data = fileReaderInstance.result.split(',')[1];
          const fileUri = `${FileSystem.cacheDirectory}openai_tts.mp3`;
          await FileSystem.writeAsStringAsync(fileUri, base64data, { encoding: FileSystem.EncodingType.Base64 });
          // Play the audio
          const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
          await sound.playAsync();
          resolve();
        };
        fileReaderInstance.onerror = reject;
        fileReaderInstance.readAsDataURL(audioData);
      });
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const speechService = new SpeechService();
export default speechService; 