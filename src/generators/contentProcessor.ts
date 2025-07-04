import {
  BlogPost,
  InlineImage,
  BlogMetadata,
  BlogOutline,
  BlogSection,
} from "../types";
import { OpenRouterService } from "../services/openRouterService";
import { PexelsService } from "../services/pexelsService";
import { BlogPrompts } from "../services/prompts/blogPrompts";
import { BlogValidator } from "./validators/blogValidator";
import {
  validateAndCleanContent,
  hasInvalidImageContent,
} from "../utils/stringUtils";
import { cleanJsonResponse } from "../utils/jsonUtils";
import { logger } from "../utils/logger";

export class ContentProcessor {
  private openRouterService: OpenRouterService;
  private pexelsService: PexelsService;

  constructor() {
    this.openRouterService = new OpenRouterService();
    this.pexelsService = new PexelsService();
  }

  async generateBlogContent(
    title: string,
    companyInstruction: string
  ): Promise<BlogPost> {
    logger.info(`Generating content for: "${title}"`);

    // Step 1: Generate outline
    const outline = await this.generateOutline(title, companyInstruction);
    if (!outline) {
      throw new Error(`Failed to generate outline for "${title}"`);
    }

    logger.info(
      `Generated outline for "${title}" with ${outline.sections.length} sections`
    );

    // Step 2: Generate metadata in parallel with content generation
    const metadataPromise = this.generateMetadata(title, companyInstruction);

    // Step 3: Generate content sections
    const content = await this.generateContentFromOutline(
      outline,
      companyInstruction
    );

    // Step 4: Get metadata
    const metadata = await metadataPromise;

    // Step 5: Generate images
    const { coverImageUrl, inlineImages } = await this.generateImages(
      title,
      content
    );

    // Step 6: Create blog post
    const blogPost: BlogPost = {
      title,
      content,
      coverImageUrl,
      tags: metadata.success && metadata.data ? metadata.data.tags : ["blog"],
      category:
        metadata.success && metadata.data ? metadata.data.category : "general",
      date: this.generateCurrentDate(),
      inlineImages,
    };

    // Step 7: Final validation
    BlogValidator.validateBlogPost(blogPost);

    return blogPost;
  }

  private async generateOutline(
    title: string,
    companyInstruction: string
  ): Promise<BlogOutline | null> {
    const prompt = BlogPrompts.buildBlogOutlinePrompt(
      title,
      companyInstruction
    );
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      logger.error(`Failed to generate outline: ${response.error}`);
      return null;
    }

