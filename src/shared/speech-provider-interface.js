/**
 * Speech Provider Interface Definition
 * All speech providers must implement this interface
 */

class SpeechProvider {
  constructor(config) {
    this.config = config;
    this.type = 'base';
    this.status = {
      isReady: false,
      isListening: false,
      lastError: null
    };
    this.eventListeners = {};
  }

  /**
   * Recognize speech from audio buffer
   * @param {Buffer} audioBuffer - Raw audio data
   * @returns {Promise<{transcript: string, confidence: number, error?: string}>}
   */
  async recognizeSpeech(audioBuffer) {
    throw new Error('recognizeSpeech must be implemented by subclass');
  }

  /**
   * Synthesize speech from text
   * @param {string} text - Text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async synthesizeSpeech(text) {
    throw new Error('synthesizeSpeech must be implemented by subclass');
  }

  /**
   * Update provider configuration
   * @param {Object} newConfig - New configuration settings
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get provider status
   * @returns {Object} Status information
   */
  getStatus() {
    return { ...this.status };
  }

  /**
   * Event system implementation
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event]
        .filter(cb => cb !== callback);
    }
  }
}

module.exports = { SpeechProvider };