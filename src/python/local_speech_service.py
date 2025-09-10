#!/usr/bin/env python3
"""
Local Speech Service for Claude Voice Interview Simulator

This service handles speech recognition and text-to-speech synthesis
using local Python libraries, communicating with the Node.js main process
via JSON messages over stdin/stdout.

Protocol:
- Input: JSON messages on stdin with requestId, action, and parameters
- Output: JSON responses on stdout with requestId and results
- Errors: Logged to stderr, also included in JSON responses
"""

import sys
import json
import base64
import io
import logging
import threading
import queue
from typing import Dict, Any, Optional

# Speech recognition and TTS imports
SPEECH_LIBRARIES_AVAILABLE = False
try:
    import speech_recognition as sr
    import pyttsx3
    import pyaudio
    SPEECH_LIBRARIES_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Speech libraries not installed: {e}", file=sys.stderr)
    print("Running in mock mode. To enable full functionality, install: pip install speechrecognition pyttsx3 pyaudio", file=sys.stderr)
    
    # Mock classes for testing
    class MockRecognizer:
        def adjust_for_ambient_noise(self, source, duration=1): pass
        def record(self, source): return None
        def recognize_google(self, audio, language='en-US'): 
            raise Exception("Speech recognition libraries not installed")
    
    class MockMicrophone:
        def __enter__(self): return self
        def __exit__(self, *args): pass
    
    class MockTTSEngine:
        def setProperty(self, name, value): pass
        def save_to_file(self, text, filename): pass
        def runAndWait(self): pass
    
    # Create mock objects
    sr = type('MockSR', (), {
        'Recognizer': MockRecognizer,
        'Microphone': MockMicrophone,
        'AudioFile': MockMicrophone,
        'UnknownValueError': Exception,
        'RequestError': Exception
    })()
    
    class MockPyTTSx3:
        @staticmethod
        def init():
            return MockTTSEngine()
    
    pyttsx3 = MockPyTTSx3()
    
    pyaudio = None

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger(__name__)

