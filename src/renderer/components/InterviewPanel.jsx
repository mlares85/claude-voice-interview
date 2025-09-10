import React, { useState } from 'react';

export function InterviewPanel() {
  const [interviewState, setInterviewState] = useState('idle'); // idle, active, paused
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const startInterview = () => {
    // Mock interview questions for now
    const mockQuestions = [
      "Tell me about yourself and your background.",
      "What's your experience with JavaScript?",
      "Can you explain the difference between let, const, and var?",
      "How would you implement a binary search algorithm?",
      "What questions do you have for me?"
    ];
    
    setQuestions(mockQuestions);
    setCurrentQuestionIndex(0);
    setInterviewState('active');
  };

  const stopInterview = () => {
    setInterviewState('idle');
    setQuestions([]);
    setCurrentQuestionIndex(0);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      alert('Interview completed!');
      stopInterview();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="interview-panel">
      <h2>Interview Session</h2>
      
      {interviewState === 'idle' && (
        <div className="interview-setup">
          <p>Ready to start your mock interview?</p>
          <button onClick={startInterview} className="start-interview">
            Start Interview
          </button>
        </div>
      )}

      {interviewState === 'active' && (
        <div className="interview-active">
          <div className="question-counter">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          
          <div className="current-question">
            <h3>Current Question:</h3>
            <p>{questions[currentQuestionIndex]}</p>
          </div>
          
          <div className="interview-controls">
            <button 
              onClick={previousQuestion} 
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <button onClick={nextQuestion}>
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
            <button onClick={stopInterview} className="stop-interview">
              Stop Interview
            </button>
          </div>
          
          <div className="interview-instructions">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Speak your answer aloud using the voice controls</li>
              <li>Use "Next" when you're ready for the next question</li>
              <li>Take your time - this is practice!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}