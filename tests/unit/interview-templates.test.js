/**
 * TDD Tests for Interview Templates
 * Tests the prompt generation for Claude Code integration
 */

const { InterviewTemplates } = require('../../src/main/interview-templates');

describe('Interview Templates', () => {
  
  describe('Question Generation', () => {
    test('should generate technical interview question prompt', () => {
      const request = {
        type: 'technical',
        role: 'Software Engineer',
        experience: 'mid-level',
        context: 'Initial technical screening'
      };

      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('technical interview');
      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('mid-level');
      expect(prompt).toContain('Initial technical screening');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('Technical Interview Focus');
    });

    test('should generate behavioral interview question prompt', () => {
      const request = {
        type: 'behavioral',
        role: 'Team Lead',
        experience: 'senior',
        context: 'Leadership assessment'
      };

      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('behavioral interview');
      expect(prompt).toContain('Team Lead');
      expect(prompt).toContain('senior');
      expect(prompt).toContain('Leadership assessment');
      expect(prompt).toContain('Behavioral Interview Focus');
      expect(prompt).toContain('STAR method');
    });

    test('should handle missing context gracefully', () => {
      const request = {
        type: 'technical',
        role: 'Developer',
        experience: 'junior'
      };

      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('Initial screening');
      expect(prompt).toContain('Developer');
      expect(prompt).toContain('junior');
    });
  });

  describe('Follow-up Generation', () => {
    test('should generate follow-up question prompt', () => {
      const request = {
        previousQuestion: 'Tell me about your JavaScript experience.',
        userResponse: 'I have 3 years working with React and Node.js',
        context: 'technical_screening'
      };

      const prompt = InterviewTemplates.generateFollowUpPrompt(request);

      expect(prompt).toContain('Tell me about your JavaScript experience.');
      expect(prompt).toContain('I have 3 years working with React and Node.js');
      expect(prompt).toContain('technical_screening');
      expect(prompt).toContain('follow-up');
      expect(prompt).toContain('JSON');
    });

    test('should include analysis instructions', () => {
      const request = {
        previousQuestion: 'What is closure?',
        userResponse: 'Closure is when a function remembers outer variables',
        context: 'js_concepts'
      };

      const prompt = InterviewTemplates.generateFollowUpPrompt(request);

      expect(prompt).toContain('Analyze the user\'s response');
      expect(prompt).toContain('Builds naturally');
      expect(prompt).toContain('conversational flow');
    });
  });

  describe('Feedback Generation', () => {
    test('should generate feedback prompt with expected topics', () => {
      const request = {
        question: 'Explain how async/await works in JavaScript',
        userResponse: 'Async/await makes promises easier to work with',
        expectedTopics: ['promises', 'error handling', 'event loop']
      };

      const prompt = InterviewTemplates.generateFeedbackPrompt(request);

      expect(prompt).toContain('Explain how async/await works');
      expect(prompt).toContain('Async/await makes promises easier');
      expect(prompt).toContain('promises, error handling, event loop');
      expect(prompt).toContain('constructive feedback');
      expect(prompt).toContain('score');
    });

    test('should handle missing expected topics', () => {
      const request = {
        question: 'Tell me about a challenging project',
        userResponse: 'I worked on a microservices architecture'
      };

      const prompt = InterviewTemplates.generateFeedbackPrompt(request);

      expect(prompt).toContain('Various relevant topics');
      expect(prompt).toContain('challenging project');
      expect(prompt).toContain('microservices architecture');
    });
  });

  describe('Session Management', () => {
    test('should generate session creation prompt', () => {
      const sessionConfig = {
        role: 'Senior Frontend Developer',
        experience: '5+ years',
        interviewType: 'technical',
        duration: 45
      };

      const prompt = InterviewTemplates.generateSessionPrompt(sessionConfig);

      expect(prompt).toContain('Senior Frontend Developer');
      expect(prompt).toContain('5+ years');
      expect(prompt).toContain('technical');
      expect(prompt).toContain('45 minutes');
      expect(prompt).toContain('sessionId');
      expect(prompt).toContain('initialQuestion');
      expect(prompt).toContain('suggestedFlow');
    });

    test('should generate session summary prompt', () => {
      const sessionData = {
        sessionId: 'session-123',
        questionsAsked: 6,
        responses: ['response1', 'response2', 'response3'],
        duration: 30
      };

      const prompt = InterviewTemplates.generateSummaryPrompt(sessionData);

      expect(prompt).toContain('session-123');
      expect(prompt).toContain('6');
      expect(prompt).toContain('30 minutes');
      expect(prompt).toContain('response1 | response2 | response3');
      expect(prompt).toContain('overallScore');
      expect(prompt).toContain('recommendations');
    });
  });

  describe('Configuration and Status', () => {
    test('should generate configuration update prompt', () => {
      const config = {
        temperature: 0.7,
        maxTokens: 1000,
        interviewStyle: 'conversational'
      };

      const prompt = InterviewTemplates.generateConfigPrompt(config);

      expect(prompt).toContain('temperature');
      expect(prompt).toContain('0.7');
      expect(prompt).toContain('maxTokens');
      expect(prompt).toContain('1000');
      expect(prompt).toContain('conversational');
      expect(prompt).toContain('success');
    });

    test('should generate status request prompt', () => {
      const prompt = InterviewTemplates.generateStatusPrompt();

      expect(prompt).toContain('current status');
      expect(prompt).toContain('isReady');
      expect(prompt).toContain('activeSession');
      expect(prompt).toContain('requestsProcessed');
      expect(prompt).toContain('uptime');
    });
  });

  describe('Type-specific Context', () => {
    test('should add technical context for technical interviews', () => {
      const request = { type: 'technical', role: 'Dev', experience: 'mid' };
      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('Technical Interview Focus');
      expect(prompt).toContain('coding ability');
      expect(prompt).toContain('algorithms');
      expect(prompt).toContain('system design');
    });

    test('should add behavioral context for behavioral interviews', () => {
      const request = { type: 'behavioral', role: 'Manager', experience: 'senior' };
      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('Behavioral Interview Focus');
      expect(prompt).toContain('soft skills');
      expect(prompt).toContain('STAR method');
      expect(prompt).toContain('cultural fit');
    });

    test('should add system design context for system design interviews', () => {
      const request = { type: 'system-design', role: 'Architect', experience: 'senior' };
      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('System Design Interview Focus');
      expect(prompt).toContain('architectural thinking');
      expect(prompt).toContain('distributed systems');
      expect(prompt).toContain('scalability');
    });

    test('should use general context for unknown interview types', () => {
      const request = { type: 'unknown', role: 'Dev', experience: 'mid' };
      const prompt = InterviewTemplates.generateQuestionPrompt(request);

      expect(prompt).toContain('General Interview Focus');
      expect(prompt).toContain('Balance technical and behavioral');
      expect(prompt).toContain('overall fit');
    });
  });
});