# Code Review Agent - Extended Features

## New Tools Added

### 1. **generateCommitMessageTool**
Analyzes git changes and generates conventional commit messages.

**Parameters:**
- `rootDir`: Path to the git repository
- `type` (optional): Commit type (feat, fix, docs, style, refactor, perf, test, chore)

**Example usage:**
```typescript
// The agent can now generate commit messages like:
// "feat(tools): add commit message generation functionality"
// "fix: resolve TypeScript compilation errors" 
// "docs: update README with new tools information"
```

### 2. **writeReviewToMarkdownTool** 
Saves code reviews to markdown files with proper formatting.

**Parameters:**
- `filePath`: Where to save the markdown file
- `reviewContent`: The review content to write
- `title` (optional): Title for the document
- `includeTimestamp` (optional): Whether to include timestamp (default: true)

**Example usage:**
```typescript
// Saves reviews to files like:
// "./reviews/code-review-2025-09-20.md"
// "./output/feature-review.md"
```

## How the Agent Uses These Tools

1. **Automatic Analysis**: The agent first uses `getFileChangesInDirectoryTool` to analyze changes
2. **Review Generation**: Provides detailed code review feedback
3. **Commit Suggestions**: Uses `generateCommitMessageTool` to suggest better commit messages
4. **Documentation**: Offers to save the review using `writeReviewToMarkdownTool`

## Example Workflow

```bash
# Run the agent
bun run index.ts

# The agent will:
# 1. Analyze code changes in the specified directory
# 2. Provide detailed feedback on each changed file
# 3. Suggest improvements and best practices
# 4. Generate appropriate commit messages
# 5. Offer to save the review to a markdown file
```

## Dependencies Added

- `simple-git`: For git operations and diff analysis
- `zod`: For input validation and type safety
- Built-in Node.js `fs/promises` and `path`: For file operations

## Enhanced System Prompt

The system prompt now includes:
- Clear tool descriptions and usage guidelines
- Structured review workflow
- Instructions to offer markdown file saving
- Better integration between all available tools

This makes the Code Review Agent more comprehensive and useful for development teams who want to:
- Generate better commit messages
- Document their code reviews
- Maintain consistent review quality
- Track review history