    try {
      const jsonData = cleanJsonResponse(response.data);
      const outline = JSON.parse(jsonData) as BlogOutline;

      // Validate outline structure
      if (
        !outline.title ||
        !outline.introduction ||
        !outline.sections ||
        !outline.conclusion
      ) {
        logger.error("Generated outline is missing required fields");
        return null;
      }

      logger.info(`Generated outline with ${outline.sections.length} sections`);
      return outline;
    } catch (error) {
      logger.error(`Failed to parse outline JSON: ${error}`);
      logger.debug(`Raw response data: ${response.data}`);
      return null;
    }
  }

  private async generateContentFromOutline(
    outline: BlogOutline,
    companyInstruction: string
  ): Promise<string> {
    const contentParts: string[] = [];

    // Generate introduction
    logger.info("Generating introduction...");
    const introduction = await this.generateIntroduction(
      outline.title,
      outline.introduction,
      companyInstruction
    );
    contentParts.push(introduction);

    // Generate each section
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      logger.info(
        `Generating section ${i + 1}/${outline.sections.length}: "${
          section.title
        }"`
      );

      const sectionContent = await this.generateSection(
        outline.title,
        section,
        companyInstruction
      );
      contentParts.push(sectionContent);
    }

    // Generate conclusion
    logger.info("Generating conclusion...");
    const conclusion = await this.generateConclusion(
      outline.title,
      outline.conclusion,
      companyInstruction
    );

    // Ensure conclusion has proper header
    let finalConclusion = conclusion;
    if (!conclusion.toLowerCase().includes("## conclusion")) {
      logger.warn("Generated conclusion missing proper header, adding it");
      finalConclusion = `## Conclusion\n\n${conclusion}`;
    }

    contentParts.push(finalConclusion);

    // Combine all parts
    const fullContent = contentParts.join("\n\n");

    // Debug: Check if conclusion is present
    if (!fullContent.toLowerCase().includes("conclusion")) {
      logger.error("Generated content is missing conclusion section entirely");
      logger.debug(`Content parts count: ${contentParts.length}`);
      logger.debug(
        `Last content part: ${contentParts[contentParts.length - 1]}`
      );
    }

    // Clean and validate content
    const cleanedContent = this.processContent(fullContent, outline.title);

    logger.info(
      `Generated complete blog post with ${
        BlogValidator.getWordCountStats(cleanedContent).wordCount
      } words`
    );

    return cleanedContent;
  }

  private async generateIntroduction(
    title: string,
    introductionDescription: string,
    companyInstruction: string
  ): Promise<string> {
    const prompt = BlogPrompts.buildIntroductionPrompt(
      title,
      introductionDescription,
      companyInstruction
    );
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      logger.warn(`Failed to generate introduction, using fallback`);
      return this.generateFallbackIntroduction(title, introductionDescription);
    }

    return response.data;
  }

  private async generateSection(
    title: string,
    section: BlogSection,
    companyInstruction: string
  ): Promise<string> {
    const prompt = BlogPrompts.buildSectionExpansionPrompt(
      title,
      section.title,
      section.description,
      section.subsections,
      companyInstruction
    );

    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      logger.warn(
        `Failed to generate section "${section.title}", using fallback`
      );
      return this.generateFallbackSection(section);
    }

    return response.data;
  }

  private async generateConclusion(
    title: string,
    conclusionDescription: string,
    companyInstruction: string
  ): Promise<string> {
    const prompt = BlogPrompts.buildConclusionPrompt(
      title,
      conclusionDescription,
      companyInstruction
    );
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      logger.warn(`Failed to generate conclusion, using fallback`);
      return this.generateFallbackConclusion(title, conclusionDescription);
    }

    return response.data;
  }

  private async generateMetadata(
    title: string,
    companyInstruction: string
  ): Promise<{ success: boolean; data?: BlogMetadata; error?: string }> {
    const prompt = BlogPrompts.buildBlogMetadataPrompt(
      title,
      companyInstruction
    );
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to generate metadata",
      };
    }

    try {
      const jsonData = cleanJsonResponse(response.data);
      const metadata = JSON.parse(jsonData);
      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      logger.error(`Failed to parse metadata JSON: ${error}`);
      logger.debug(`Raw metadata response: ${response.data}`);
      // Fallback to default metadata if parsing fails
      return {
        success: true,
        data: {
          tags: this.generateFallbackTags(title),
          category: this.generateFallbackCategory(companyInstruction),
        },
      };
    }
  }

  private async generateImages(
    title: string,
    content: string
  ): Promise<{ coverImageUrl?: string; inlineImages: InlineImage[] }> {
    // Try to find cover image
    let coverImageUrl: string | undefined;
    const coverImageResponse = await this.pexelsService.findCoverImage(title);
    if (coverImageResponse.success && coverImageResponse.data) {
      coverImageUrl = coverImageResponse.data;
      logger.info(`Found cover image for "${title}"`);
    } else {
      logger.warn(
        `No valid cover image found for "${title}", continuing without cover image`
      );
    }

    // Generate inline images
    let inlineImages: InlineImage[] = [];
    try {
      const imageQueriesResponse = await this.generateImageQueries(
        title,
        content
      );

      if (imageQueriesResponse.success && imageQueriesResponse.data) {
        const inlineImagesResponse = await this.pexelsService.findInlineImages(
          imageQueriesResponse.data,
          4 // More images for longer content
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

    return { coverImageUrl, inlineImages };
  }

  private async generateImageQueries(
    title: string,
    content: string
  ): Promise<{ success: boolean; data?: string[]; error?: string }> {
    const prompt = BlogPrompts.buildImageQueriesPrompt(title, content);
    const response = await this.openRouterService.generateContent(
      prompt,
      "perplexity/sonar-reasoning-pro"
    );

    if (!response.success || !response.data) {
      return {
        success: true,
        data: this.getFallbackImageQueries(title), // Use fallback queries
      };
    }

    try {
      const jsonData = cleanJsonResponse(response.data);
      const queries = JSON.parse(jsonData);
      const validQueries = Array.isArray(queries) ? queries : [title];

      // Sanitize the queries to ensure they're appropriate for stock photos
      const sanitizedQueries = validQueries.map((query) =>
        this.sanitizeImageQuery(query)
      );

      return {
        success: true,
        data: sanitizedQueries,
      };
    } catch (error) {
      logger.error(`Failed to parse image queries JSON: ${error}`);
      logger.debug(`Raw image queries response: ${response.data}`);
      // Fallback to safe generic queries
      return {
        success: true,
        data: this.getFallbackImageQueries(title),
      };
    }
  }

  private processContent(content: string, title: string): string {
    // Validate and clean the generated content to remove any image references
    let cleanedContent = validateAndCleanContent(content);

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

    return cleanedContent;
  }

  private generateCurrentDate(): string {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  // Fallback content generators
  private generateFallbackIntroduction(
    title: string,
    description: string
  ): string {
    return `# ${title}

${description}

In this comprehensive guide, we'll explore everything you need to know about this topic. Whether you're just getting started or looking to deepen your understanding, this article will provide you with valuable insights and practical strategies.

Let's dive in and discover how you can apply these concepts to achieve your goals.`;
  }

  private generateFallbackSection(section: BlogSection): string {
    const subsections = section.subsections
      .map((sub) => `### ${sub.title}\n\n${sub.description}`)
      .join("\n\n");

    return `## ${section.title}

${section.description}

${subsections}

This section provides comprehensive coverage of ${section.title.toLowerCase()}. Each subsection offers detailed insights and practical applications.`;
  }

  private generateFallbackConclusion(
    title: string,
    description: string
  ): string {
    return `## Conclusion

${description}

We've covered a lot of ground in this comprehensive guide to ${title.toLowerCase()}. Here are the key takeaways:

- **Understanding the fundamentals** is crucial for success
- **Practical application** of these concepts leads to better results
- **Continuous learning** and adaptation are essential

Remember, the journey doesn't end here. Take what you've learned and apply it to your own situation. The strategies and insights shared in this guide can help you achieve your goals and overcome challenges.

What's your next step? How will you apply these insights to your own journey?`;
  }

  private generateFallbackTags(title: string): string[] {
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "how",
      "what",
      "why",
      "when",
      "where",
      "guide",
      "complete",
      "comprehensive",
      "ultimate",
      "best",
      "top",
      "essential",
      "proven",
      "strategies",
      "tips",
      "ways",
      "methods",
    ];

    const titleLower = title.toLowerCase();
    const words = titleLower
      .split(" ")
      .filter((word) => word.length > 2 && !commonWords.includes(word));

    // Add blog-oriented tags based on content
    const blogTags = [];

    if (titleLower.includes("guide") || titleLower.includes("how-to")) {
      blogTags.push("how-to", "guide");
    }
    if (titleLower.includes("strategies") || titleLower.includes("tips")) {
      blogTags.push("tips", "strategies");
    }
    if (titleLower.includes("business") || titleLower.includes("marketing")) {
      blogTags.push("business", "marketing");
    }
    if (
      titleLower.includes("productivity") ||
      titleLower.includes("efficiency")
    ) {
      blogTags.push("productivity", "efficiency");
    }

    // Combine extracted words with blog tags, avoiding duplicates
    const allTags = [...words, ...blogTags];
    const uniqueTags = [...new Set(allTags)];

    return uniqueTags.slice(0, 5);
  }

  private generateFallbackCategory(companyInstruction: string): string {
    const instruction = companyInstruction.toLowerCase();

    if (
      instruction.includes("tech") ||
      instruction.includes("software") ||
      instruction.includes("ai")
    ) {
      return "technology";
    }
    if (
      instruction.includes("health") ||
      instruction.includes("fitness") ||
      instruction.includes("wellness")
    ) {
      return "health";
    }
    if (
      instruction.includes("finance") ||
      instruction.includes("money") ||
      instruction.includes("investment")
    ) {
      return "finance";
    }
    if (
      instruction.includes("marketing") ||
      instruction.includes("business") ||
      instruction.includes("growth")
    ) {
      return "business";
    }
    if (
      instruction.includes("sustainability") ||
      instruction.includes("environment") ||
      instruction.includes("green")
    ) {
      return "sustainability";
    }

    return "general";
  }

  private sanitizeImageQuery(query: string): string {
    // Remove any potentially problematic terms
    const problematicTerms = [
      "screenshot",
      "app",
      "interface",
      "software",
      "demo",
      "logo",
      "brand",
      "product",
      "website",
      "webpage",
      "mobile",
      "desktop",
      "computer",
    ];

    let sanitized = query.toLowerCase();
    for (const term of problematicTerms) {
      sanitized = sanitized.replace(new RegExp(term, "gi"), "");
    }

    // Clean up extra spaces and return
    return sanitized.replace(/\s+/g, " ").trim() || "professional workspace";
  }

  private getFallbackImageQueries(title: string): string[] {
    return [
      "professional workspace",
      "team collaboration",
      "business meeting",
      "productive environment",
    ];
  }
}
