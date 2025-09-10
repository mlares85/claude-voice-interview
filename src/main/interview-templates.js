/**
 * Interview Prompt Templates for Claude Code Integration
 * Templates that structure communication with Claude Code for intelligent interviewing
 */

class InterviewTemplates {
  
  /**
   * Generate initial question prompt based on interview type and context
   */
  static generateQuestionPrompt(request) {
    const { type, role, experience, context } = request;
    
    const basePrompt = `You are conducting a ${type} interview for a ${role} position with ${experience} experience level.

Context: ${context || 'Initial screening'}

Generate a single interview question that is:
- Appropriate for the experience level
- Relevant to the role
- Engaging and conversational
- Not too complex for an opening question

Respond with JSON in this format:
{
  "question": "Your interview question here",
  "followUp": ["potential follow-up 1", "potential follow-up 2"],
  "difficulty": "easy|medium|hard",
  "expectedTopics": ["topic1", "topic2"],
  "timeEstimate": 5
}

Do not include any other text outside the JSON response.`;

    return this._addTypeSpecificContext(basePrompt, type);
  }

  /**
   * Generate follow-up question based on user's previous response
   */
  static generateFollowUpPrompt(request) {
    const { previousQuestion, userResponse, context } = request;
    
    return `Based on this interview exchange, generate an appropriate follow-up question.

Previous Question: "${previousQuestion}"
User's Response: "${userResponse}"
Interview Context: ${context}

Analyze the user's response and generate a follow-up that:
- Builds naturally on their answer
- Probes deeper into relevant technical/behavioral areas
- Maintains conversational flow
- Assesses their understanding or experience

Respond with JSON in this format:
{
  "question": "Your follow-up question here",
  "followUp": ["potential next questions"],
  "difficulty": "easy|medium|hard",
  "reasoning": "Why this follow-up makes sense",
  "timeEstimate": 3
}

Do not include any other text outside the JSON response.`;
  }

  /**
   * Generate feedback prompt for user responses
   */
  static generateFeedbackPrompt(request) {
    const { question, userResponse, expectedTopics } = request;
    
    return `Evaluate this interview response and provide constructive feedback.

Question: "${question}"
User's Response: "${userResponse}"
Expected Topics: ${expectedTopics ? expectedTopics.join(', ') : 'Various relevant topics'}

Provide balanced, constructive feedback that:
- Acknowledges strengths in their response
- Identifies areas for improvement
- Suggests specific ways to enhance their answer
- Gives a fair numerical score (1-10)

Respond with JSON in this format:
{
  "score": 7,
  "feedback": "Overall assessment and constructive comments",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "suggestions": ["specific suggestion1", "specific suggestion2"]
}

Do not include any other text outside the JSON response.`;
  }

  /**
   * Generate session creation prompt
   */
  static generateSessionPrompt(sessionConfig) {
    const { role, experience, interviewType, duration } = sessionConfig;
    
    return `Create an interview session plan for a ${role} position.

Session Details:
- Role: ${role}
- Experience Level: ${experience}
- Interview Type: ${interviewType}
- Duration: ${duration} minutes

Create a structured interview plan that:
- Has appropriate pacing for the time limit
- Includes a logical flow of topics
- Balances different skill areas
- Provides an engaging opening question

Respond with JSON in this format:
{
  "sessionId": "unique-session-id",
  "initialQuestion": "Opening question to start the interview",
  "suggestedFlow": ["topic1", "topic2", "topic3"],
  "estimatedQuestions": 8,
  "focusAreas": ["technical skills", "problem solving", "communication"]
}

Do not include any other text outside the JSON response.`;
  }

  /**
   * Generate session end/summary prompt
   */
  static generateSummaryPrompt(sessionData) {
    const { questionsAsked, responses, duration, sessionId } = sessionData;
    
    return `Generate a comprehensive interview summary based on this session.

Session ID: ${sessionId}
Duration: ${duration} minutes
Questions Asked: ${questionsAsked}
Sample Responses: ${responses ? responses.slice(0, 3).join(' | ') : 'Various responses provided'}

Create a professional interview summary that:
- Provides an overall assessment
- Highlights key strengths demonstrated
- Identifies development areas
- Gives actionable recommendations
- Includes a fair overall score

Respond with JSON in this format:
{
  "overallScore": 7,
  "summary": "Professional summary paragraph",
  "strengths": ["clear communication", "strong technical foundation"],
  "areasForImprovement": ["needs more depth in X", "could improve Y"],
  "recommendations": ["practice behavioral questions", "review system design"],
  "nextSteps": "Suggested next steps for the candidate"
}

Do not include any other text outside the JSON response.`;
  }

  /**
   * Add type-specific context to prompts
   */
  static _addTypeSpecificContext(basePrompt, type) {
    const typeContexts = {
      'technical': `
Technical Interview Focus:
- Assess coding ability, problem-solving, and technical depth
- Ask about technologies, algorithms, system design
- Look for practical experience and theoretical knowledge
- Consider code quality, efficiency, and best practices`,

      'behavioral': `
Behavioral Interview Focus:
- Evaluate soft skills, teamwork, and cultural fit
- Use STAR method (Situation, Task, Action, Result) frameworks
- Assess leadership, communication, and adaptability
- Look for concrete examples from past experiences`,

      'system-design': `
System Design Interview Focus:
- Evaluate architectural thinking and scalability concepts
- Assess understanding of distributed systems, databases, caching
- Look for trade-off analysis and practical considerations
- Test ability to design robust, maintainable systems`,

      'general': `
General Interview Focus:
- Balance technical and behavioral assessment
- Evaluate overall fit for the role and team
- Assess problem-solving approach and communication
- Look for growth potential and learning ability`
    };

    return basePrompt + '\n\n' + (typeContexts[type] || typeContexts['general']);
  }

  /**
   * Generate configuration update prompt
   */
  static generateConfigPrompt(config) {
    return `Update interview configuration settings.

New Configuration:
${JSON.stringify(config, null, 2)}

Apply these settings to the interview engine and respond with confirmation.

Respond with JSON in this format:
{
  "success": true,
  "config": ${JSON.stringify(config)},
  "message": "Configuration updated successfully"
}

Do not include any other text outside the JSON response.`;
  }

  /**
   * Generate status request prompt
   */
  static generateStatusPrompt() {
    return `Provide current status of the interview system.

Respond with JSON in this format:
{
  "isReady": true,
  "activeSession": "session-id or null",
  "requestsProcessed": 0,
  "uptime": 1234,
  "configuration": {"current": "settings"}
}

Do not include any other text outside the JSON response.`;
  }
}

module.exports = { InterviewTemplates };