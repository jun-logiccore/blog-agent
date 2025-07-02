import { BlogPost, InlineImage } from "../types";
import { OpenRouterService } from "../services/openRouterService";
import { PexelsService } from "../services/pexelsService";
import {
  savePostToMarkdown,
  getExistingPostTitles,
  filterDuplicateTitles,
} from "../utils/fileUtils";
import {
  validateAndCleanContent,
  hasInvalidImageContent,
} from "../utils/stringUtils";
import { logger } from "../utils/logger";

export class BlogGenerator {
  private openRouterService: OpenRouterService;
  private pexelsService: PexelsService;

  constructor() {
    this.openRouterService = new OpenRouterService();
    this.pexelsService = new PexelsService();
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

    const response = await this.openRouterService.generateBlogIdeas(
      companyInstruction,
      existingTitles
    );

    if (!response.success || !response.data) {
      throw new Error(`Failed to generate blog ideas: ${response.error}`);
    }

    // Additional client-side filtering as a safety net
    const filteredIdeas = filterDuplicateTitles(response.data, existingTitles);

    logger.info(
      `Generated ${response.data.length} blog ideas, ${filteredIdeas.length} after duplicate filtering.`
    );
    return filteredIdeas;
  }

  async generateBlogPost(
    title: string,
    companyInstruction: string
  ): Promise<BlogPost> {
    logger.info(`Generating content for: "${title}"`);

    // Generate content and metadata in parallel first
    const [contentResponse, metadataResponse] = await Promise.all([
      this.openRouterService.generateBlogPostContent(title, companyInstruction),
      this.openRouterService.generateBlogMetadata(title, companyInstruction),
    ]);

    if (!contentResponse.success || !contentResponse.data) {
      throw new Error(
        `Failed to generate content for "${title}": ${contentResponse.error}`
      );
    }

    // Validate and clean the generated content to remove any image references
    let cleanedContent = validateAndCleanContent(contentResponse.data);

    // Double-check that no invalid image content remains
    if (hasInvalidImageContent(cleanedContent)) {
      logger.warn(
        `Generated content for "${title}" contained invalid image references, cleaning...`
      );
      cleanedContent = validateAndCleanContent(cleanedContent);

      // If it still has invalid content after cleaning, regenerate
      if (hasInvalidImageContent(cleanedContent)) {
        logger.error(
          `Unable to clean invalid image content from "${title}", skipping post`
        );
        throw new Error(
          `Generated content contains invalid image references that cannot be cleaned`
        );
      }
    }

    // Try to find cover image - if it fails, we'll skip this post
    const coverImageResponse = await this.pexelsService.findCoverImage(title);
    if (!coverImageResponse.success || !coverImageResponse.data) {
      logger.warn(
        `No valid cover image found for "${title}", skipping this post`
      );
      throw new Error(`No valid Pexels cover image available for "${title}"`);
    }

    // Generate image queries and find inline images (optional)
    let inlineImages: InlineImage[] = [];
    try {
      const imageQueriesResponse =
        await this.openRouterService.generateImageQueries(
          title,
          cleanedContent
        );

      if (imageQueriesResponse.success && imageQueriesResponse.data) {
        const inlineImagesResponse = await this.pexelsService.findInlineImages(
          imageQueriesResponse.data,
          1 // 1 image per query
        );

        if (inlineImagesResponse.success && inlineImagesResponse.data) {
          inlineImages = inlineImagesResponse.data;
          logger.info(
            `Found ${inlineImages.length} valid inline images for "${title}"`
          );
        } else {
          logger.info(
            `No inline images found for "${title}", continuing without them`
          );
        }
      }
    } catch (error) {
      logger.warn(`Failed to find inline images for "${title}": ${error}`);
      // Continue without inline images - this is not a fatal error
    }

    // Use metadata or fallback to defaults
    const metadata =
      metadataResponse.success && metadataResponse.data
        ? metadataResponse.data
        : { tags: ["blog"], category: "general" };

    const blogPost: BlogPost = {
      title,
      content: cleanedContent,
      coverImageUrl: coverImageResponse.data,
      tags: metadata.tags,
      category: metadata.category,
      date: this.generateCurrentDate(),
      inlineImages,
    };

    // Final validation before returning
    this.validateBlogPost(blogPost);

    return blogPost;
  }

