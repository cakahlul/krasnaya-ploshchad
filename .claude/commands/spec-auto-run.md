# Spec Auto Run Command

Execute all tasks for a specification automatically without manual intervention.

## Usage
```
/spec-auto-run <spec-name> [options]
```

## Instructions

You are running automated task execution for a specification.

1. **Prerequisites** 
   - Validate spec-name parameter provided
   - Verify `.claude/specs/{spec-name}/` directory exists
   - Ensure `tasks.md` file exists with task definitions
   - **Load steering documents** (if available):
     - Load .claude/steering/product.md for product context
     - Load .claude/steering/tech.md for technical patterns
     - Load .claude/steering/structure.md for project conventions

2. **Process**
   1. Load spec documents for context validation:
      - Load `.claude/specs/{spec-name}/requirements.md` for feature requirements
      - Load `.claude/specs/{spec-name}/design.md` for technical design
      - Load `.claude/specs/{spec-name}/tasks.md` for the complete task list
   2. Execute: `uvx --from git+https://bitbucket.org/tunaiku/spec-workflow.git spec-driven-workflow auto-run-tasks {spec-name}`
   3. Monitor execution progress and provide feedback
   4. Report completion status and task results

3. **Error Handling**
   - If spec directory doesn't exist: Display error and suggest using `/spec-create`
   - If tasks.md is missing: Display error and suggest using `/spec-tasks`
   - If uvx command fails: Display error details and suggest troubleshooting steps
   - Provide helpful guidance for common issues

4. **Completion**
   - Report summary of executed tasks
   - Show any failed tasks with details
   - Suggest next steps for verification or testing
   - Reference `/spec-status {spec-name}` for ongoing progress tracking

## Overview

The auto-run command provides automated sequential execution of all generated task commands for a specification, eliminating the need for manual execution of individual `/spec-name:task-N` commands. This streamlines the implementation phase by automatically executing tasks in the correct hierarchical order.

## Options

- `--mode automatic|interactive`: Execution mode (default: automatic)
- `--tasks <selection>`: Task selection ("all", "1-3", "2,4,6", etc.)
- `--continue-on-error`: Continue execution after task failures
- `--resume-from <task-id>`: Resume from specific task ID
- `--show-progress`: Show detailed progress information (default: true)

## Features

### Automated Task Execution
- **Sequential Processing**: Executes tasks in hierarchical order (1, 2, 2.1, 2.2, 3, etc.)
- **Progress Monitoring**: Real-time progress display with task descriptions and completion status
- **Error Handling**: Comprehensive error reporting with recovery options

### Execution Control
- **Selective Execution**: Choose specific tasks or ranges to execute
- **Interactive Mode**: Prompt for confirmation before each task
- **Resume Capability**: Continue from interrupted execution point
- **Failure Recovery**: Options to retry, skip, or abort on task failures

### Integration
- **Spec Context Loading**: Automatically loads requirements, design, and steering documents
- **Task Validation**: Ensures all required documents exist before execution
- **Completion Tracking**: Updates tasks.md with completion status

## Prerequisites

Before using auto-run, ensure:

1. **Spec exists**: `.claude/specs/{spec-name}/` directory with required files
2. **Tasks defined**: `tasks.md` file with task breakdown
3. **Documents available**: `requirements.md` and `design.md` exist
4. **Steering documents**: Optional but recommended for context

## Process

The auto-run command follows this sequence:

1. **Validation Phase**
   - Verify spec directory and required files exist
   - Load specification documents for context
   - Parse task list from tasks.md
   - Validate task hierarchy and dependencies

2. **Preparation Phase**
   - Load steering documents (product.md, tech.md, structure.md)
   - Initialize progress tracking and reporting
   - Set up execution environment

3. **Execution Phase**
   - Execute tasks sequentially in hierarchical order
   - Update progress display with real-time status
   - Mark completed tasks in tasks.md
   - Handle errors according to execution mode

4. **Completion Phase**
   - Generate execution summary with statistics
   - Report successful and failed tasks
   - Provide next steps recommendations

## Task Selection

