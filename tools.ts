import { tool } from "ai";
import { simpleGit } from "simple-git";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";

const excludeFiles = ["dist", "bun.lock"];

const fileChange = z.object({
  rootDir: z.string().min(1).describe("The root directory"),
});

type FileChange = z.infer<typeof fileChange>;

async function getFileChangesInDirectory({ rootDir }: FileChange) {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  const diffs: { file: string; diff: string }[] = [];

  for (const file of summary.files) {
    if (excludeFiles.includes(file.file)) continue;
    const diff = await git.diff(["--", file.file]);
    diffs.push({ file: file.file, diff });
  }

  return diffs;
}

export const getFileChangesInDirectoryTool = tool({
  description: "Gets the code changes made in given directory",
  inputSchema: fileChange,
  execute: getFileChangesInDirectory,
});

// Schema for commit message generation
const commitMessageSchema = z.object({
  rootDir: z.string().min(1).describe("The root directory of the git repository"),
  type: z.enum(["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"]).optional().describe("Type of change (optional, will be auto-detected if not provided)"),
});

type CommitMessageInput = z.infer<typeof commitMessageSchema>;

async function generateCommitMessage({ rootDir, type }: CommitMessageInput) {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  
  if (summary.files.length === 0) {
    return "No changes detected in the repository";
  }

  // Auto-detect commit type based on changes
  let detectedType = type;
  if (!detectedType) {
    const changedFiles = summary.files.map(f => f.file);
    
    if (changedFiles.some(f => f.includes('test') || f.includes('spec'))) {
      detectedType = "test";
    } else if (changedFiles.some(f => f.includes('README') || f.endsWith('.md'))) {
      detectedType = "docs";
    } else if (changedFiles.some(f => f.includes('package.json'))) {
      detectedType = "chore";
    } else if (summary.insertions > summary.deletions) {
      detectedType = "feat";
    } else {
      detectedType = "fix";
    }
  }

  // Get the actual diff for context
  const diffText = await git.diff();
  const filesChanged = summary.files.length;
  const insertions = summary.insertions;
  const deletions = summary.deletions;

  // Generate commit message
  const scope = filesChanged === 1 && summary.files[0] ? summary.files[0].file.split('/')[0] : "";
  const scopeText = scope && summary.files[0] && scope !== summary.files[0].file ? `(${scope})` : "";
  
  let description = "";
  if (detectedType === "feat") {
    description = "add new functionality";
  } else if (detectedType === "fix") {
    description = "resolve issues";
  } else if (detectedType === "docs") {
    description = "update documentation";
  } else if (detectedType === "refactor") {
    description = "improve code structure";
  } else if (detectedType === "test") {
    description = "add/update tests";
  } else if (detectedType === "chore") {
    description = "update dependencies/config";
  } else {
    description = "make changes";
  }

  const commitMessage = `${detectedType}${scopeText}: ${description}

${filesChanged} file(s) changed, ${insertions} insertion(s), ${deletions} deletion(s)`;

  return {
    commitMessage,
    stats: {
      filesChanged,
      insertions,
      deletions,
      type: detectedType
    },
    affectedFiles: summary.files.map(f => f.file)
  };
}

export const generateCommitMessageTool = tool({
  description: "Generates a conventional commit message based on git changes in the directory",
  inputSchema: commitMessageSchema,
  execute: generateCommitMessage,
});

// Schema for writing markdown review
const writeMarkdownSchema = z.object({
  filePath: z.string().min(1).describe("The path where to write the markdown file"),
  reviewContent: z.string().min(1).describe("The code review content to write"),
  title: z.string().optional().describe("Optional title for the review document"),
  includeTimestamp: z.boolean().default(true).describe("Whether to include timestamp in the document"),
});

type WriteMarkdownInput = z.infer<typeof writeMarkdownSchema>;

async function writeReviewToMarkdown({ filePath, reviewContent, title, includeTimestamp }: WriteMarkdownInput) {
  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });

    const timestamp = includeTimestamp ? new Date().toISOString() : null;
    const reviewTitle = title || "Code Review";
    
    let markdownContent = `# ${reviewTitle}\n\n`;
    
    if (timestamp) {
      markdownContent += `**Generated:** ${timestamp}\n\n`;
    }
    
    markdownContent += "---\n\n";
    markdownContent += reviewContent;
    
    // Ensure proper markdown formatting if not already present
    if (!reviewContent.includes('##') && !reviewContent.includes('###')) {
      markdownContent += "\n\n## Summary\n\n";
      markdownContent += "This review was generated automatically. Please review the suggestions and apply them as appropriate.\n";
    }
    
    await writeFile(filePath, markdownContent, 'utf-8');
    
    return {
      success: true,
      filePath,
      message: `Code review successfully written to ${filePath}`,
      size: markdownContent.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      filePath
    };
  }
}

export const writeReviewToMarkdownTool = tool({
  description: "Writes a code review to a markdown file with proper formatting",
  inputSchema: writeMarkdownSchema,
  execute: writeReviewToMarkdown,
});