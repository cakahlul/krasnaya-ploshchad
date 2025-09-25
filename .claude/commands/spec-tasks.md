# Spec Tasks Command

Generate implementation task list based on approved design with MANDATORY Test-Driven Development.

## Usage
```
/spec-tasks [feature-name]
```

## Phase Overview
**Your Role**: Break design into executable TDD implementation tasks

This is Phase 3 of the spec workflow. Your goal is to create a detailed task breakdown that will guide the implementation of the feature using **MANDATORY Test-Driven Development (TDD)**. All tasks must include the five required TDD fields and will be automatically validated for compliance. Generated task commands will use TDD workflow templates with RED-GREEN-REFACTOR-VERIFY phases.

## Instructions
You are working on the tasks phase of the spec workflow.

**WORKFLOW**: This is the FINAL step before command generation.
**SEQUENCE**: Create Tasks → Get Approval → Ask User → Generate Commands
**DO NOT** run task command generation until tasks are approved.

1. **Prerequisites**
   - Ensure design.md exists and is approved in `.claude/specs/{feature-name}/`
   - Load both documents from the spec directory:
     - Load `.claude/specs/{feature-name}/requirements.md` for feature context
     - Load `.claude/specs/{feature-name}/design.md` for technical design
   - **Load steering documents** (if available):
     - Check for .claude/steering/structure.md for project conventions
     - Check for .claude/steering/tech.md for technical patterns
   - Understand the complete feature scope

2. **Process**
   1. Convert design into atomic, executable TDD coding tasks
   2. Ensure each task:
      - Has a clear, actionable objective
      - **INCLUDES ALL MANDATORY TDD FIELDS**: Test Specs, Test Location, Test Cases, Acceptance, Implementation
      - References specific requirements using _Requirements: X.Y_ format
      - Builds incrementally on previous tasks
      - Focuses on coding activities with test-first approach
      - Follows RED-GREEN-REFACTOR-VERIFY TDD workflow
   3. Use checkbox format with hierarchical numbering
   4. Present complete task list with TDD structure
   5. Ask: "Do the tasks look good?"
   6. **CRITICAL**: Wait for explicit approval before proceeding
   7. **TDD VALIDATION**: All tasks will be automatically validated for TDD compliance - missing TDD fields will cause errors
   8. **AFTER APPROVAL**: Ask "Would you like me to generate individual task commands for easier execution? (yes/no)"
   9. **IF YES**: Execute `uvx --from git+https://bitbucket.org/tunaiku/spec-workflow.git spec-driven-workflow generate-task-commands {feature-name}`
   10. **IF NO**: Continue with traditional `/spec-execute` approach
   11. **IMPORTANT**: Generated task commands will use TDD workflow templates with RED-GREEN-REFACTOR phases

3. **Generate Task List** (prioritize code reuse and follow conventions)
   - Break design into atomic, executable coding tasks
   - **Follow structure.md**: Ensure tasks respect project file organization
   - **Prioritize extending/adapting existing code** over building from scratch
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements AND existing code to leverage
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

4. **Task Guidelines**
   - Tasks should be concrete and actionable
   - **MANDATORY TDD COMPLIANCE**: Every task must include all five TDD fields (Test Specs, Test Location, Test Cases, Acceptance, Implementation)
   - **Test-First Approach**: Always design tests before implementation - follow RED-GREEN-REFACTOR-VERIFY cycle
   - **Reference existing code to reuse**: Include specific files/components to extend or adapt
   - Include specific file names and components  
   - Build incrementally (each task builds on previous)
   - Reference requirements using _Requirements: X.Y_ format
   - **TDD Workflow Integration**: Tasks will be validated for TDD compliance and use TDD command templates
   - **Unit Testing Focus**: Each task should represent a testable unit following the "smallest deliverable piece" principle

### Task Format
Use this exact TDD format for all tasks (all TDD fields are MANDATORY):

```markdown
- [ ] 1. Task description
  - **Test Specs**: What the tests should validate for this task
  - **Test Location**: `tests/test_module.py`
  - **Test Cases**:
    - Test successful scenario with valid inputs
    - Test error handling with invalid inputs
    - Test edge cases and boundary conditions
  - **Acceptance**: Clear criteria for when all tests pass and task is complete
  - **Implementation**: Brief approach for implementing to make tests pass
  - Detailed implementation steps and files to create/modify
  - _Requirements: 1.1, 2.3_
  - _Leverage: existing-component.ts, utils/helpers.js_

- [ ] 2. Another task description
  - **Test Specs**: What needs to be validated for task 2
  - **Test Location**: `tests/test_another_module.py`
  - **Test Cases**:
    - Test primary functionality
    - Test integration with task 1 components
  - **Acceptance**: All tests pass with expected behavior
  - **Implementation**: Use TDD approach - write tests first, then implement
  - Implementation details for this task
  - _Requirements: 2.1_

- [ ] 2.1 Subtask description
  - **Test Specs**: Specific validation requirements for subtask
  - **Test Location**: `tests/test_another_module.py`
  - **Test Cases**:
    - Test subtask specific behavior
  - **Acceptance**: Subtask tests pass and integrate with parent task
  - **Implementation**: Follow RED-GREEN-REFACTOR cycle
  - Subtask implementation details
  - _Requirements: 2.1_
  - _Leverage: shared/component.ts_
```

