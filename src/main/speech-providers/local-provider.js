const { SpeechProvider } = require('../../shared/speech-provider-interface');
const { PythonSpeechService } = require('../python-speech-service');

class LocalSpeechProvider extends SpeechProvider {
  constructor(config) {
    super(config);
    this.type = 'local';
    this.pythonService = new PythonSpeechService();
    this.status.isReady = false; // Will be set to true once Python service starts
    
    // Initialize Python service
    this._initializePythonService();
  }
  
  async _initializePythonService() {
    try {
      await this.pythonService.start();
      this.status.isReady = true;
      this.status.lastError = null;
      this.emit('ready');
    } catch (error) {
      this.status.isReady = false;
      this.status.lastError = error.message;
      this.emit('error', error);
    }
  }

  async recognizeSpeech(audioBuffer) {
    if (!this.status.isReady) {
      return {
        transcript: '',
        confidence: 0,
        error: 'Local speech service not ready'
      };
    }
    
    this.emit('listening');
    this.status.isListening = true;
    
    try {
      this.emit('speechStart');
      
      // Use Python speech service for recognition
      const result = await this.pythonService.recognizeSpeech(audioBuffer, {
        language: this.config.language || 'en-US',
        timeout: this.config.timeout || 5000
      });
      
      this.emit('speechEnd');
      this.emit('result', result);
      this.status.isListening = false;
      
      // Update our status based on Python service status
      const pythonStatus = await this.pythonService.getStatus();
      this.status.lastError = pythonStatus.lastError;
      
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
    
    if (!this.status.isReady) {
      throw new Error('Local speech service not ready');
    }
    
    try {
      // Use Python speech service for synthesis
      const audioBuffer = await this.pythonService.synthesizeSpeech(text, {
        voice_rate: this.config.voiceRate || 150,
        voice_volume: this.config.voiceVolume || 0.8
      });
      
      return audioBuffer;
    } catch (error) {
      this.status.lastError = error.message;
      this.emit('error', error);
      throw error;
    }
  }
  
  async updateConfig(newConfig) {
    await super.updateConfig(newConfig);
    
    // Update Python service configuration if running
    if (this.pythonService && this.status.isReady) {
      try {
        await this.pythonService.updateConfig({
          language: this.config.language,
          voice_rate: this.config.voiceRate,
          voice_volume: this.config.voiceVolume,
          timeout: this.config.timeout
        });
      } catch (error) {
        this.status.lastError = error.message;
        this.emit('error', error);
      }
    }
  }
  
  async getStatus() {
    const baseStatus = super.getStatus();
    
    // Get Python service status if available
    if (this.pythonService) {
      try {
        const pythonStatus = await this.pythonService.getStatus();
        return {
          ...baseStatus,
          pythonService: pythonStatus
        };
      } catch (error) {
        return {
          ...baseStatus,
          pythonService: { error: error.message }
        };
      }
    }
    
    return baseStatus;
  }
  
  async stop() {
    if (this.pythonService) {
      await this.pythonService.stop();
    }
    this.status.isReady = false;
  }
}

module.exports = { LocalSpeechProvider };