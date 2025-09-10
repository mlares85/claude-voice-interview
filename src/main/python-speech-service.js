const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

class PythonSpeechService extends EventEmitter {
  constructor() {
    super();
    this.pythonProcess = null;
    this.isReady = false;
    this.requestQueue = [];
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.maxQueueSize = 10;
    this.logs = {
      errors: [],
      info: []
    };
  }

  reset() {
    this.pythonProcess = null;
    this.isReady = false;
    this.requestQueue = [];
    this.pendingRequests.clear();
    this.requestId = 0;
    this.logs = {
      errors: [],
      info: []
    };
  }

  async start() {
    if (this.pythonProcess) {
      return;
    }

    try {
      const pythonScriptPath = path.join(__dirname, '../python/local_speech_service.py');
      
      this.pythonProcess = spawn('python3', [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.setupProcessHandlers();
      this.isReady = true;
      this.emit('started');
      
      // Process any queued requests
      this.processQueue();
      
    } catch (error) {
      this.isReady = false;
      throw error;
    }
  }

  setupProcessHandlers() {
    // Handle stdout (responses from Python service)
    this.pythonProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          this.handlePythonResponse(response);
        } catch (error) {
          this.logs.errors.push(`Failed to parse Python response: ${line}`);
        }
      }
    });

    // Handle stderr (error messages from Python service)
    this.pythonProcess.stderr.on('data', (data) => {
      const errorMessage = data.toString();
      this.logs.errors.push(errorMessage);
      this.emit('error', errorMessage);
    });

    // Handle process exit
    this.pythonProcess.on('exit', (code) => {
      this.isReady = false;
      this.pythonProcess = null;
      
      if (code !== 0) {
        this.logs.errors.push(`Python service exited with code ${code}`);
        this.emit('crashed', code);
        
        // Auto-restart on crash
        setTimeout(() => {
          this.start().catch(error => {
            this.logs.errors.push(`Failed to restart Python service: ${error.message}`);
          });
        }, 1000);
      }
    });
  }

  handlePythonResponse(response) {
    if (response.requestId && this.pendingRequests.has(response.requestId)) {
      const { resolve, reject } = this.pendingRequests.get(response.requestId);
      this.pendingRequests.delete(response.requestId);
      
      if (response.error) {
        if (response.error === 'Audio format not supported') {
          // For recognition errors, return error in result instead of rejecting
          resolve({
            transcript: '',
            confidence: 0,
            error: response.error
          });
        } else {
          reject(new Error(response.error));
        }
      } else {
        // Remove requestId from response before resolving
        const { requestId, ...cleanResponse } = response;
        resolve(cleanResponse);
      }
    }
  }

  async stop() {
    if (!this.pythonProcess) {
      return;
    }

    this.pythonProcess.kill('SIGTERM');
    this.pythonProcess = null;
    this.isReady = false;
    
    // Reject all pending requests
    for (const [requestId, { reject }] of this.pendingRequests) {
      reject(new Error('Service stopped'));
    }
    this.pendingRequests.clear();
    
    this.emit('stopped');
  }

  isRunning() {
    return this.isReady && this.pythonProcess !== null;
  }

  async recognizeSpeech(audioBuffer, config = {}) {
    const request = {
      action: 'recognize',
      audioData: audioBuffer.toString('base64'),
      config: {
        language: 'en-US',
        timeout: 5000,
        ...config
      }
    };

    return this.sendRequest(request, config.timeout || 5000);
  }

  async synthesizeSpeech(text, config = {}) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Text cannot be empty');
    }

    const request = {
      action: 'synthesize',
      text: text.trim(),
      config: {
        voice: 'default',
        rate: 150,
        ...config
      }
    };

    const response = await this.sendRequest(request);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return Buffer.from(response.audioData, 'base64');
  }

  async updateConfig(newConfig) {
    const request = {
      action: 'configure',
      config: newConfig
    };

    return this.sendRequest(request);
  }

  async getStatus() {
    const request = {
      action: 'status'
    };

    return this.sendRequest(request);
  }

  async sendRequest(request, timeout = 10000) {
    if (!this.isRunning()) {
      // Queue request if service not ready
      if (this.requestQueue.length >= this.maxQueueSize) {
        return Promise.reject(new Error('Request queue full'));
      }
      
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ request, resolve, reject, timeout });
      });
    }

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      request.requestId = requestId;
      
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        if (request.action === 'recognize') {
          resolve({
            transcript: '',
            confidence: 0,
            error: 'Recognition timeout'
          });
        } else {
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Store request handlers
      this.pendingRequests.set(requestId, {
        resolve: (response) => {
          clearTimeout(timeoutHandle);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        }
      });

      // Send request to Python service
      try {
        this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  processQueue() {
    while (this.requestQueue.length > 0 && this.isRunning()) {
      const { request, resolve, reject, timeout } = this.requestQueue.shift();
      
      this.sendRequest(request, timeout)
        .then(resolve)
        .catch(reject);
    }
  }

  getLogs() {
    return { ...this.logs };
  }

  clearLogs() {
    this.logs.errors = [];
    this.logs.info = [];
  }
}

module.exports = { PythonSpeechService };