**CRITICAL TDD Format Rules:**
- Start with `- [ ]` (dash, space, left bracket, space, right bracket, space)  
- Follow with task number and period: `1.` or `2.1`
- Add task description after the period and space
- **MANDATORY TDD Fields** (must be included for every task):
  - **Test Specs**: What the tests should validate
  - **Test Location**: Path to test file (e.g., `tests/test_module.py`)
  - **Test Cases**: List of specific test scenarios
  - **Acceptance**: Clear completion criteria
  - **Implementation**: Approach and hints for implementation
- Include indented implementation details with `- ` prefix
- Add metadata lines with `_Requirements:` and `_Leverage:` as needed
- **All tasks will be validated for TDD compliance** - missing TDD fields will cause errors

### Excluded Task Types
- User acceptance testing
- Production deployment
- Performance metrics gathering
- User training or documentation
- Business process changes

5. **Approval Process**
   - Present the complete task list
   - Ask: "Do the tasks look good?"
   - Make revisions based on feedback
   - Continue until explicit approval
   - **CRITICAL**: Do not proceed without explicit approval

6. **Critical Task Command Generation Rules**

**Use UVX Command for Task Generation**: Task commands are now generated using the package's CLI command.
- **COMMAND**: `uvx --from git+https://bitbucket.org/tunaiku/spec-workflow.git spec-driven-workflow generate-task-commands {spec-name}`
- **TIMING**: Only run after tasks.md is approved AND user confirms they want task commands
- **USER CHOICE**: Always ask the user if they want task commands generated (yes/no)
- **CROSS-PLATFORM**: Works automatically on Windows, macOS, and Linux

### Generate Task Commands (ONLY after tasks approval)
- **WAIT**: Do not run command generation until user explicitly approves tasks
- **ASK USER**: "Would you like me to generate individual task commands for easier execution? (yes/no)"
- **IF YES**: Execute `uvx --from git+https://bitbucket.org/tunaiku/spec-workflow.git spec-driven-workflow generate-task-commands {feature-name}`
- **IF NO**: Continue with traditional `/spec-execute` approach
- **PURPOSE**: Creates individual task commands in `.claude/commands/{feature-name}/`
- **RESULT**: Each task gets its own command: `/{feature-name}:task-{task-id}`
- **EXAMPLE**: Creates `/{feature-name}:task-1`, `/{feature-name}:task-2.1`, etc.
- **RESTART REQUIRED**: Inform user to restart Claude Code for new commands to be visible

## Task Structure Example
```markdown
# Implementation Plan

## Task Overview
[Brief description of the implementation approach]

## Steering Document Compliance
[How tasks follow structure.md conventions and tech.md patterns]

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - **Test Specs**: Validate that directory structure and interfaces are created correctly
  - **Test Location**: `tests/test_project_setup.py`
  - **Test Cases**:
    - Test directory structure matches expected layout
    - Test core interfaces can be imported without errors
    - Test configuration files are valid and parseable
    - Test base classes can be extended properly
  - **Acceptance**: All setup tests pass, directory structure follows conventions, interfaces are properly defined
  - **Implementation**: Create directories using existing patterns, extend base classes rather than rebuilding
  - Create directory structure following existing patterns
  - Define core interfaces extending existing base classes
  - Set up basic configuration
  - _Leverage: src/types/base.ts, src/models/BaseModel.ts_
  - _Requirements: 1.1_

- [ ] 2. Implement data models and validation
  - **Test Specs**: Validate data model creation and validation logic
  - **Test Location**: `tests/test_data_models.py`
  - **Test Cases**:
    - Test model instantiation with valid data
    - Test validation rejects invalid data
    - Test model serialization/deserialization
  - **Acceptance**: All data model tests pass with comprehensive validation coverage
  - **Implementation**: Follow TDD approach - write tests first, then implement models

- [ ] 2.1 Create base model classes
  - **Test Specs**: Ensure base model functionality works correctly for inheritance
  - **Test Location**: `tests/test_base_models.py`
  - **Test Cases**:
    - Test base model common methods (save, validate, serialize)
    - Test inheritance patterns work correctly
    - Test validation framework integration
  - **Acceptance**: Base model tests pass, ready for concrete implementations
  - **Implementation**: Use RED-GREEN-REFACTOR cycle, extend existing validation patterns
  - Define data structures/schemas
  - Implement validation methods
  - Write comprehensive unit tests for models
  - _Leverage: src/utils/validation.ts, tests/helpers/testUtils.ts_
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Implement specific model classes
  - **Test Specs**: Validate specific model implementations and their relationships
  - **Test Location**: `tests/test_specific_models.py`
  - **Test Cases**:
    - Test concrete model implementations
    - Test model relationship handling (one-to-many, many-to-many)
    - Test model interaction patterns
    - Test integration with base model functionality
  - **Acceptance**: All specific model tests pass, relationships work correctly, integrates with base models
  - **Implementation**: Follow TDD workflow, implement minimal code to make tests pass, then refactor
  - Create concrete model implementations
  - Add relationship handling
  - Test model interactions thoroughly
  - _Requirements: 2.3_
```

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval and command generation:
1. **RESTART Claude Code** for new commands to be visible
2. Then you can:
   - Use `/spec-execute` to implement tasks
   - Use individual task commands: `/{feature-name}:task-1`, `/{feature-name}:task-2`, etc.
   - Check progress with `/spec-status {feature-name}`
