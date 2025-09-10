#!/usr/bin/env node

/**
 * Interactive Interview Demo
 * Demonstrates the complete Claude Voice Interview Simulator in action
 */

const { ClaudeCodeService } = require('../src/main/claude-code-service');
const { SpeechProviderFactory } = require('../src/main/speech-providers/provider-factory');
const readline = require('readline');

// Simple mock function for demo purposes
function createMockFunction(implementation) {
  const fn = implementation || (() => {});
  fn.mockImplementation = (impl) => { Object.assign(fn, impl); return fn; };
  fn.mockResolvedValue = (value) => { fn.mockImplementation(() => Promise.resolve(value)); return fn; };
  return fn;
}

// Add mock to global for demo
global.jest = { fn: createMockFunction };

class InterviewDemo {
  constructor() {
    this.claudeService = new ClaudeCodeService();
    this.speechProvider = null;
    this.currentSession = null;
    this.questionHistory = [];
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    console.log('🎯 Claude Voice Interview Simulator Demo\n');
    console.log('🔧 Initializing services...\n');

    try {
      // Initialize speech provider (using local for demo)
      this.speechProvider = await SpeechProviderFactory.create({
        provider: 'local',
        localSettings: { language: 'en-US' }
      });

      // Mock Claude Code service for demo purposes
      this.setupMockClaudeResponses();

      console.log('✅ Services initialized successfully!\n');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize services:', error.message);
      return false;
    }
  }

  setupMockClaudeResponses() {
    // Create realistic mock responses for the demo
    const mockResponses = {
      session: {
        sessionId: 'demo-session-001',
        initialQuestion: 'Tell me about your experience with JavaScript and modern web development frameworks.',
        suggestedFlow: ['background', 'technical-concepts', 'problem-solving', 'questions'],
        estimatedQuestions: 5
      },
      
      questions: [
        {
          question: 'Can you explain the difference between let, const, and var in JavaScript?',
          followUp: ['What about hoisting behavior?', 'When would you use each one?'],
          difficulty: 'medium',
          expectedTopics: ['scope', 'hoisting', 'block scope']
        },
        {
          question: 'How would you implement debouncing in JavaScript?',
          followUp: ['What about throttling?', 'When would you use each?'],
          difficulty: 'medium',
          reasoning: 'Building on fundamentals to test practical application'
        },
        {
          question: 'Describe how you would optimize a React application for performance.',
          followUp: ['What tools would you use?', 'How do you measure performance?'],
          difficulty: 'hard',
          reasoning: 'Testing advanced optimization knowledge'
        }
      ],

      feedback: [
        {
          score: 8,
          feedback: 'Excellent understanding of JavaScript variable declarations and scoping.',
          strengths: ['Clear explanation', 'Good grasp of technical concepts'],
          improvements: ['Could mention temporal dead zone'],
          suggestions: ['Practice more complex closure examples']
        },
        {
          score: 7,
          feedback: 'Good understanding of debouncing concept with practical implementation.',
          strengths: ['Practical approach', 'Code example provided'],
          improvements: ['Could explain use cases better'],
          suggestions: ['Study throttling differences']
        }
      ],

      summary: {
        overallScore: 8,
        summary: 'Strong technical interview performance demonstrating solid JavaScript fundamentals and practical problem-solving skills.',
        strengths: ['Clear communication', 'Strong technical foundation', 'Good code examples'],
        areasForImprovement: ['Could provide more real-world examples', 'Explain edge cases better'],
        recommendations: ['Practice system design questions', 'Review advanced React patterns'],
        nextSteps: 'Ready for senior-level technical discussions and architectural challenges'
      }
    };

    let questionIndex = 0;
    let feedbackIndex = 0;

    this.claudeService._sendPromptToClaudeCode = jest.fn((prompt) => {
      if (prompt.includes('Create an interview session')) {
        return Promise.resolve(mockResponses.session);
      } else if (prompt.includes('generate an appropriate follow-up') || prompt.includes('interview question')) {
        const response = mockResponses.questions[questionIndex % mockResponses.questions.length];
        questionIndex++;
        return Promise.resolve(response);
      } else if (prompt.includes('Evaluate this interview response')) {
        const response = mockResponses.feedback[feedbackIndex % mockResponses.feedback.length];
        feedbackIndex++;
        return Promise.resolve(response);
      } else if (prompt.includes('Generate a comprehensive interview summary')) {
        return Promise.resolve(mockResponses.summary);
      }
      
      return Promise.resolve({ message: 'Mock response' });
    });
  }

