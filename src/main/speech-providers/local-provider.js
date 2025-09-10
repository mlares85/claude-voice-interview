const { SpeechProvider } = require('../../shared/speech-provider-interface');

class LocalSpeechProvider extends SpeechProvider {
  constructor(config) {
    super(config);
    this.type = 'local';
    this.status.isReady = true;
  }

  async recognizeSpeech(audioBuffer) {
    this.emit('listening');
    this.status.isListening = true;
    
    try {
      this.emit('speechStart');
      
      // Mock implementation for testing - in real implementation this would
      // communicate with Python speech recognition service
      if (audioBuffer.toString().includes('invalid')) {
        throw new Error('Invalid audio format');
      }
      
      // Simulate speech recognition processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = {
        transcript: 'Hello, this is a test transcript',
        confidence: 0.95,
        error: undefined
      };
      
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

  async synthesizeSpeech(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }
    
    // Mock implementation - in real implementation this would
    // communicate with Python TTS service
    const mockAudioData = Buffer.from(`Audio data for: ${text}`);
    return mockAudioData;
  }
}

module.exports = { LocalSpeechProvider };