import React, { useState, useEffect } from 'react';

export function SettingsPanel({ config, onConfigChange }) {
  const [localConfig, setLocalConfig] = useState({
    provider: 'local',
    localSettings: { language: 'en-US' },
    cloudSettings: { apiKey: '', language: 'en-US' }
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleProviderChange = (provider) => {
    const newConfig = { ...localConfig, provider };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleLocalSettingChange = (key, value) => {
    const newConfig = {
      ...localConfig,
      localSettings: { ...localConfig.localSettings, [key]: value }
    };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleCloudSettingChange = (key, value) => {
    const newConfig = {
      ...localConfig,
      cloudSettings: { ...localConfig.cloudSettings, [key]: value }
    };
    setLocalConfig(newConfig);
    // Don't auto-save API keys - require explicit save
  };

  const saveCloudSettings = () => {
    onConfigChange(localConfig);
  };

  return (
    <div className="settings-panel">
      <h2>Speech Provider Settings</h2>
      
      <div className="provider-selection">
        <h3>Speech Provider</h3>
        <div className="radio-group">
          <label>
            <input 
              type="radio" 
              value="local" 
              checked={localConfig.provider === 'local'}
              onChange={() => handleProviderChange('local')}
            />
            Local (Python-based, Private)
          </label>
          <label>
            <input 
              type="radio" 
              value="google" 
              checked={localConfig.provider === 'google'}
              onChange={() => handleProviderChange('google')}
            />
            Google Cloud (Higher accuracy, requires API key)
          </label>
        </div>
      </div>

      {localConfig.provider === 'local' && (
        <div className="local-settings">
          <h3>Local Settings</h3>
          <div className="form-group">
            <label>Language:</label>
            <select 
              value={localConfig.localSettings?.language || 'en-US'}
              onChange={(e) => handleLocalSettingChange('language', e.target.value)}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>
          <p className="provider-info">
            ✓ Works offline<br/>
            ✓ Private (no data sent to cloud)<br/>
            ✓ Free<br/>
            ⚠ Lower accuracy for technical terms
          </p>
        </div>
      )}

      {localConfig.provider === 'google' && (
        <div className="cloud-settings">
          <h3>Google Cloud Settings</h3>
          <div className="form-group">
            <label>API Key:</label>
            <input 
              type="password"
              value={localConfig.cloudSettings?.apiKey || ''}
              onChange={(e) => handleCloudSettingChange('apiKey', e.target.value)}
              placeholder="Enter your Google Cloud Speech API key"
            />
          </div>
          <div className="form-group">
            <label>Language:</label>
            <select 
              value={localConfig.cloudSettings?.language || 'en-US'}
              onChange={(e) => handleCloudSettingChange('language', e.target.value)}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>
          <button onClick={saveCloudSettings}>
            Save Cloud Settings
          </button>
          <p className="provider-info">
            ✓ Higher accuracy<br/>
            ✓ Better technical vocabulary<br/>
            ⚠ Requires internet connection<br/>
            ⚠ API costs apply<br/>
            ⚠ Data sent to Google
          </p>
        </div>
      )}

      <div className="current-status">
        <h3>Current Configuration</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
    </div>
  );
}