  async startDemo() {
    console.log('🚀 Starting Interactive Interview Demo\n');
    console.log('You can type your responses, and I\'ll simulate the voice recognition.');
    console.log('The system will generate intelligent follow-up questions and feedback.\n');

    // Create interview session
    console.log('📋 Creating interview session...');
    const sessionConfig = {
      role: 'Senior Frontend Developer',
      experience: '5+ years',
      interviewType: 'technical',
      duration: 30
    };

    this.currentSession = await this.claudeService.createSession(sessionConfig);
    console.log(`✅ Session ${this.currentSession.sessionId} created\n`);

    // Start the interview
    await this.conductInterview();
  }

  async conductInterview() {
    console.log('🎤 INTERVIEWER: ' + this.currentSession.initialQuestion);
    console.log('\n💬 Your response (or type "quit" to end): ');
    
    let questionCount = 0;
    const maxQuestions = 3;

    while (questionCount < maxQuestions) {
      const userResponse = await this.getUserInput();
      
      if (userResponse.toLowerCase() === 'quit') {
        break;
      }

      // Simulate speech recognition
      console.log('\n🎧 Processing your speech...');
      await this.simulateDelay(1000);
      console.log(`✅ Transcribed: "${userResponse}"`);

      // Get feedback on response
      console.log('\n🤖 Analyzing your response...');
      const feedback = await this.claudeService.provideFeedback({
        question: this.questionHistory[this.questionHistory.length - 1] || this.currentSession.initialQuestion,
        userResponse,
        expectedTopics: ['technical concepts', 'problem solving']
      });

      console.log(`\n📊 Score: ${feedback.score}/10`);
      console.log(`💭 Feedback: ${feedback.feedback}`);
      console.log(`💪 Strengths: ${feedback.strengths.join(', ')}`);
      if (feedback.suggestions.length > 0) {
        console.log(`📚 Suggestions: ${feedback.suggestions.join(', ')}`);
      }

      // Generate follow-up question
      if (questionCount < maxQuestions - 1) {
        console.log('\n🤔 Generating follow-up question...');
        const followUp = await this.claudeService.generateFollowUp({
          previousQuestion: this.questionHistory[this.questionHistory.length - 1] || this.currentSession.initialQuestion,
          userResponse,
          context: 'technical_interview'
        });

        this.questionHistory.push(followUp.question);
        
        console.log('\n🎤 INTERVIEWER: ' + followUp.question);
        if (followUp.reasoning) {
          console.log(`🧠 (Reasoning: ${followUp.reasoning})`);
        }
        console.log('\n💬 Your response: ');
      }

      questionCount++;
    }

    await this.endInterview();
  }

  async endInterview() {
    console.log('\n🏁 Ending interview session...');
    
    const summary = await this.claudeService.endSession({
      sessionId: this.currentSession.sessionId,
      questionsAsked: this.questionHistory.length + 1,
      responses: ['Sample responses from the interview'],
      duration: 25
    });

    console.log('\n' + '='.repeat(60));
    console.log('📋 INTERVIEW SUMMARY');
    console.log('='.repeat(60));
    console.log(`🎯 Overall Score: ${summary.overallScore}/10`);
    console.log(`📝 Summary: ${summary.summary}`);
    console.log(`\n🌟 Strengths:`);
    summary.strengths.forEach(strength => console.log(`  • ${strength}`));
    console.log(`\n📈 Areas for Improvement:`);
    summary.areasForImprovement.forEach(area => console.log(`  • ${area}`));
    console.log(`\n💡 Recommendations:`);
    summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log(`\n🚀 Next Steps: ${summary.nextSteps}`);
    console.log('='.repeat(60));

    console.log('\n🎉 Interview demo complete! Thank you for trying the Claude Voice Interview Simulator.\n');
  }

  async getUserInput() {
    return new Promise((resolve) => {
      this.rl.question('', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    this.rl.close();
    if (this.claudeService) {
      await this.claudeService.stop();
    }
    if (this.speechProvider && this.speechProvider.pythonService) {
      await this.speechProvider.pythonService.stop();
    }
  }
}

// Run the demo
async function runDemo() {
  const demo = new InterviewDemo();
  
  try {
    const initialized = await demo.initialize();
    if (initialized) {
      await demo.startDemo();
    }
  } catch (error) {
    console.error('Demo error:', error);
  } finally {
    await demo.cleanup();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Demo interrupted. Cleaning up...');
  process.exit(0);
});

if (require.main === module) {
  runDemo();
}

module.exports = { InterviewDemo };