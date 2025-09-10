const { SpeechProvider } = require('../../shared/speech-provider-interface');

// Google Cloud libraries
let speech, textToSpeech;
try {
  speech = require('@google-cloud/speech');
  textToSpeech = require('@google-cloud/text-to-speech');
} catch (error) {
  console.warn('Google Cloud libraries not installed. Install with: npm install @google-cloud/speech @google-cloud/text-to-speech');
}

class GoogleSpeechProvider extends SpeechProvider {
  constructor(config) {
    super(config);
    this.type = 'google';
    this.status.isReady = Boolean(config.apiKey);
    
    // Initialize Google Cloud clients if libraries are available
    if (speech && textToSpeech && config.apiKey) {
      this._initializeClients();
    }
  }
  
  _initializeClients() {
    try {
      // Initialize Speech-to-Text client
      this.speechClient = new speech.SpeechClient({
        apiKey: this.config.apiKey
      });
      
      // Initialize Text-to-Speech client  
      this.ttsClient = new textToSpeech.TextToSpeechClient({
        apiKey: this.config.apiKey
      });
      
    } catch (error) {
      this.status.isReady = false;
      this.status.lastError = `Failed to initialize Google Cloud clients: ${error.message}`;
    }
  }

  async recognizeSpeech(audioBuffer, options = {}) {
    if (!this.config.apiKey) {
      return {
        transcript: '',
        confidence: 0,
        error: 'API key not configured'
      };
    }
    
    this.emit('listening');
    this.status.isListening = true;
    
    try {
      this.emit('speechStart');
      
      if (!this.speechClient) {
        throw new Error('Google Cloud Speech client not initialized');
      }
      
      // Configure the request
      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: options.audioFormat || 'WEBM_OPUS',
          sampleRateHertz: options.sampleRate || 48000,
          languageCode: this.config.language || 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long'
        }
      };
      
      // Perform the speech recognition
      const [response] = await this.speechClient.recognize(request);
      const result = this._parseRecognitionResponse(response);
      
      this.emit('speechEnd');
      this.emit('result', result);
      this.status.isListening = false;
      
      return result;
      
    } catch (error) {
      this.status.lastError = error.message;
      this.status.isListening = false;
      this.emit('error', error);
      
      return {
        transcript: '',
        confidence: 0,
        error: error.message
      };
    }
  }
  
  _parseRecognitionResponse(response) {
    if (!response.results || response.results.length === 0) {
      return {
        transcript: '',
        confidence: 0,
        error: 'No speech detected'
      };
    }
    
    const result = response.results[0];
    if (!result.alternatives || result.alternatives.length === 0) {
      return {
        transcript: '',
        confidence: 0,
        error: 'No speech detected'
      };
    }
    
    const alternative = result.alternatives[0];
    return {
      transcript: alternative.transcript || '',
      confidence: alternative.confidence || 0,
      language: this.config.language || 'en-US'
    };
  }

  async synthesizeSpeech(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Text must be a non-empty string');
    }
    
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }
    
    if (!this.ttsClient) {
      throw new Error('Google Cloud Text-to-Speech client not initialized');
    }
    
    try {
      // Configure the request
      const request = {
        input: { text: text },
        voice: {
          languageCode: this.config.language || 'en-US',
          name: this.config.voiceName || 'en-US-Standard-A',
          ssmlGender: this.config.voiceGender || 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: this.config.speakingRate || 1.0,
          pitch: this.config.pitch || 0.0,
          volumeGainDb: this.config.volumeGain || 0.0
        }
      };
      
      // Perform the TTS synthesis
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Return the audio content as Buffer
      return Buffer.from(response.audioContent, 'base64');
      
    } catch (error) {
      this.status.lastError = error.message;
      this.emit('error', error);
      throw error;
    }
  }
  
  async updateConfig(newConfig) {
    await super.updateConfig(newConfig);
    
    // Re-initialize clients if API key changed
    if (newConfig.apiKey && speech && textToSpeech) {
      this._initializeClients();
    }
  }
}

module.exports = { GoogleSpeechProvider };