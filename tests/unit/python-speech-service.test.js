/**
 * TDD Tests for Python Speech Service Integration
 * These tests define how the Node.js main process communicates with Python speech service
 */

const { PythonSpeechService } = require('../../src/main/python-speech-service');
const { spawn } = require('child_process');

// Mock child_process to avoid actual Python execution in tests
jest.mock('child_process');

describe('Python Speech Service Integration', () => {
  let pythonService;
  let mockPythonProcess;

  beforeEach(() => {
    // Create mock Python process
    mockPythonProcess = {
      stdout: { on: jest.fn(), pipe: jest.fn() },
      stderr: { on: jest.fn() },
      stdin: { write: jest.fn(), end: jest.fn() },
      on: jest.fn(),
      kill: jest.fn(),
      pid: 12345
    };
    
    spawn.mockReturnValue(mockPythonProcess);
    pythonService = new PythonSpeechService();
    pythonService.reset(); // Ensure clean state
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Lifecycle', () => {
    test('should start Python service subprocess', async () => {
      await pythonService.start();

      expect(spawn).toHaveBeenCalledWith('python', [
        expect.stringContaining('local_speech_service.py')
      ], expect.any(Object));
      expect(pythonService.isRunning()).toBe(true);
    });

    test('should stop Python service subprocess', async () => {
      await pythonService.start();
      await pythonService.stop();

      expect(mockPythonProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(pythonService.isRunning()).toBe(false);
    });

    test('should handle Python service startup errors', async () => {
      const error = new Error('Python not found');
      spawn.mockImplementation(() => {
        throw error;
      });

      await expect(pythonService.start()).rejects.toThrow('Python not found');
      expect(pythonService.isRunning()).toBe(false);
    });

    test('should restart service if it crashes', async () => {
      await pythonService.start();
      
      // Simulate process crash
      const exitCallback = mockPythonProcess.on.mock.calls.find(
        call => call[0] === 'exit'
      )[1];
      exitCallback(1); // Non-zero exit code
      
      // Wait for restart
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(spawn).toHaveBeenCalledTimes(2); // Initial start + restart
    });
  });

  describe('Speech Recognition Communication', () => {
    beforeEach(async () => {
      await pythonService.start();
    });

    test('should send audio data to Python service for recognition', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const expectedResponse = {
        transcript: 'hello world',
        confidence: 0.95,
        language: 'en-US'
      };

      // Mock Python service response  
      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        const responseWithId = { ...expectedResponse, requestId: 1 };
        dataCallback(JSON.stringify(responseWithId) + '\n');
      }, 10);

      const result = await pythonService.recognizeSpeech(audioBuffer, {
        language: 'en-US',
        timeout: 5000
      });

      expect(mockPythonProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'recognize',
          audioData: audioBuffer.toString('base64'),
          config: { language: 'en-US', timeout: 5000 },
          requestId: 1
        }) + '\n'
      );
      expect(result).toEqual(expectedResponse);
    });

    test('should handle recognition timeouts', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      
      // Don't send any response (simulate timeout)
      const result = await pythonService.recognizeSpeech(audioBuffer, {
        timeout: 100 // Short timeout for test
      });

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'Recognition timeout'
      });
    });

    test('should handle recognition errors from Python service', async () => {
      const audioBuffer = Buffer.from('invalid audio');
      const errorResponse = {
        error: 'Audio format not supported'
      };

      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        const responseWithId = { ...errorResponse, requestId: 1 };
        dataCallback(JSON.stringify(responseWithId) + '\n');
      }, 10);

      const result = await pythonService.recognizeSpeech(audioBuffer);

      expect(result).toEqual({
        transcript: '',
        confidence: 0,
        error: 'Audio format not supported'
      });
    });
  });

  describe('Text-to-Speech Communication', () => {
    beforeEach(async () => {
      await pythonService.start();
    });

    test('should send text to Python service for synthesis', async () => {
      const text = 'Hello, this is a test message';
      const expectedAudioData = Buffer.from('audio data for test').toString('base64');

      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        const responseWithId = { audioData: expectedAudioData, requestId: 1 };
        dataCallback(JSON.stringify(responseWithId) + '\n');
      }, 10);

      const result = await pythonService.synthesizeSpeech(text, {
        voice: 'default',
        rate: 150
      });

      expect(mockPythonProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'synthesize',
          text: text,
          config: { voice: 'default', rate: 150 },
          requestId: 1
        }) + '\n'
      );
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('base64')).toBe(expectedAudioData);
    });

    test('should handle synthesis errors', async () => {
      const text = '';
      const errorResponse = { error: 'Text cannot be empty' };

      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        const responseWithId = { ...errorResponse, requestId: 1 };
        dataCallback(JSON.stringify(responseWithId) + '\n');
      }, 10);

      await expect(pythonService.synthesizeSpeech(text))
        .rejects.toThrow('Text cannot be empty');
    });
  });

  describe('Configuration Management', () => {
    test('should update Python service configuration', async () => {
      await pythonService.start();
      
      const newConfig = {
        language: 'es-ES',
        recognitionTimeout: 8000,
        voiceRate: 180
      };

      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        dataCallback(JSON.stringify({ success: true }) + '\n');
      }, 10);

      await pythonService.updateConfig(newConfig);

      expect(mockPythonProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'configure',
          config: newConfig
        }) + '\n'
      );
    });

    test('should get current Python service status', async () => {
      await pythonService.start();
      
      const statusResponse = {
        isReady: true,
        isListening: false,
        currentLanguage: 'en-US',
        lastError: null,
        memoryUsage: 45.2
      };

      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        dataCallback(JSON.stringify(statusResponse) + '\n');
      }, 10);

      const status = await pythonService.getStatus();
      
      expect(mockPythonProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({ action: 'status' }) + '\n'
      );
      expect(status).toEqual(statusResponse);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle Python service stderr messages', async () => {
      await pythonService.start();
      
      const errorMessage = 'Warning: Audio device not optimal';
      
      // Add error event listener to prevent unhandled error
      pythonService.on('error', () => {
        // Suppress the error for test
      });
      
      const errorCallback = mockPythonProcess.stderr.on.mock.calls.find(
        call => call[0] === 'data'
      )[1];
      
      errorCallback(errorMessage);
      
      const logs = pythonService.getLogs();
      expect(logs.errors).toContain(errorMessage);
    });

    test('should queue requests when service is not ready', async () => {
      const audioBuffer = Buffer.from('test audio');
      
      // Don't start service, should queue the request
      const recognitionPromise = pythonService.recognizeSpeech(audioBuffer);
      
      // Start service after request is queued
      await pythonService.start();
      
      // Mock response
      setTimeout(() => {
        const dataCallback = mockPythonProcess.stdout.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        dataCallback(JSON.stringify({
          transcript: 'queued request processed',
          confidence: 0.9
        }) + '\n');
      }, 10);
      
      const result = await recognitionPromise;
      expect(result.transcript).toBe('queued request processed');
    });

    test('should limit request queue size to prevent memory issues', async () => {
      const audioBuffer = Buffer.from('test audio');
      
      // Queue requests up to the limit
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(pythonService.recognizeSpeech(audioBuffer));
      }
      
      // The 11th request should be rejected immediately
      await expect(pythonService.recognizeSpeech(audioBuffer))
        .rejects.toThrow('Request queue full');
    });
  });
});