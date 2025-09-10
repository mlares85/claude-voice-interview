# Claude Code Voice Interview Simulator

## Project Overview
A voice-enabled wrapper around Claude Code that enables interactive interview practice sessions. Users can conduct mock technical interviews using speech input/output, with Claude Code providing intelligent questioning and feedback.

## Architecture
- **Voice Interface Layer**: Speech-to-text and text-to-speech using Python libraries
- **Claude Code Bridge**: Subprocess management and communication with Claude Code terminal
- **Interview Controller**: Manages interview flow, question progression, and session state
- **Command Handler**: Processes voice commands for interview control

## Core Components

### VoiceInterface Class
- Speech recognition using Google Speech Recognition API
- Text-to-speech using pyttsx3
- Configurable voice settings and timeout handling
- Ambient noise adjustment

### ClaudeCodeBridge Class
- Subprocess management for Claude Code process
- Bidirectional communication via stdin/stdout
- Queue-based input/output handling
- Threading for non-blocking operation

### InterviewController Class
- Main orchestrator for interview sessions
- Voice command processing
- Interview state management
- Integration between voice and Claude Code components

## Key Features
- Real-time voice interaction with Claude Code
- Configurable interview roles and difficulty levels
- Voice commands for session control
- Performance feedback and summaries
- Cross-platform audio support

## Dependencies
```
speechrecognition==3.10.0
pyttsx3==2.90
pyaudio==0.2.11
```

## Installation Requirements
- Claude Code installed and configured
- Python 3.7+
- Working microphone and speakers
- Platform-specific audio libraries (handled by setup script)

## Voice Commands
- "End interview" - Terminates session
- "Repeat question" - Repeats current question
- "Skip question" - Moves to next question

## File Structure
```
claude-voice-interview/
├── claude_voice_interview.py    # Main application
├── requirements.txt             # Python dependencies
├── setup.sh                    # Installation script
└── README.md                   # Documentation
```

## Implementation Details

### Speech Recognition Flow
1. Initialize microphone with ambient noise adjustment
2. Listen for speech with configurable timeout
3. Convert audio to text using Google Speech Recognition
4. Handle recognition errors gracefully

### Claude Code Integration
1. Start Claude Code as subprocess
2. Send interview initialization prompt
3. Maintain bidirectional communication queues
4. Monitor output for response completion indicators

### Interview Session Flow
1. Voice-based role and difficulty selection
2. Initialize Claude Code with interview context
3. Conduct Q&A loop with speech input/output
4. Handle voice commands during session
5. Provide final performance summary

## Error Handling
- Speech recognition timeouts and errors
- Claude Code process failures
- Audio device access issues
- Queue communication errors

## Extension Points
- Custom question banks for specific roles
- Performance scoring algorithms
- Interview session recording
- Multi-language support
- Visual feedback interface
- Integration with other AI models

## Development Next Steps
1. Test basic voice recognition and TTS functionality
2. Implement Claude Code subprocess communication
3. Create interview initialization prompts
4. Develop voice command recognition
5. Add error handling and recovery
6. Implement session management
7. Create setup and installation scripts
8. Add performance tracking features

## Technical Considerations
- Cross-platform audio compatibility
- Speech recognition accuracy optimization
- Claude Code process lifecycle management
- Threading and queue management
- Resource cleanup and error recovery

## Use Cases
- Technical interview practice
- Coding interview preparation
- Behavioral interview simulation
- System design interview practice
- Real-time coding assessment

## Success Metrics
- Accurate speech recognition (>90%)
- Reliable Claude Code integration
- Natural conversation flow
- Useful feedback quality
- Easy setup and configuration