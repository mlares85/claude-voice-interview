/**
 * TDD Tests for Python Speech Service Script
 * Tests the actual Python script functionality via subprocess execution
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Python Speech Service Script', () => {
  let pythonProcess;
  let scriptPath;

  beforeAll(() => {
    scriptPath = path.join(__dirname, '../../src/python/local_speech_service.py');
  });

  afterEach(() => {
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.kill('SIGTERM');
    }
  });

  describe('Script Initialization', () => {
    test('should start Python script without errors', async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stderrData = '';
        pythonProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
        });

        // Send a status request to verify the script is working
        const statusRequest = JSON.stringify({
          action: 'status',
          requestId: 'test-1'
        }) + '\n';

        pythonProcess.stdin.write(statusRequest);

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            expect(response).toHaveProperty('requestId', 'test-1');
            expect(response).toHaveProperty('isReady');
            expect(typeof response.isReady).toBe('boolean');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start Python script: ${error.message}`));
        });

        pythonProcess.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Python script exited with code ${code}. stderr: ${stderrData}`));
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Python script initialization timeout'));
        }, 10000);
      });
    }, 15000);
  });

  describe('Status Requests', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        
        // Wait a bit for initialization
        setTimeout(resolve, 1000);
      });
    });

    test('should respond to status requests with service information', async () => {
      return new Promise((resolve, reject) => {
        const request = JSON.stringify({
          action: 'status',
          requestId: 'status-test'
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              requestId: 'status-test',
              isReady: expect.any(Boolean),
              isListening: expect.any(Boolean),
              currentLanguage: expect.any(String),
              lastError: null, // Should be null in mock mode when no errors
              memoryUsage: expect.any(Number)
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(request);

        setTimeout(() => reject(new Error('Status request timeout')), 5000);
      });
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        setTimeout(resolve, 1000);
      });
    });

    test('should accept configuration updates', async () => {
      return new Promise((resolve, reject) => {
        const configRequest = JSON.stringify({
          action: 'configure',
          requestId: 'config-test',
          config: {
            language: 'es-ES',
            voice_rate: 180,
            timeout: 8.0
          }
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              requestId: 'config-test',
              success: true
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(configRequest);

        setTimeout(() => reject(new Error('Config request timeout')), 5000);
      });
    });
  });

  describe('Speech Recognition Mock Tests', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        setTimeout(resolve, 1000);
      });
    });

    test('should handle recognition requests with proper error for invalid audio', async () => {
      return new Promise((resolve, reject) => {
        const recognizeRequest = JSON.stringify({
          action: 'recognize',
          requestId: 'recognize-test',
          audioData: 'invalid-base64-audio-data',
          config: {
            language: 'en-US',
            timeout: 5.0
          }
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              requestId: 'recognize-test',
              transcript: '',
              confidence: 0.0,
              error: expect.stringMatching(/Audio format not supported|Service not ready/)
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(recognizeRequest);

        setTimeout(() => reject(new Error('Recognition request timeout')), 10000);
      });
    });
  });

  describe('Text-to-Speech Tests', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        setTimeout(resolve, 1000);
      });
    });

    test('should handle empty text synthesis with error', async () => {
      return new Promise((resolve, reject) => {
        const synthesizeRequest = JSON.stringify({
          action: 'synthesize',
          requestId: 'tts-test',
          text: '',
          config: {
            voice_rate: 150,
            voice_volume: 0.8
          }
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              requestId: 'tts-test',
              error: 'Text cannot be empty'
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(synthesizeRequest);

        setTimeout(() => reject(new Error('TTS request timeout')), 5000);
      });
    });

    test('should handle valid text synthesis (if TTS engine available)', async () => {
      return new Promise((resolve, reject) => {
        const synthesizeRequest = JSON.stringify({
          action: 'synthesize',
          requestId: 'tts-valid-test',
          text: 'Hello, this is a test message.',
          config: {
            voice_rate: 150,
            voice_volume: 0.8
          }
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response.requestId).toBe('tts-valid-test');
            
            // Should either return audioData or an error (depending on system TTS availability)
            if (response.error) {
              // It's okay if TTS is not available in test environment
              expect(response.error).toMatch(/TTS engine not ready|Failed to|pyttsx3/);
            } else {
              // If successful, should have base64 audio data
              expect(response).toHaveProperty('audioData');
              expect(typeof response.audioData).toBe('string');
            }
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(synthesizeRequest);

        setTimeout(() => reject(new Error('TTS valid request timeout')), 10000);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        setTimeout(resolve, 1000);
      });
    });

    test('should handle invalid JSON requests gracefully', async () => {
      return new Promise((resolve, reject) => {
        const invalidRequest = 'invalid-json-data\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              error: 'Invalid JSON request'
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(invalidRequest);

        setTimeout(() => reject(new Error('Invalid JSON request timeout')), 5000);
      });
    });

    test('should handle unknown actions', async () => {
      return new Promise((resolve, reject) => {
        const unknownRequest = JSON.stringify({
          action: 'unknown-action',
          requestId: 'unknown-test'
        }) + '\n';

        pythonProcess.stdout.once('data', (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            
            expect(response).toEqual({
              requestId: 'unknown-test',
              error: 'Unknown action: unknown-action'
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.stdin.write(unknownRequest);

        setTimeout(() => reject(new Error('Unknown action request timeout')), 5000);
      });
    });
  });

  describe('Multiple Requests', () => {
    beforeEach(async () => {
      return new Promise((resolve, reject) => {
        pythonProcess = spawn('python3', [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('error', reject);
        setTimeout(resolve, 1000);
      });
    });

    test('should handle multiple sequential requests correctly', async () => {
      return new Promise((resolve, reject) => {
        let responseCount = 0;
        const expectedResponses = 3;
        const responses = [];

        pythonProcess.stdout.on('data', (data) => {
          try {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
              if (line.trim()) {
                const response = JSON.parse(line);
                responses.push(response);
                responseCount++;
                
                if (responseCount === expectedResponses) {
                  // Verify all responses
                  expect(responses).toHaveLength(3);
                  expect(responses[0]).toHaveProperty('requestId', 'multi-1');
                  expect(responses[1]).toHaveProperty('requestId', 'multi-2');
                  expect(responses[2]).toHaveProperty('requestId', 'multi-3');
                  resolve();
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        });

        // Send multiple requests
        const requests = [
          { action: 'status', requestId: 'multi-1' },
          { action: 'configure', requestId: 'multi-2', config: { language: 'en-US' } },
          { action: 'status', requestId: 'multi-3' }
        ];

        for (const request of requests) {
          pythonProcess.stdin.write(JSON.stringify(request) + '\n');
        }

        setTimeout(() => reject(new Error('Multiple requests timeout')), 10000);
      });
    });
  });
});