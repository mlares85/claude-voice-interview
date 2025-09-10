/**
 * Basic TDD Tests for Claude Code Bridge Service
 * Focused on core functionality to validate the service works
 */

const { ClaudeCodeService } = require('../../src/main/claude-code-service');

describe('Claude Code Bridge Service - Basic Tests', () => {
  let claudeService;

  beforeEach(() => {
    claudeService = new ClaudeCodeService();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(claudeService.isReady).toBe(false);
      expect(claudeService.claudeProcess).toBe(null);
      expect(claudeService.requestQueue).toEqual([]);
      expect(claudeService.pendingRequests.size).toBe(0);
      expect(claudeService.maxQueueSize).toBe(10);
    });

    test('should have event emitter capabilities', () => {
      expect(typeof claudeService.on).toBe('function');
      expect(typeof claudeService.emit).toBe('function');
      expect(typeof claudeService.removeListener).toBe('function');
    });

    test('should have all required methods', () => {
      expect(typeof claudeService.start).toBe('function');
      expect(typeof claudeService.stop).toBe('function');
      expect(typeof claudeService.generateQuestion).toBe('function');
      expect(typeof claudeService.generateFollowUp).toBe('function');
      expect(typeof claudeService.provideFeedback).toBe('function');
      expect(typeof claudeService.createSession).toBe('function');
      expect(typeof claudeService.endSession).toBe('function');
      expect(typeof claudeService.updateConfig).toBe('function');
      expect(typeof claudeService.getStatus).toBe('function');
      expect(typeof claudeService.getLogs).toBe('function');
    });
  });

  describe('Logging Functionality', () => {
    test('should initialize with empty logs', () => {
      const logs = claudeService.getLogs();
      expect(logs.errors).toEqual([]);
      expect(logs.info).toEqual([]);
    });

    test('should clear logs', () => {
      claudeService.logs.errors.push('test error');
      claudeService.logs.info.push('test info');
      
      claudeService.clearLogs();
      
      const logs = claudeService.getLogs();
      expect(logs.errors).toEqual([]);
      expect(logs.info).toEqual([]);
    });

    test('should return copy of logs, not reference', () => {
      const logs1 = claudeService.getLogs();
      const logs2 = claudeService.getLogs();
      
      logs1.errors.push('test');
      expect(logs2.errors).toEqual([]);
      expect(claudeService.logs.errors).toEqual([]);
    });
  });

  describe('Request Management', () => {
    test('should handle queue size limit', () => {
      claudeService.maxQueueSize = 2;
      claudeService.isReady = false;
      
      // Add requests up to limit - these should not throw
      claudeService._sendRequest('test1', {}).catch(() => {}); 
      claudeService._sendRequest('test2', {}).catch(() => {});
      
      expect(claudeService.requestQueue.length).toBe(2);
      
      // Third request should throw immediately
      expect(() => {
        claudeService._sendRequest('test3', {});
      }).toThrow('Request queue is full');
    });

    test('should generate unique request IDs', () => {
      const id1 = ++claudeService.requestId;
      const id2 = ++claudeService.requestId;
      const id3 = ++claudeService.requestId;
      
      expect(id1).toBe(1);
      expect(id2).toBe(2); 
      expect(id3).toBe(3);
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });

  describe('State Management', () => {
    test('should reset state correctly', () => {
      // Set some state
      claudeService.isReady = true;
      claudeService.requestId = 5;
      claudeService.logs.errors.push('error');
      claudeService.logs.info.push('info');
      claudeService.pendingRequests.set('test', {});
      claudeService.requestQueue.push({});
      
      claudeService.reset();
      
      expect(claudeService.isReady).toBe(false);
      expect(claudeService.claudeProcess).toBe(null);
      expect(claudeService.requestId).toBe(0);
      expect(claudeService.requestQueue).toEqual([]);
      expect(claudeService.pendingRequests.size).toBe(0);
      expect(claudeService.logs.errors).toEqual([]);
      expect(claudeService.logs.info).toEqual([]);
    });
  });
});