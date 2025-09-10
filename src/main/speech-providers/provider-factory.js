const { LocalSpeechProvider } = require('./local-provider');
const { GoogleSpeechProvider } = require('./cloud-provider');

class SpeechProviderFactory {
  static async create(config) {
    switch (config.provider) {
      case 'local':
        return new LocalSpeechProvider(config.localSettings || {});
      
      case 'google':
        return new GoogleSpeechProvider(config.cloudSettings || {});
      
      default:
        throw new Error(`Unsupported speech provider: ${config.provider}`);
    }
  }
}

module.exports = { SpeechProviderFactory };