const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { InterviewTemplates } = require('./interview-templates');

class ClaudeCodeService extends EventEmitter {
  constructor() {
    super();
    this.claudeProcess = null;
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
    this.claudeProcess = null;
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
    if (this.claudeProcess) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Start Claude Code CLI process
        this.claudeProcess = spawn('claude-code', [], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        });

        this._setupProcessHandlers(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  _setupProcessHandlers(resolve, reject) {
    // Handle stdout (responses from Claude Code)
    this.claudeProcess.stdout.on('data', (data) => {
      this._handleClaudeResponse(data);
      
      // Check for initialization complete
      const output = data.toString();
      if (output.includes('Claude Code initialized') && !this.isReady) {
        this.isReady = true;
        this.emit('ready');
        resolve();
        this._processQueue();
      }
    });

    // Handle stderr (messages from Claude Code)
    this.claudeProcess.stderr.on('data', (data) => {
      const message = data.toString();
      
      // Filter out info/warning messages - only emit actual errors
      const isInfoOrWarning = message.includes('INFO:') || 
                              message.includes('Warning:') || 
                              message.includes('rate limit');
      
      if (isInfoOrWarning) {
        this.logs.info.push(message);
      } else {
        this.logs.errors.push(message);
        this.emit('error', message);
      }
    });

    // Handle process exit
    this.claudeProcess.on('exit', (code) => {
      this.isReady = false;
      this.claudeProcess = null;
      
      if (code !== 0 && code !== null) {
        // Unexpected exit - attempt restart
        this.emit('crash', code);
        setTimeout(() => this.start().catch(() => {}), 1000);
      }
    });

    // Handle process errors
    this.claudeProcess.on('error', (error) => {
      this.isReady = false;
      this.logs.errors.push(error.message);
      this.emit('error', error);
      reject(error);
    });
  }

  _handleClaudeResponse(data) {
    const content = data.toString();
    
    // Handle REQUEST_ID format for prompt responses
    const requestIdMatch = content.match(/REQUEST_ID:(\d+)/);
    if (requestIdMatch) {
      const requestId = requestIdMatch[1];
      
      if (this.pendingRequests.has(requestId)) {
        const { resolve, reject } = this.pendingRequests.get(requestId);
        this.pendingRequests.delete(requestId);
        
        // Extract content after REQUEST_ID line
        const responseContent = content.split('\n').slice(1).join('\n');
        resolve(responseContent);
      }
      return;
    }
    
    // Handle traditional JSON responses
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.requestId && this.pendingRequests.has(response.requestId)) {
          const { resolve, reject } = this.pendingRequests.get(response.requestId);
          this.pendingRequests.delete(response.requestId);
          
          if (response.error) {
            reject(new Error(response.error));
          } else {
            // Remove requestId from response before resolving
            const { requestId, ...result } = response;
            resolve(result);
          }
        }
      } catch (error) {
        // Only log as error if it's not a prompt response
        if (!content.includes('REQUEST_ID:')) {
          this.logs.errors.push(`Failed to parse response: ${line}`);
          this.emit('error', new Error('Invalid response format'));
        }
      }
    }
  }

  async stop() {
    if (!this.claudeProcess) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.claudeProcess.once('exit', () => {
        this.reset();
        resolve();
      });

      this.claudeProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if graceful shutdown fails
      setTimeout(() => {
        if (this.claudeProcess) {
          this.claudeProcess.kill('SIGKILL');
          this.reset();
          resolve();
        }
      }, 5000);
    });
  }

  _sendRequest(action, data, timeout = 10000) {
    if (!this.isReady && this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        this.requestQueue.push({ action, data, resolve, reject, timeout });
        return;
      }

      const requestId = (++this.requestId).toString();
      const request = {
        requestId,
        action,
        ...data
      };

      this.pendingRequests.set(requestId, { resolve, reject });

      // Set timeout
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Clear timeout when request completes
      const originalResolve = resolve;
      const originalReject = reject;
      
      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timer);
          originalResolve(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          originalReject(error);
        }
      });

      this.claudeProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  _processQueue() {
    while (this.requestQueue.length > 0 && this.isReady) {
      const queuedRequest = this.requestQueue.shift();
      
      if (queuedRequest.type === 'prompt') {
        // Handle prompt-based request
        const { prompt, resolve, reject, timeout } = queuedRequest;
        this._sendPromptToClaudeCode(prompt, timeout).then(resolve).catch(reject);
      } else {
        // Handle traditional JSON request
        const { action, data, resolve, reject, timeout } = queuedRequest;
        this._sendRequest(action, data, timeout).then(resolve).catch(reject);
      }
    }
  }

  async _sendPromptToClaudeCode(prompt, timeout = 10000) {
    if (!this.isReady && this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        this.requestQueue.push({ 
          type: 'prompt',
          prompt, 
          resolve, 
          reject, 
          timeout 
        });
        return;
      }

      const requestId = (++this.requestId).toString();
      
      // Store the request with custom handler for JSON parsing
      this.pendingRequests.set(requestId, { 
        resolve: (response) => {
          try {
            // Parse JSON response from Claude Code
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsedResponse = JSON.parse(jsonMatch[0]);
              resolve(parsedResponse);
            } else {
              reject(new Error('No JSON found in Claude Code response'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse Claude Code JSON response: ${error.message}`));
          }
        },
        reject 
      });

      // Set timeout
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Update stored handlers to clear timeout
      const { resolve: originalResolve, reject: originalReject } = this.pendingRequests.get(requestId);
      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timer);
          originalResolve(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          originalReject(error);
        }
      });

      // Send the prompt to Claude Code with request ID
      const request = `REQUEST_ID:${requestId}\n${prompt}\n---END_REQUEST---\n`;
      this.claudeProcess.stdin.write(request);
    });
  }

  async generateQuestion(request, timeout = 10000) {
    const prompt = InterviewTemplates.generateQuestionPrompt(request);
    return this._sendPromptToClaudeCode(prompt, timeout);
  }

  async generateFollowUp(request, timeout = 10000) {
    const prompt = InterviewTemplates.generateFollowUpPrompt(request);
    return this._sendPromptToClaudeCode(prompt, timeout);
  }

  async provideFeedback(request, timeout = 10000) {
    const prompt = InterviewTemplates.generateFeedbackPrompt(request);
    return this._sendPromptToClaudeCode(prompt, timeout);
  }

  async updateConfig(config, timeout = 5000) {
    return this._sendRequest('updateConfig', { config }, timeout);
  }

  async getStatus(timeout = 5000) {
    return this._sendRequest('getStatus', {}, timeout);
  }

  async createSession(sessionConfig, timeout = 5000) {
    const prompt = InterviewTemplates.generateSessionPrompt(sessionConfig);
    return this._sendPromptToClaudeCode(prompt, timeout);
  }

  async endSession(sessionData, timeout = 5000) {
    const prompt = InterviewTemplates.generateSummaryPrompt(sessionData);
    return this._sendPromptToClaudeCode(prompt, timeout);
  }

  getLogs() {
    return {
      errors: [...this.logs.errors],
      info: [...this.logs.info]
    };
  }

  clearLogs() {
    this.logs.errors = [];
    this.logs.info = [];
  }
}

module.exports = { ClaudeCodeService };