/**
 * TDD Tests for Google Cloud Speech Provider
 * Tests the Google Cloud Speech-to-Text and Text-to-Speech integration
 */

const { GoogleSpeechProvider } = require('../../src/main/speech-providers/cloud-provider');

// Mock the Google Cloud Speech library
jest.mock('@google-cloud/speech', () => ({
  SpeechClient: jest.fn().mockImplementation(() => ({
    recognize: jest.fn()
  }))
}));

jest.mock('@google-cloud/text-to-speech', () => ({
  TextToSpeechClient: jest.fn().mockImplementation(() => ({
    synthesizeSpeech: jest.fn()
  }))
}));

describe('Google Cloud Speech Provider', () => {
  let provider;
  let mockSpeechClient;
  let mockTTSClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get mock instances
    const { SpeechClient } = require('@google-cloud/speech');
    const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
    
    mockSpeechClient = new SpeechClient();
    mockTTSClient = new TextToSpeechClient();

    // Create provider with API key
    provider = new GoogleSpeechProvider({
      apiKey: 'test-api-key',
      language: 'en-US'
    });
  });

  describe('Provider Initialization', () => {
    test('should initialize with API key and be ready', () => {
      expect(provider.type).toBe('google');
      expect(provider.status.isReady).toBe(true);
      expect(provider.config.apiKey).toBe('test-api-key');
    });

    test('should not be ready without API key', () => {
      const providerWithoutKey = new GoogleSpeechProvider({});
      expect(providerWithoutKey.status.isReady).toBe(false);
    });
  });

  describe('Speech Recognition', () => {
    test('should recognize speech using Google Cloud API', async () => {
      const mockAudioBuffer = Buffer.from('fake audio data');
      const mockResponse = [{
        results: [{
          alternatives: [{
            transcript: 'Hello world from Google Cloud',
            confidence: 0.95
          }]
        }]
      }];

      mockSpeechClient.recognize.mockResolvedValue(mockResponse);

      const result = await provider.recognizeSpeech(mockAudioBuffer);

      expect(mockSpeechClient.recognize).toHaveBeenCalledWith({
        audio: { content: mockAudioBuffer.toString('base64') },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long'
        }
      });

      expect(result).toEqual({
        transcript: 'Hello world from Google Cloud',
        confidence: 0.95,
        language: 'en-US'
      });
    });

    test('should handle recognition with no results', async () => {
      const mockAudioBuffer = Buffer.from('silence');
      const mockResponse = [{ results: [] }];

      mockSpeechClient.recognize.mockResolvedValue(mockResponse);

      const result = await provider.recognizeSpeech(mockAudioBuffer);

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'No speech detected'
      });
    });

    test('should handle Google Cloud API errors', async () => {
      const mockAudioBuffer = Buffer.from('audio data');
      const apiError = new Error('Invalid API key');
      
      mockSpeechClient.recognize.mockRejectedValue(apiError);

      const result = await provider.recognizeSpeech(mockAudioBuffer);

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'Invalid API key'
      });
    });

    test('should emit proper events during recognition', async () => {
      const mockAudioBuffer = Buffer.from('test audio');
      const mockResponse = [{
        results: [{
          alternatives: [{
            transcript: 'Test transcript',
            confidence: 0.9
          }]
        }]
      }];

      mockSpeechClient.recognize.mockResolvedValue(mockResponse);

      const events = [];
      provider.on('listening', () => events.push('listening'));
      provider.on('speechStart', () => events.push('speechStart'));
      provider.on('speechEnd', () => events.push('speechEnd'));
      provider.on('result', (result) => events.push({ event: 'result', data: result }));

      await provider.recognizeSpeech(mockAudioBuffer);

      expect(events).toContain('listening');
      expect(events).toContain('speechStart');
      expect(events).toContain('speechEnd');
      expect(events.some(e => e.event === 'result')).toBe(true);
    });

    test('should reject recognition without API key', async () => {
      const providerWithoutKey = new GoogleSpeechProvider({});
      const mockAudioBuffer = Buffer.from('audio');

      const result = await providerWithoutKey.recognizeSpeech(mockAudioBuffer);

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'API key not configured'
      });
    });
  });

  describe('Text-to-Speech', () => {
    test('should synthesize speech using Google Cloud TTS', async () => {
      const text = 'Hello, this is a test message';
      const mockAudioContent = Buffer.from('fake tts audio data').toString('base64');
      const mockResponse = [{
        audioContent: mockAudioContent
      }];

      mockTTSClient.synthesizeSpeech.mockResolvedValue(mockResponse);

      const result = await provider.synthesizeSpeech(text);

      expect(mockTTSClient.synthesizeSpeech).toHaveBeenCalledWith({
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      });

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('base64')).toBe(mockAudioContent);
    });

    test('should handle custom voice configuration', async () => {
      const text = 'Test with custom voice';
      const mockAudioContent = Buffer.from('custom voice audio').toString('base64');
      const mockResponse = [{ audioContent: mockAudioContent }];

      mockTTSClient.synthesizeSpeech.mockResolvedValue(mockResponse);

      // Update provider configuration
      await provider.updateConfig({
        voiceName: 'en-US-Wavenet-D',
        voiceGender: 'MALE',
        speakingRate: 1.2,
        pitch: 0.5
      });

      const result = await provider.synthesizeSpeech(text);

      expect(mockTTSClient.synthesizeSpeech).toHaveBeenCalledWith({
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Wavenet-D',
          ssmlGender: 'MALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.2,
          pitch: 0.5,
          volumeGainDb: 0.0
        }
      });
    });

    test('should handle TTS API errors', async () => {
      const text = 'Test text';
      const apiError = new Error('TTS quota exceeded');
      
      mockTTSClient.synthesizeSpeech.mockRejectedValue(apiError);

      await expect(provider.synthesizeSpeech(text))
        .rejects.toThrow('TTS quota exceeded');
    });

    test('should reject synthesis without API key', async () => {
      const providerWithoutKey = new GoogleSpeechProvider({});
      
      await expect(providerWithoutKey.synthesizeSpeech('test'))
        .rejects.toThrow('API key not configured');
    });

    test('should reject empty text', async () => {
      await expect(provider.synthesizeSpeech(''))
        .rejects.toThrow('Text must be a non-empty string');
      
      await expect(provider.synthesizeSpeech(null))
        .rejects.toThrow('Text must be a non-empty string');
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', async () => {
      const newConfig = {
        language: 'es-ES',
        voiceName: 'es-ES-Standard-A',
        speakingRate: 0.8
      };

      await provider.updateConfig(newConfig);

      expect(provider.config.language).toBe('es-ES');
      expect(provider.config.voiceName).toBe('es-ES-Standard-A');
      expect(provider.config.speakingRate).toBe(0.8);
    });

    test('should provide status information', () => {
      const status = provider.getStatus();

      expect(status).toEqual({
        isReady: true,
        isListening: false,
        lastError: null
      });
    });
  });

  describe('Audio Format Support', () => {
    test('should handle different audio formats', async () => {
      const formats = [
        { encoding: 'FLAC', extension: 'flac' },
        { encoding: 'MP3', extension: 'mp3' },
        { encoding: 'WAV', extension: 'wav' }
      ];

      for (const format of formats) {
        const mockAudioBuffer = Buffer.from(`${format.extension} audio data`);
        const mockResponse = [{
          results: [{
            alternatives: [{
              transcript: `Processed ${format.extension}`,
              confidence: 0.9
            }]
          }]
        }];

        mockSpeechClient.recognize.mockResolvedValue(mockResponse);

        const result = await provider.recognizeSpeech(mockAudioBuffer, {
          audioFormat: format.encoding
        });

        expect(result.transcript).toBe(`Processed ${format.extension}`);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const mockAudioBuffer = Buffer.from('audio');
      const networkError = new Error('Network connection failed');
      networkError.code = 'ECONNREFUSED';
      
      mockSpeechClient.recognize.mockRejectedValue(networkError);

      const result = await provider.recognizeSpeech(mockAudioBuffer);

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'Network connection failed'
      });
      expect(provider.status.lastError).toBe('Network connection failed');
    });

    test('should handle quota exceeded errors', async () => {
      const mockAudioBuffer = Buffer.from('audio');
      const quotaError = new Error('Quota exceeded');
      quotaError.code = 'RESOURCE_EXHAUSTED';
      
      mockSpeechClient.recognize.mockRejectedValue(quotaError);

      const result = await provider.recognizeSpeech(mockAudioBuffer);

      expect(result.error).toBe('Quota exceeded');
    });
  });
});