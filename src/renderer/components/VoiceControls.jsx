import React, { useState, useRef } from 'react';

export function VoiceControls({ speechStatus, onRecognize, onSynthesize }) {
  const [isRecording, setIsRecording] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [testText, setTestText] = useState('Hello, this is a test message.');
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);
        
        try {
          const result = await onRecognize(audioBuffer);
          if (result.error) {
            setLastTranscript(`Error: ${result.error}`);
          } else {
            setLastTranscript(`"${result.transcript}" (confidence: ${result.confidence})`);
          }
        } catch (error) {
          setLastTranscript(`Recognition failed: ${error.message}`);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert(`Microphone access failed: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const testSynthesis = async () => {
    try {
      const audioBuffer = await onSynthesize(testText);
      // For now, just log success - in a full implementation we'd play the audio
      console.log('Speech synthesis successful, audio buffer length:', audioBuffer.length);
      alert('Speech synthesis successful! Check console for details.');
    } catch (error) {
      alert(`Speech synthesis failed: ${error.message}`);
    }
  };

  return (
    <div className="voice-controls">
      <h2>Voice Controls</h2>
      
      <div className="speech-recognition">
        <h3>Speech Recognition Test</h3>
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : ''}
          disabled={!speechStatus?.isReady}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {lastTranscript && (
          <div className="transcript">
            <strong>Last transcript:</strong> {lastTranscript}
          </div>
        )}
      </div>

      <div className="speech-synthesis">
        <h3>Speech Synthesis Test</h3>
        <input 
          type="text" 
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Enter text to synthesize"
        />
        <button 
          onClick={testSynthesis}
          disabled={!speechStatus?.isReady || !testText}
        >
          Synthesize Speech
        </button>
      </div>

      <div className="status">
        <h3>Provider Status</h3>
        <p>Ready: {speechStatus?.isReady ? '✓' : '✗'}</p>
        <p>Listening: {speechStatus?.isListening ? '✓' : '✗'}</p>
        {speechStatus?.lastError && (
          <p className="error">Last Error: {speechStatus.lastError}</p>
        )}
      </div>
    </div>
  );
}