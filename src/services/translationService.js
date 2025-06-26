// Translation Service for TransConnection App
// This service handles AI translation, speech recognition, and text-to-speech

class TranslationService {
  constructor() {
    this.apiKey = null; // Will be set from environment variables
    this.baseUrl = 'https://api.openai.com/v1/chat/completions'; // Example API endpoint
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

  // Initialize the service with API key
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

  // Get language code from language name
  getLanguageCode(languageName) {
    const entry = Object.entries(this.supportedLanguages).find(
      ([code, name]) => name === languageName
    );
    return entry ? entry[0] : 'en';
  }

  // Get language name from language code
  getLanguageName(languageCode) {
    return this.supportedLanguages[languageCode] || 'English';
  }

  // Translate text using AI
  async translateText(text, sourceLanguage, targetLanguage) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const sourceCode = this.getLanguageCode(sourceLanguage);
      const targetCode = this.getLanguageCode(targetLanguage);

      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
      Provide only the translation without any additional text or explanations:
      
      "${text}"`;

      return await this.retryRequest(async () => {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional translator. Provide accurate and natural translations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 150,
            temperature: 0.3,
          }),
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
            throw new Error(`Translation API error: ${response.status} - ${errorMessage}`);
          }
        }

        const data = await response.json();
        const translation = data.choices[0].message.content.trim();

        return {
          success: true,
          originalText: text,
          translatedText: translation,
          sourceLanguage,
          targetLanguage,
          timestamp: new Date().toISOString(),
        };
      });

    } catch (error) {
      console.error('Translation error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Translation failed';
      if (error.message.includes('Rate limit')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('Authentication')) {
        userMessage = 'API key error. Please check your configuration.';
      } else if (error.message.includes('Invalid request')) {
        userMessage = 'Invalid text format. Please try again.';
      }
      
      return {
        success: false,
        error: error.message,
        userMessage,
        originalText: text,
        translatedText: null,
        sourceLanguage,
        targetLanguage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Detect language of input text
  async detectLanguage(text) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const prompt = `Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr'):
      
      "${text}"`;

      return await this.retryRequest(async () => {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a language detection expert. Respond with only the ISO 639-1 language code.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 10,
            temperature: 0.1,
          }),
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
            throw new Error(`Language detection API error: ${response.status} - ${errorMessage}`);
          }
        }

        const data = await response.json();
        const detectedCode = data.choices[0].message.content.trim().toLowerCase();
        const detectedLanguage = this.getLanguageName(detectedCode);

        return {
          success: true,
          detectedCode,
          detectedLanguage,
          confidence: 0.95, // Mock confidence score
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
        userMessage = 'Invalid text format. Please try again.';
      }
      
      return {
        success: false,
        error: error.message,
        userMessage,
        detectedCode: 'en',
        detectedLanguage: 'English',
        confidence: 0.0,
      };
    }
  }

  // Get pronunciation guide for translated text
  async getPronunciation(text, language) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const prompt = `Provide a pronunciation guide for the following ${language} text using IPA (International Phonetic Alphabet):
      
      "${text}"
      
      Respond with only the IPA pronunciation.`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a pronunciation expert. Provide IPA transcriptions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pronunciation API error: ${response.status}`);
      }

      const data = await response.json();
      const pronunciation = data.choices[0].message.content.trim();

      return {
        success: true,
        text,
        pronunciation,
        language,
      };

    } catch (error) {
      console.error('Pronunciation error:', error);
      return {
        success: false,
        error: error.message,
        text,
        pronunciation: null,
        language,
      };
    }
  }

  // Get alternative translations
  async getAlternativeTranslations(text, sourceLanguage, targetLanguage, count = 3) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const prompt = `Provide ${count} alternative translations for the following text from ${sourceLanguage} to ${targetLanguage}. 
      Each translation should be slightly different in style or formality. Respond with only the translations, one per line:
      
      "${text}"`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator providing alternative translations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Alternative translations API error: ${response.status}`);
      }

      const data = await response.json();
      const alternatives = data.choices[0].message.content.trim().split('\n').filter(t => t.trim());

      return {
        success: true,
        originalText: text,
        alternatives,
        sourceLanguage,
        targetLanguage,
      };

    } catch (error) {
      console.error('Alternative translations error:', error);
      return {
        success: false,
        error: error.message,
        originalText: text,
        alternatives: [],
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  // Validate translation quality
  async validateTranslation(originalText, translatedText, sourceLanguage, targetLanguage) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const prompt = `Rate the quality of this translation from ${sourceLanguage} to ${targetLanguage} on a scale of 1-10, where 10 is perfect.
      Provide a brief explanation for your rating.
      
      Original: "${originalText}"
      Translation: "${translatedText}"
      
      Respond with: "Rating: X/10 - [explanation]"`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a translation quality assessor.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation API error: ${response.status}`);
      }

      const data = await response.json();
      const validation = data.choices[0].message.content.trim();

      return {
        success: true,
        originalText,
        translatedText,
        validation,
        sourceLanguage,
        targetLanguage,
      };

    } catch (error) {
      console.error('Translation validation error:', error);
      return {
        success: false,
        error: error.message,
        originalText,
        translatedText,
        validation: null,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is supported
  isLanguageSupported(languageCode) {
    return languageCode in this.supportedLanguages;
  }

  // Get language pairs for common translations
  getCommonLanguagePairs() {
    return [
      { source: 'English', target: 'Spanish' },
      { source: 'English', target: 'French' },
      { source: 'English', target: 'German' },
      { source: 'Spanish', target: 'English' },
      { source: 'French', target: 'English' },
      { source: 'German', target: 'English' },
      { source: 'English', target: 'Chinese' },
      { source: 'English', target: 'Japanese' },
      { source: 'English', target: 'Korean' },
    ];
  }
}

// Create and export a singleton instance
const translationService = new TranslationService();
export default translationService; 