import React, { useState, useEffect } from 'react';
import { InterviewPanel } from './components/InterviewPanel';
import { VoiceControls } from './components/VoiceControls';
import { SettingsPanel } from './components/SettingsPanel';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('interview');
  const [speechConfig, setSpeechConfig] = useState(null);
  const [speechStatus, setSpeechStatus] = useState(null);

  useEffect(() => {
    // Load initial configuration
    loadSpeechConfig();
    
    // Set up status polling
    const statusInterval = setInterval(loadSpeechStatus, 1000);
    return () => clearInterval(statusInterval);
  }, []);

  const loadSpeechConfig = async () => {
    try {
      const config = await window.electronAPI.speech.getConfig();
      setSpeechConfig(config);
    } catch (error) {
      console.error('Failed to load speech config:', error);
    }
  };

  const loadSpeechStatus = async () => {
    try {
      const status = await window.electronAPI.speech.getStatus();
      setSpeechStatus(status);
    } catch (error) {
      console.error('Failed to load speech status:', error);
    }
  };

  const updateSpeechConfig = async (newConfig) => {
    try {
      const result = await window.electronAPI.speech.updateConfig(newConfig);
      if (result.success) {
        await loadSpeechConfig();
      } else {
        alert(`Failed to update config: ${result.error}`);
      }
    } catch (error) {
      alert(`Error updating config: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Claude Voice Interview Simulator</h1>
        <nav>
          <button 
            className={currentTab === 'interview' ? 'active' : ''}
            onClick={() => setCurrentTab('interview')}
          >
            Interview
          </button>
          <button 
            className={currentTab === 'settings' ? 'active' : ''}
            onClick={() => setCurrentTab('settings')}
          >
            Settings
          </button>
        </nav>
        <div className="status-indicator">
          <div 
            className={`status-dot ${speechStatus?.isReady ? 'ready' : 'not-ready'}`}
          />
          {speechConfig?.provider} 
          {speechStatus?.isListening && ' (Listening...)'}
        </div>
      </header>

      <main className="app-main">
        {currentTab === 'interview' && (
          <div className="interview-tab">
            <VoiceControls 
              speechStatus={speechStatus}
              onRecognize={(audioBuffer) => window.electronAPI.speech.recognize(audioBuffer)}
              onSynthesize={(text) => window.electronAPI.speech.synthesize(text)}
            />
            <InterviewPanel />
          </div>
        )}
        
        {currentTab === 'settings' && (
          <SettingsPanel 
            config={speechConfig}
            onConfigChange={updateSpeechConfig}
          />
        )}
      </main>
    </div>
  );
}

export default App;