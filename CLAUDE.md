# CLAUDE Code Guidelines for Claude Voice Interview Simulator

## Project Context
**Claude Voice Interview Simulator**: A voice-enabled wrapper around Claude Code that enables interactive interview practice sessions. Users can conduct mock technical interviews using speech input/output, with Claude Code providing intelligent questioning and feedback.

## Required Reading on Startup
- **ALWAYS** read `activecontext.md` first to understand current project state
- **ALWAYS** read `masterplan.md` to understand phased plan and progress
- Use these files to maintain context between conversations

## Programming Best Practices

### Core Principles
- **TDD (Test Driven Development)** - **MANDATORY UNBREAKABLE RULE**: Write tests FIRST, then implement code to pass them. All code must be driven by tests.
- **Functional Tests Only** - Tests must verify actual functionality, not just pass artificially. No fake implementations that pass tests without real functionality.
- **KISS (Keep It Simple, Stupid)** - Always choose the simplest solution that works
- **DRY (Don't Repeat Yourself)** - Abstract common functionality into reusable components
- **YAGNI (You Aren't Gonna Need It)** - Don't build features until they're actually needed
- **Single Responsibility Principle** - Each function/class should have one clear purpose
- **Fail Fast** - Validate inputs early and provide clear error messages

### Code Quality Standards
- Write self-documenting code with clear variable and function names
- Keep functions small and focused (ideally under 20 lines)
- Use consistent naming conventions throughout the project
- Prefer composition over inheritance
- Handle errors gracefully with proper error boundaries

## Testing Framework Requirements

### Mandatory TDD Protocol - UNBREAKABLE RULES
- **ALWAYS WRITE TESTS FIRST** - No exceptions. Tests must be written before any implementation code.
- **RED-GREEN-REFACTOR** - Follow the TDD cycle strictly: Write failing test (RED), implement minimal code to pass (GREEN), then refactor.
- **FUNCTIONAL TESTS ONLY** - Tests must verify real functionality. No mock implementations that pass tests without actual working code.
- **EVERY feature MUST include corresponding tests WRITTEN FIRST**
- Run tests frequently during development to catch regressions early
- Maintain high test coverage (aim for 90%+ coverage)

### Project-Specific Testing
- **Voice Interface**: Test speech recognition accuracy, TTS functionality, audio device handling
- **Claude Code Integration**: Test subprocess communication, prompt handling, response parsing
- **Interview Controller**: Test session management, command processing, state transitions
- **Cross-Platform Audio**: Test audio functionality on different operating systems

### TDD Framework Implementation
- Implement automated testing pipeline for Python components
- Include unit tests, integration tests, and end-to-end tests as appropriate
- Tests should be fast, reliable, and independent of each other
- Use meaningful test descriptions that explain the expected behavior
- **CRITICAL**: Never write code that passes tests artificially - tests must verify real functionality

## Version Control & Documentation

### Git Workflow
- Use GitHub for version control and collaboration
- **MANDATORY**: All file edits must include descriptive git commits
- Commit messages should follow conventional commit format:
  - `feat: add new feature description`
  - `fix: resolve specific bug description`
  - `refactor: improve code structure description`
  - `test: add tests for feature description`
  - `docs: update documentation description`

### Mandatory Update Protocol (MUP)
The MUP must be executed:
1. **Automatically** when completing large milestones
2. **On request** when explicitly asked

#### MUP Steps:
1. Update `activecontext.md` with current project state
2. Update `masterplan.md` with progress and next steps
3. Commit all changes to git with descriptive messages
4. Sync with remote repository if applicable

## Project Context Management

### activecontext.md
- Maintains current conversation context
- Records what was accomplished in recent sessions
- Lists immediate next steps and blockers
- Updated after each significant work session

### masterplan.md
- Contains the overall project roadmap
- Tracks progress through defined phases
- Maintains high-level todo items and milestones
- Shows completed, in-progress, and pending phases

## Directory Organization Requirements

### Mandatory Directory Structure
The project MUST maintain the following organized directory structure:

```
claude-voice-interview/
├── src/
│   ├── voice_interface/   # Speech recognition and TTS components
│   ├── claude_bridge/     # Claude Code subprocess communication
│   ├── interview_controller/ # Interview session management
│   └── utils/             # Common utilities and constants
├── docs/                  # Project documentation and research notes
├── tests/                 # Test suites (unit, integration, e2e) - WRITTEN FIRST
├── tools/                 # Build tools, scripts, utilities
├── activecontext.md       # Current conversation context
├── masterplan.md          # Project roadmap and progress
└── CLAUDE.md              # This guidelines file
```

### Directory Usage Guidelines
- **src/**: All production code organized by component (voice_interface/claude_bridge/interview_controller/utils)
- **docs/**: Technical documentation, API specs, architecture notes
- **tests/**: Comprehensive test coverage for all src/ components - MUST BE WRITTEN FIRST
- **tools/**: Development utilities, build scripts, deployment tools

**MANDATORY**: Always maintain this structure. Create subdirectories as needed but preserve the main organization.

## Development Workflow - TDD MANDATORY

1. **Start**: Read activecontext.md and masterplan.md
2. **Plan**: Use TodoWrite tool for complex tasks
3. **TEST FIRST**: Write failing tests BEFORE any implementation (RED phase)
4. **Implement**: Write minimal code to pass tests (GREEN phase)
5. **Refactor**: Improve code while keeping tests passing (REFACTOR phase)
6. **Test**: Run full test suite after each feature
7. **Commit**: Make descriptive git commits
8. **Update**: Execute MUP for milestones or on request

**CRITICAL**: Never skip step 3. All code must be test-driven.

## Quality Assurance
- Run linting and type checking before commits
- Ensure all tests pass before considering work complete
- Review code for adherence to KISS and other principles
- Validate that new features align with masterplan objectives

---

**Remember**: This project prioritizes quality over speed. Take time to implement features correctly with proper testing and documentation.