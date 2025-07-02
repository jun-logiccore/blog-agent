export interface CliOptions {
  companyInstruction: string;
  maxPosts?: number;
  verbose?: boolean;
}

export function parseCliArguments(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    throw new Error(
      "Company instruction is required as a command-line argument."
    );
  }

  const companyInstruction = args[0];

  // Parse optional arguments
  const maxPostsIndex = args.findIndex(
    (arg) => arg === "--max-posts" || arg === "-m"
  );
  const maxPosts =
    maxPostsIndex !== -1 && args[maxPostsIndex + 1]
      ? parseInt(args[maxPostsIndex + 1], 10)
      : undefined;

  const verbose = args.includes("--verbose") || args.includes("-v");

  if (maxPosts !== undefined && (isNaN(maxPosts) || maxPosts <= 0)) {
    throw new Error("--max-posts must be a positive number.");
  }

  return {
    companyInstruction,
    maxPosts,
    verbose,
  };
}

export function displayUsage(): void {
  console.log(`
Blog Post Generation Agent

Usage: npm start "<company instruction>" [-- options]
   or: node dist/index.js "<company instruction>" [options]

Arguments:
  company instruction    Description of the company for blog generation

Options:
  --max-posts, -m <number>  Maximum number of posts to generate (default: all)
  --verbose, -v             Enable verbose logging

Examples:
  npm start "a company that sells eco-friendly water bottles"
  npm start "a tech startup focused on AI solutions" -- --max-posts 10
  npm start "a fitness company" -- -m 5 -v
  
  # Or using the compiled version directly:
  node dist/index.js "a tech startup" --max-posts 10 --verbose
  
Note: When using 'npm start', you must use '--' before the options to pass them through npm.
`);
}