  async generateAndSavePost(
    title: string,
    companyInstruction: string
  ): Promise<string> {
    try {
      const post = await this.generateBlogPost(title, companyInstruction);

      // Validate that all images are from Pexels before saving
      this.validateImageUrls(post);

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

    for (const title of postsToGenerate) {
      try {
        const filePath = await this.generateAndSavePost(
          title,
          companyInstruction
        );
        savedFiles.push(filePath);

        // Log API usage stats periodically
        if (savedFiles.length % 5 === 0) {
          this.logApiUsageStats();
        }
      } catch (error) {
        const errorMsg = `Failed to generate post "${title}": ${error}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.success(`Successfully generated ${savedFiles.length} posts.`);
    if (errors.length > 0) {
      logger.warn(
        `Failed to generate ${errors.length} posts (likely due to no valid Pexels images found or content validation issues).`
      );
    }

    // Log final API usage stats
    this.logApiUsageStats();

    return savedFiles;
  }

  private validateBlogPost(post: BlogPost): void {
    // Validate that content doesn't contain any image references
    if (hasInvalidImageContent(post.content)) {
      throw new Error("Blog post content contains invalid image references");
    }

    // Validate that only the designated image fields contain Pexels URLs
    if (!post.coverImageUrl.includes("pexels.com")) {
      throw new Error("Cover image must be from Pexels");
    }

    if (post.inlineImages) {
      for (const image of post.inlineImages) {
        if (
          !image.url.includes("pexels.com") ||
          !image.pexelsUrl.includes("pexels.com")
        ) {
          throw new Error("All inline images must be from Pexels");
        }
      }
    }

    logger.debug(`Blog post validation passed for: "${post.title}"`);
  }

  private validateImageUrls(post: BlogPost): void {
    // Validate cover image
    if (
      !post.coverImageUrl.includes("pexels.com") ||
      !post.coverImageUrl.startsWith("https://")
    ) {
      throw new Error("Invalid cover image URL - must be from Pexels");
    }

    // Validate inline images
    if (post.inlineImages) {
      for (const image of post.inlineImages) {
        if (
          !image.url.includes("pexels.com") ||
          !image.url.startsWith("https://")
        ) {
          throw new Error("Invalid inline image URL - must be from Pexels");
        }
        if (
          !image.pexelsUrl.includes("pexels.com") ||
          !image.pexelsUrl.startsWith("https://")
        ) {
          throw new Error("Invalid Pexels attribution URL");
        }
      }
    }

    logger.debug(`All image URLs validated for post: "${post.title}"`);
  }

  private generateCurrentDate(): string {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  private logApiUsageStats(): void {
    const openRouterStats = this.openRouterService.getRequestStats();
    const pexelsStats = this.pexelsService.getRequestStats();

    logger.info(
      `API Usage - OpenRouter: ${openRouterStats.count} requests, Pexels: ${pexelsStats.count} requests`
    );

    if (openRouterStats.lastRequestTime > 0) {
      const timeSinceLastOpenRouter =
        Date.now() - openRouterStats.lastRequestTime;
      logger.debug(
        `Time since last OpenRouter request: ${timeSinceLastOpenRouter}ms`
      );
    }

    if (pexelsStats.lastRequestTime > 0) {
      const timeSinceLastPexels = Date.now() - pexelsStats.lastRequestTime;
      logger.debug(`Time since last Pexels request: ${timeSinceLastPexels}ms`);
    }
  }
}
