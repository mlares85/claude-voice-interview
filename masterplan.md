# Master Plan - Claude Voice Interview Simulator

## Project Vision
Create a voice-enabled wrapper around Claude Code that enables interactive interview practice sessions, supporting both local and cloud-based speech processing with a professional desktop interface.

## Development Phases

### Phase 1: Foundation & Architecture ✅ COMPLETED
**Status**: ✅ Complete  
**Target**: Establish solid TDD foundation with dual speech provider system

#### Completed Tasks:
- ✅ Project structure with organized directories
- ✅ TDD framework with Jest (11/11 tests passing)
- ✅ Electron + React architecture
- ✅ Speech provider abstraction (local + cloud)
- ✅ React UI components (interview, voice controls, settings)
- ✅ GitHub repository setup with proper .gitignore
- ✅ Build system configuration (Vite + Jest)

**Deliverables**: Working Electron app with mock speech providers, complete test suite, professional UI

---

### Phase 2: Core Speech Integration 🔄 IN PROGRESS
**Status**: 🔄 Next Priority  
**Target**: Implement real speech recognition and synthesis

#### Tasks:
- 🔄 **Python Backend Service** (HIGH PRIORITY)
  - Create Python service with speech recognition (speechrecognition library)
  - Add text-to-speech capability (pyttsx3)
  - Implement IPC communication with Electron main process
  - Write comprehensive tests for Python service
  
- 🔄 **Local Provider Enhancement**
  - Replace mock implementation with real Python service calls
  - Add proper error handling and status reporting
  - Implement audio format conversion and buffering
  
- 🔄 **Cloud Provider Implementation** 
  - Integrate Google Cloud Speech-to-Text API
  - Add API key management and validation
  - Implement streaming recognition for better UX

#### Success Criteria:
- Real speech recognition working locally
- Cloud provider functional with API key
- Audio pipeline handles real microphone input
- All tests passing with real implementations

---

### Phase 3: Claude Code Integration 🔮 PLANNED
**Status**: 🔮 Planned  
**Target**: Connect to Claude Code for intelligent interview questions

#### Tasks:
- 🔮 **Claude Code Bridge Service**
  - Implement subprocess management for Claude Code
  - Create bidirectional communication protocol
  - Handle Claude Code lifecycle (start, stop, restart)
  - Parse Claude responses for interview context
  
- 🔮 **Interview Engine Enhancement**
  - Replace mock questions with Claude-generated content
  - Implement interview session state management
  - Add context-aware follow-up questions
  - Create interview templates (technical, behavioral, system design)

#### Success Criteria:
- Claude Code process managed reliably
- Dynamic question generation based on user responses
- Interview sessions feel natural and intelligent
- Performance tracking and feedback system

---

### Phase 4: Advanced Features 🔮 PLANNED  
**Status**: 🔮 Future  
**Target**: Polish and advanced functionality

#### Tasks:
- 🔮 **Session Management**
  - Record and replay interview sessions
  - Export transcripts and performance metrics
  - Multi-language support
  
- 🔮 **Enhanced Audio**
  - Noise reduction and audio enhancement
  - Voice activity detection
  - Multiple microphone support
  
- 🔮 **Interview Analytics**
  - Speaking pace analysis
  - Confidence scoring
  - Technical keyword detection
  - Performance trends over time

#### Success Criteria:
- Production-ready application
- Professional interview experience
- Comprehensive analytics and insights

---

## Current Status Summary
- **Overall Progress**: 25% (Foundation complete)
- **Active Phase**: Phase 2 - Core Speech Integration
- **Next Milestone**: Working Python backend service
- **Estimated Time to MVP**: Phase 2 completion (2-3 development sessions)

## Technical Priorities
1. **Immediate**: Python backend service implementation
2. **Short-term**: Real audio pipeline integration
3. **Medium-term**: Claude Code subprocess management
4. **Long-term**: Advanced analytics and session management

## Quality Standards
- **TDD Compliance**: 100% - All features must be test-driven
- **Test Coverage**: Target 90%+ for all components  
- **Code Quality**: Follow KISS, DRY, SOLID principles
- **Documentation**: Keep activecontext.md updated after each session