### Selection Formats
- `"all"` or `"*"`: Execute all pending tasks
- `"1-3"`: Execute tasks 1, 2, and 3
- `"2,4,6"`: Execute specific tasks 2, 4, and 6
- `"2.1-2.3"`: Execute subtasks 2.1, 2.2, and 2.3
- `"1,3-5"`: Combine individual and range selections

### Task Ordering
Tasks are executed in hierarchical order regardless of selection:
- Parent tasks before subtasks (2 before 2.1)
- Sequential numbering (1, 2, 3, not 1, 3, 2)
- Subtask ordering (2.1, 2.2, 2.3)

## Execution Modes

### Automatic Mode (Default)
- Executes all selected tasks without interruption
- Stops only on errors (unless continue-on-error is set)
- Provides continuous progress feedback
- Best for unattended execution

### Interactive Mode
- Prompts for confirmation before each task
- Shows task details and requirements
- Allows skipping individual tasks
- Provides granular control over execution

## Error Handling

### Error Types
- **Task Execution Failures**: Implementation errors, test failures, validation issues
- **Document Missing**: Required spec files or steering documents not found
- **Parsing Errors**: Invalid tasks.md format or task definitions
- **System Errors**: File system issues, permission problems

### Recovery Options
- **Retry**: Attempt the failed task again
- **Skip**: Mark task as skipped and continue
- **Abort**: Stop execution and report status
- **Continue**: Proceed despite errors (with --continue-on-error)

## Examples

### Basic Usage
```bash
# Execute all tasks for user-authentication spec
/spec-auto-run user-authentication

# Execute specific tasks interactively
/spec-auto-run user-authentication --mode interactive --tasks "1-3"

# Resume from interrupted execution
/spec-auto-run user-authentication --resume-from "2.2"

# Continue despite errors
/spec-auto-run user-authentication --continue-on-error
```

### Advanced Usage
```bash
# Execute only implementation tasks
/spec-auto-run api-integration --tasks "2-4" --mode automatic

# Interactive execution with detailed progress
/spec-auto-run data-export --mode interactive --show-progress

# Resume from specific point with error handling
/spec-auto-run notification-system --resume-from "3.1" --continue-on-error
```

## Best Practices

### Before Auto-Run
1. **Complete Prerequisites**: Ensure all spec phases (requirements, design, tasks) are approved
2. **Review Tasks**: Verify task breakdown is accurate and complete
3. **Check Dependencies**: Ensure all required external dependencies are available
4. **Backup Work**: Commit any in-progress work before starting

### During Execution
1. **Monitor Progress**: Watch for task failures or unexpected behavior
2. **Review Changes**: Verify task implementations align with requirements
3. **Test Incrementally**: Run tests after critical tasks if available
4. **Document Issues**: Note any problems for follow-up

### After Completion
1. **Verify Implementation**: Ensure all requirements are satisfied
2. **Run Tests**: Execute full test suite if available
3. **Review Code Quality**: Check adherence to coding standards
4. **Update Documentation**: Reflect any changes or learnings

## Integration with Workflow

Auto-run integrates seamlessly with the existing spec workflow:

1. **After Tasks Phase**: Use auto-run instead of generating individual task commands
2. **Progress Tracking**: Completion status integrates with `/spec-status`
3. **Command Compatibility**: Can still use individual task commands if needed
4. **Workflow Continuation**: Natural progression from spec creation to implementation

## Troubleshooting

### Common Issues
- **Spec Not Found**: Verify spec directory exists in `.claude/specs/`
- **Tasks Missing**: Ensure tasks.md file exists and contains valid task definitions
- **Permission Errors**: Check file system permissions for reading/writing files
- **Invalid Task Selection**: Verify task IDs exist in tasks.md

### Getting Help
- Use `/spec-status {spec-name}` to check current spec state
- Review tasks.md for correct task numbering and format
- Check steering documents for project-specific requirements
- Use interactive mode for more control over execution

## Next Steps

After successful auto-run completion:
- Review implementation against requirements
- Run comprehensive tests
- Update documentation
- Consider deployment or integration steps
- Plan next feature development

Auto-run transforms the implementation phase from manual task-by-task execution to streamlined automated processing, significantly reducing development overhead while maintaining quality and traceability.
