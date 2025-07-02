import { BlogGenerator } from "./generators/blogGenerator";
import { parseCliArguments, displayUsage } from "./utils/cliUtils";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const options = parseCliArguments();

    // Set verbose logging if requested
    if (options.verbose) {
      process.env.VERBOSE = "true";
    }

    logger.info("Starting blog post generation agent...");
    logger.info(`Generating blog posts for: ${options.companyInstruction}`);

    if (options.maxPosts) {
      logger.info(`Maximum posts limit: ${options.maxPosts}`);
    } else {
      logger.info(`No maximum posts limit specified`);
    }

    // Initialize blog generator
    const generator = new BlogGenerator();

    // Generate all posts
    const savedFiles = await generator.generateAllPosts(
      options.companyInstruction,
      options.maxPosts
    );

    logger.success(
      `Blog post generation complete. Generated ${savedFiles.length} posts.`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Company instruction is required")
    ) {
      displayUsage();
    } else {
      logger.error("An error occurred:", error);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  process.exit(1);
});

main();
