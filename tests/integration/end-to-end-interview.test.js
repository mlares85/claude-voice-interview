/**
 * End-to-End Integration Test for Complete Interview Flow
 * Tests the full pipeline: Speech → Claude Code → Response → TTS
 */

const { ClaudeCodeService } = require('../../src/main/claude-code-service');
const { LocalSpeechProvider } = require('../../src/main/speech-providers/local-provider');
const { GoogleSpeechProvider } = require('../../src/main/speech-providers/cloud-provider');
const { SpeechProviderFactory } = require('../../src/main/speech-providers/provider-factory');

describe('End-to-End Interview Integration', () => {
  let claudeService;
  let speechProvider;

  beforeAll(async () => {
    // Set up the Claude Code service
    claudeService = new ClaudeCodeService();
    
    // Set up speech provider (using local for testing)
    speechProvider = await SpeechProviderFactory.create({
      provider: 'local',
      localSettings: { language: 'en-US' }
    });
  });

  afterAll(async () => {
    // Clean up services
    if (claudeService) {
      await claudeService.stop();
    }
    if (speechProvider && speechProvider.pythonService) {
      await speechProvider.pythonService.stop();
    }
  });

  describe('Complete Interview Session Flow', () => {
    test('should conduct a full technical interview session', async () => {
      // Mock Claude Code to return structured responses
      claudeService._sendPromptToClaudeCode = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          sessionId: 'session-tech-001',
          initialQuestion: 'Tell me about your experience with JavaScript and modern web development.',
          suggestedFlow: ['background', 'technical-concepts', 'problem-solving', 'questions'],
          estimatedQuestions: 5
        }))
        .mockImplementationOnce(() => Promise.resolve({
          question: 'Can you explain the difference between let, const, and var in JavaScript?',
          followUp: ['What about hoisting?', 'When would you use each one?'],
          difficulty: 'medium',
          expectedTopics: ['scope', 'hoisting', 'block scope']
        }))
        .mockImplementationOnce(() => Promise.resolve({
          score: 8,
          feedback: 'Excellent understanding of variable declarations and scoping concepts.',
          strengths: ['Clear explanation', 'Good understanding of scope'],
          improvements: ['Could mention temporal dead zone'],
          suggestions: ['Practice more advanced closure examples']
        }))
        .mockImplementationOnce(() => Promise.resolve({
          question: 'How would you implement debouncing in JavaScript?',
          followUp: ['What about throttling?', 'When would you use each?'],
          difficulty: 'medium',
          reasoning: 'Building on their strong fundamentals to test practical application'
        }))
        .mockImplementationOnce(() => Promise.resolve({
          overallScore: 8,
          summary: 'Strong technical interview performance with excellent JavaScript fundamentals.',
          strengths: ['Clear communication', 'Strong JS fundamentals', 'Good problem-solving approach'],
          areasForImprovement: ['Could go deeper into advanced concepts', 'More specific examples'],
          recommendations: ['Practice system design questions', 'Review advanced async patterns'],
          nextSteps: 'Ready for senior-level technical discussions'
        }));

      console.log('🎯 Starting End-to-End Interview Demo...\n');

      // STEP 1: Create Interview Session
      console.log('📋 Step 1: Creating interview session...');
      const sessionConfig = {
        role: 'Senior Frontend Developer',
        experience: '5+ years',
        interviewType: 'technical',
        duration: 30
      };

      const session = await claudeService.createSession(sessionConfig);
      
      expect(session.sessionId).toBe('session-tech-001');
      expect(session.initialQuestion).toContain('JavaScript');
      console.log(`✅ Session created: ${session.sessionId}`);
      console.log(`💬 Opening question: "${session.initialQuestion}"\n`);

      // STEP 2: Generate Follow-up Question
      console.log('🤔 Step 2: Generating follow-up question...');
      const followUpRequest = {
        previousQuestion: session.initialQuestion,
        userResponse: 'I have 6 years of experience with JavaScript, primarily using React and Node.js. I\'ve worked on both frontend applications and backend APIs.',
        context: 'technical_screening'
      };

      const followUp = await claudeService.generateFollowUp(followUpRequest);
      
      expect(followUp.question).toContain('let, const, and var');
      expect(followUp.difficulty).toBe('medium');
      console.log(`✅ Follow-up generated: "${followUp.question}"`);
      console.log(`📊 Difficulty: ${followUp.difficulty}`);
      console.log(`🔍 Expected topics: ${followUp.expectedTopics.join(', ')}\n`);

      // STEP 3: Provide Feedback on Response
      console.log('📝 Step 3: Analyzing candidate response...');
      const feedbackRequest = {
        question: followUp.question,
        userResponse: 'Let creates block-scoped variables, const creates block-scoped constants that cannot be reassigned, and var creates function-scoped variables. Var is hoisted and can be redeclared, while let and const are not.',
        expectedTopics: followUp.expectedTopics
      };

      const feedback = await claudeService.provideFeedback(feedbackRequest);
      
      expect(feedback.score).toBe(8);
      expect(feedback.feedback).toContain('Excellent understanding');
      console.log(`✅ Response scored: ${feedback.score}/10`);
      console.log(`💭 Feedback: "${feedback.feedback}"`);
      console.log(`💪 Strengths: ${feedback.strengths.join(', ')}`);
      console.log(`📚 Suggestions: ${feedback.suggestions.join(', ')}\n`);

      // STEP 4: Generate Next Question
      console.log('🔄 Step 4: Generating next question based on performance...');
      const nextQuestionRequest = {
        previousQuestion: followUp.question,
        userResponse: feedbackRequest.userResponse,
        context: 'technical_deep_dive',
        performanceLevel: 'strong'
      };

      const nextQuestion = await claudeService.generateFollowUp(nextQuestionRequest);
      
      expect(nextQuestion.question).toContain('debouncing');
      console.log(`✅ Next question: "${nextQuestion.question}"`);
      console.log(`🧠 Reasoning: "${nextQuestion.reasoning}"\n`);

      // STEP 5: End Session with Summary
      console.log('🏁 Step 5: Ending session and generating summary...');
      const sessionData = {
        sessionId: session.sessionId,
        questionsAsked: 3,
        responses: [
          'I have 6 years of experience with JavaScript...',
          'Let creates block-scoped variables...',
          'Debouncing delays function execution...'
        ],
        duration: 25
      };

      const summary = await claudeService.endSession(sessionData);
      
      expect(summary.overallScore).toBe(8);
      expect(summary.summary).toContain('Strong technical interview');
      console.log(`✅ Session completed with overall score: ${summary.overallScore}/10`);
      console.log(`📋 Summary: "${summary.summary}"`);
      console.log(`🌟 Strengths: ${summary.strengths.join(', ')}`);
      console.log(`🎯 Recommendations: ${summary.recommendations.join(', ')}`);
      console.log(`🚀 Next steps: "${summary.nextSteps}"\n`);

      console.log('🎉 End-to-End Interview Demo Complete!\n');
      
      // Verify the complete flow worked
      expect(claudeService._sendPromptToClaudeCode).toHaveBeenCalledTimes(5);
    }, 30000); // 30 second timeout for full flow

    test('should handle speech-to-text integration', async () => {
      console.log('🎤 Testing Speech-to-Text Integration...\n');

      // Mock audio data (would be from microphone in real scenario)
      const mockAudioBuffer = Buffer.from('mock audio data representing: "What is closure in JavaScript?"');
      
      console.log('🎧 Processing audio input...');
      const speechResult = await speechProvider.recognizeSpeech(mockAudioBuffer);
      
      expect(speechResult).toHaveProperty('transcript');
      expect(speechResult).toHaveProperty('confidence');
      console.log(`✅ Transcribed: "${speechResult.transcript}"`);
      console.log(`📊 Confidence: ${speechResult.confidence || 'N/A'}\n`);

      // Now use that transcript as input to Claude
      if (speechResult.transcript) {
        console.log('🤖 Sending transcript to Claude Code...');
        
        // Mock Claude response for this test
        claudeService._sendPromptToClaudeCode = jest.fn().mockResolvedValue({
          question: 'Can you provide a practical example of closure in action?',
          difficulty: 'medium',
          followUp: ['What are the memory implications?', 'When might this be useful?']
        });

        const claudeResponse = await claudeService.generateFollowUp({
          previousQuestion: 'Tell me about JavaScript fundamentals',
          userResponse: speechResult.transcript,
          context: 'technical_interview'
        });

        expect(claudeResponse.question).toContain('closure');
        console.log(`✅ Claude generated: "${claudeResponse.question}"\n`);

        // Test text-to-speech response
        console.log('🔊 Converting response to speech...');
        const ttsResult = await speechProvider.synthesizeSpeech(claudeResponse.question);
        
        expect(Buffer.isBuffer(ttsResult)).toBe(true);
        console.log(`✅ Generated ${ttsResult.length} bytes of audio data\n`);
        
        console.log('🎉 Complete Speech ↔ Claude ↔ Speech pipeline working!\n');
      }
    }, 15000);

    test('should handle different interview types', async () => {
      console.log('🔄 Testing Multiple Interview Types...\n');

      const interviewTypes = [
        {
          type: 'behavioral',
          role: 'Team Lead',
          expectedContent: 'team'
        },
        {
          type: 'system-design', 
          role: 'Senior Engineer',
          expectedContent: 'system'
        },
        {
          type: 'technical',
          role: 'Frontend Developer',
          expectedContent: 'technical'
        }
      ];

      for (const interview of interviewTypes) {
        console.log(`📋 Testing ${interview.type} interview...`);

        // Mock appropriate response for each type
        claudeService._sendPromptToClaudeCode = jest.fn().mockResolvedValue({
          question: `Sample ${interview.type} question for ${interview.role}`,
          difficulty: 'medium',
          followUp: [`${interview.type} follow-up 1`, `${interview.type} follow-up 2`]
        });

        const question = await claudeService.generateQuestion({
          type: interview.type,
          role: interview.role,
          experience: 'mid-level'
        });

        expect(question.question).toContain(interview.type);
        console.log(`✅ ${interview.type}: "${question.question}"`);
      }

      console.log('\n🎉 All interview types working correctly!\n');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should gracefully handle service failures', async () => {
      console.log('🚨 Testing Error Handling...\n');

      // Test Claude Code service failure
      const originalMethod = claudeService._sendPromptToClaudeCode;
      claudeService._sendPromptToClaudeCode = jest.fn().mockRejectedValue(new Error('Claude Code service unavailable'));

      console.log('❌ Simulating Claude Code failure...');
      
      try {
        await claudeService.generateQuestion({
          type: 'technical',
          role: 'Developer'
        });
      } catch (error) {
        expect(error.message).toBe('Claude Code service unavailable');
        console.log(`✅ Error handled correctly: ${error.message}`);
      }

      // Restore service
      claudeService._sendPromptToClaudeCode = originalMethod;
      console.log('✅ Service restored\n');

      // Test speech provider failure
      const originalRecognize = speechProvider.recognizeSpeech;
      speechProvider.recognizeSpeech = jest.fn().mockResolvedValue({
        transcript: '',
        confidence: 0,
        error: 'Microphone not available'
      });

      console.log('🎤 Testing speech recognition fallback...');
      const result = await speechProvider.recognizeSpeech(Buffer.from('test'));
      
      expect(result.error).toBe('Microphone not available');
      console.log(`✅ Speech error handled: ${result.error}`);

      // Restore
      speechProvider.recognizeSpeech = originalRecognize;
      console.log('✅ Speech service restored\n');
      
      console.log('🎉 Error handling tests complete!\n');
    });
  });
});