import { BlogPost } from "../types";
import { OpenRouterService } from "../services/openRouterService";
import { PexelsService } from "../services/pexelsService";
import { BlogPrompts } from "../services/prompts/blogPrompts";
import { ContentProcessor } from "./contentProcessor";
import { BlogValidator } from "./validators/blogValidator";
import { StatsTracker } from "./statsTracker";
import {
  savePostToMarkdown,
  getExistingPostTitles,
  filterDuplicateTitles,
} from "../utils/fileUtils";
import { cleanJsonResponse } from "../utils/jsonUtils";
import { logger } from "../utils/logger";

export class BlogGenerator {
  private openRouterService: OpenRouterService;
  private pexelsService: PexelsService;
  private contentProcessor: ContentProcessor;
  private statsTracker: StatsTracker;

  constructor() {
    this.openRouterService = new OpenRouterService();
    this.pexelsService = new PexelsService();
    this.contentProcessor = new ContentProcessor();
    this.statsTracker = new StatsTracker(
      this.openRouterService,
      this.pexelsService
    );
  }

  async generateBlogIdeas(companyInstruction: string): Promise<string[]> {
    // First, get existing post titles to avoid duplicates
    logger.info("Reading existing post titles to avoid duplicates...");
    const existingTitles = await getExistingPostTitles();

    if (existingTitles.length > 0) {
      logger.info(
        `Found ${existingTitles.length} existing posts to avoid duplicating`
      );

      // Show a preview of existing titles in verbose mode
      if (process.env.VERBOSE === "true" && existingTitles.length > 0) {
        const preview = existingTitles.slice(0, 5);
        logger.debug(
          `Existing titles preview: ${preview.map((t) => `"${t}"`).join(", ")}${
            existingTitles.length > 5
              ? ` (and ${existingTitles.length - 5} more)`
              : ""
          }`
        );
      }
    }

    const prompt = BlogPrompts.buildBlogIdeasPrompt(
      companyInstruction,
      existingTitles
    );
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      throw new Error(`Failed to generate blog ideas: ${response.error}`);
    }

    try {
      const ideas = this.parseBlogIdeasResponse(response.data);

      // Additional client-side filtering as a safety net
      const filteredIdeas = filterDuplicateTitles(ideas, existingTitles);

      logger.info(
        `Generated ${ideas.length} blog ideas, ${filteredIdeas.length} after duplicate filtering.`
      );
      return filteredIdeas;
    } catch (error) {
      throw new Error(`Failed to parse blog ideas: ${error}`);
    }
  }

  async generateBlogPost(
    title: string,
    companyInstruction: string
  ): Promise<BlogPost> {
    return await this.contentProcessor.generateBlogContent(
      title,
      companyInstruction
    );
  }

  async generateAndSavePost(
    title: string,
    companyInstruction: string
  ): Promise<string> {
    try {
      const post = await this.generateBlogPost(title, companyInstruction);

      // Validate that all images are from Pexels before saving
      BlogValidator.validateImageUrls(post);

      const filePath = await savePostToMarkdown(post);
      logger.success(`Saved post to ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to process post: "${title}"`, error);
      throw error;
    }
  }

  async generateAllPosts(
    companyInstruction: string,
    maxPosts?: number
  ): Promise<string[]> {
    const ideas = await this.generateBlogIdeas(companyInstruction);

    logger.info(`Generated ${ideas.length} blog ideas total.`);

    const postsToGenerate = maxPosts ? ideas.slice(0, maxPosts) : ideas;

    if (maxPosts) {
      logger.info(
        `Limiting to ${maxPosts} posts as requested (--max-posts ${maxPosts}).`
      );
    } else {
      logger.info(
        `No limit specified, will attempt to generate all ${ideas.length} posts.`
      );
    }

    const savedFiles: string[] = [];
    const errors: string[] = [];

    logger.info(`Generating ${postsToGenerate.length} blog posts...`);

    for (let i = 0; i < postsToGenerate.length; i++) {
      const title = postsToGenerate[i];

      try {
        this.statsTracker.logProgress(i + 1, postsToGenerate.length, title);

        const filePath = await this.generateAndSavePost(
          title,
          companyInstruction
        );
        savedFiles.push(filePath);

        // Log API usage stats periodically
        if (savedFiles.length % 5 === 0) {
          this.statsTracker.logApiUsageStats();
        }
      } catch (error) {
        const errorMsg = `Failed to generate post "${title}": ${error}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    this.statsTracker.logCompletionStats(savedFiles, errors);
    return savedFiles;
  }

  private parseBlogIdeasResponse(content: string): string[] {
    // Try to extract JSON array first
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const jsonData = cleanJsonResponse(jsonMatch[0]);
        return JSON.parse(jsonData);
      } catch {
        // Continue to fallback parsing
      }
    }

    // Fallback: parse line by line
    return content
      .split("\n")
      .filter(
        (line) =>
          line.trim().length > 0 && (line.includes(".") || line.includes(":"))
      )
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());
  }
}