class LocalSpeechService:
    def __init__(self):
        self.config = {
            'language': 'en-US',
            'timeout': 5.0,
            'phrase_timeout': 1.0,
            'voice_rate': 150,
            'voice_volume': 0.8
        }
        
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        self.microphone = None
        
        # Initialize TTS engine
        self.tts_engine = None
        self.tts_lock = threading.Lock()
        
        # Service state
        self.is_ready = False
        self.is_listening = False
        self.last_error = None
        
        # Initialize components
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize speech recognition and TTS components."""
        try:
            if SPEECH_LIBRARIES_AVAILABLE:
                # Initialize microphone
                self.microphone = sr.Microphone()
                with self.microphone as source:
                    logger.info("Adjusting for ambient noise...")
                    self.recognizer.adjust_for_ambient_noise(source, duration=1)
                    logger.info("Ambient noise adjustment complete")
                
                # Initialize TTS engine
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', self.config['voice_rate'])
                self.tts_engine.setProperty('volume', self.config['voice_volume'])
                
                logger.info("Speech service initialized successfully")
            else:
                # Mock mode - still mark as ready for testing
                self.microphone = sr.Microphone()
                self.tts_engine = pyttsx3.init()
                logger.info("Speech service initialized in mock mode (no actual audio processing)")
            
            self.is_ready = True
            self.last_error = None
            
        except Exception as e:
            self.last_error = str(e)
            self.is_ready = False
            logger.error(f"Failed to initialize speech service: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current service status."""
        return {
            'isReady': self.is_ready,
            'isListening': self.is_listening,
            'currentLanguage': self.config['language'],
            'lastError': self.last_error,
            'memoryUsage': self._get_memory_usage()
        }
    
    def _get_memory_usage(self) -> float:
        """Get approximate memory usage in MB."""
        try:
            import psutil
            process = psutil.Process()
            return round(process.memory_info().rss / 1024 / 1024, 1)
        except:
            return 0.0
    
    def update_config(self, new_config: Dict[str, Any]) -> Dict[str, Any]:
        """Update service configuration."""
        try:
            # Update configuration
            self.config.update(new_config)
            
            # Apply TTS settings if changed
            if self.tts_engine:
                if 'voice_rate' in new_config:
                    self.tts_engine.setProperty('rate', self.config['voice_rate'])
                if 'voice_volume' in new_config:
                    self.tts_engine.setProperty('volume', self.config['voice_volume'])
            
            logger.info(f"Configuration updated: {new_config}")
            return {'success': True}
            
        except Exception as e:
            error_msg = f"Failed to update configuration: {e}"
            logger.error(error_msg)
            return {'error': error_msg}
    
    def recognize_speech(self, audio_data: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recognize speech from base64-encoded audio data.
        
        Args:
            audio_data: Base64-encoded audio data
            config: Recognition configuration (language, timeout, etc.)
            
        Returns:
            Dictionary with transcript, confidence, and optional error
        """
        if not self.is_ready:
            return {
                'transcript': '',
                'confidence': 0.0,
                'error': 'Service not ready'
            }
        
        try:
            self.is_listening = True
            
            # Decode audio data
            try:
                audio_bytes = base64.b64decode(audio_data)
                audio_io = io.BytesIO(audio_bytes)
                
                # Create AudioData object from bytes
                # Note: This assumes WAV format - in real implementation,
                # you'd need proper audio format detection
                with sr.AudioFile(audio_io) as source:
                    audio = self.recognizer.record(source)
                    
            except Exception as e:
                return {
                    'transcript': '',
                    'confidence': 0.0,
                    'error': 'Audio format not supported'
                }
            
            # Perform recognition
            language = config.get('language', self.config['language'])
            timeout = config.get('timeout', self.config['timeout'])
            
            try:
                # Use Google Speech Recognition (free tier)
                transcript = self.recognizer.recognize_google(
                    audio, 
                    language=language
                )
                
                # Calculate confidence (Google API doesn't provide this directly)
                confidence = min(0.9, max(0.1, len(transcript) / 100.0))
                
                logger.info(f"Recognition successful: '{transcript}' (confidence: {confidence})")
                
                return {
                    'transcript': transcript,
                    'confidence': confidence,
                    'language': language
                }
                
            except sr.UnknownValueError:
                logger.warning("Speech recognition could not understand audio")
                return {
                    'transcript': '',
                    'confidence': 0.0,
                    'error': 'Could not understand audio'
                }
                
            except sr.RequestError as e:
                logger.error(f"Speech recognition service error: {e}")
                return {
                    'transcript': '',
                    'confidence': 0.0,
                    'error': f'Recognition service error: {e}'
                }
        
        except Exception as e:
            logger.error(f"Recognition failed: {e}")
            return {
                'transcript': '',
                'confidence': 0.0,
                'error': str(e)
            }
        
        finally:
            self.is_listening = False
    
    def synthesize_speech(self, text: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesize speech from text and return as base64-encoded audio.
        
        Args:
            text: Text to synthesize
            config: Synthesis configuration (voice, rate, etc.)
            
        Returns:
            Dictionary with audioData (base64) or error
        """
        if not text or not text.strip():
            return {'error': 'Text cannot be empty'}
        
        if not self.is_ready or not self.tts_engine:
            return {'error': 'TTS engine not ready'}
        
        try:
            if not SPEECH_LIBRARIES_AVAILABLE:
                # Mock mode - return fake audio data
                fake_audio_data = f"Mock audio data for: {text}"
                audio_base64 = base64.b64encode(fake_audio_data.encode()).decode('utf-8')
                logger.info(f"Mock speech synthesis for text: '{text[:50]}...'")
                return {'audioData': audio_base64}
            
            with self.tts_lock:
                # Create temporary file for audio output
                import tempfile
                import wave
                
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                    temp_filename = temp_file.name
                
                # Configure TTS settings from config
                rate = config.get('voice_rate', self.config['voice_rate'])
                volume = config.get('voice_volume', self.config['voice_volume'])
                
                self.tts_engine.setProperty('rate', rate)
                self.tts_engine.setProperty('volume', volume)
                
                # Save speech to file
                self.tts_engine.save_to_file(text, temp_filename)
                self.tts_engine.runAndWait()
                
                # Read the audio file and encode as base64
                try:
                    with open(temp_filename, 'rb') as audio_file:
                        audio_data = audio_file.read()
                        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                    
                    # Clean up temporary file
                    import os
                    os.unlink(temp_filename)
                    
                    logger.info(f"Speech synthesis successful for text: '{text[:50]}...'")
                    return {'audioData': audio_base64}
                    
                except Exception as e:
                    logger.error(f"Failed to read synthesized audio: {e}")
                    return {'error': f'Failed to read audio file: {e}'}
        
        except Exception as e:
            logger.error(f"Speech synthesis failed: {e}")
            return {'error': str(e)}
    
    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single request and return response."""
        action = request.get('action')
        request_id = request.get('requestId')
        
        try:
            if action == 'recognize':
                audio_data = request.get('audioData', '')
                config = request.get('config', {})
                response = self.recognize_speech(audio_data, config)
                
            elif action == 'synthesize':
                text = request.get('text', '')
                config = request.get('config', {})
                response = self.synthesize_speech(text, config)
                
            elif action == 'configure':
                new_config = request.get('config', {})
                response = self.update_config(new_config)
                
            elif action == 'status':
                response = self.get_status()
                
            else:
                response = {'error': f'Unknown action: {action}'}
            
            # Add request ID to response
            if request_id:
                response['requestId'] = request_id
                
            return response
            
        except Exception as e:
            logger.error(f"Request processing failed: {e}")
            response = {'error': str(e)}
            if request_id:
                response['requestId'] = request_id
            return response
    
    def run(self):
        """Main service loop - read requests from stdin and send responses to stdout."""
        logger.info("Local speech service starting...")
        logger.info(f"Service ready: {self.is_ready}")
        
        try:
            for line in sys.stdin:
                line = line.strip()
                if not line:
                    continue
                
                try:
                    request = json.loads(line)
                    response = self.process_request(request)
                    
                    # Send response to stdout
                    print(json.dumps(response), flush=True)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON request: {e}")
                    error_response = {'error': 'Invalid JSON request'}
                    print(json.dumps(error_response), flush=True)
                
                except Exception as e:
                    logger.error(f"Unexpected error processing request: {e}")
                    error_response = {'error': str(e)}
                    print(json.dumps(error_response), flush=True)
        
        except KeyboardInterrupt:
            logger.info("Service interrupted by user")
        except Exception as e:
            logger.error(f"Service crashed: {e}")
        finally:
            logger.info("Local speech service stopping...")

def main():
    """Main entry point."""
    service = LocalSpeechService()
    service.run()

if __name__ == '__main__':
    main()