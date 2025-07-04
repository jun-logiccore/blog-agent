import { BlogPost, InlineImage } from "../../types";
import { hasInvalidImageContent } from "../../utils/stringUtils";
import { logger } from "../../utils/logger";

export class BlogValidator {
  private static readonly MIN_WORD_COUNT = 1500;
  private static readonly TARGET_WORD_COUNT = 2500;

  static validateBlogPost(post: BlogPost): void {
    this.validateContent(post);
    this.validateImages(post);
    this.validateWordCount(post);
    this.validateBlogStyle(post);

    logger.debug(`Blog post validation passed for: "${post.title}"`);
  }

  static validateImageUrls(post: BlogPost): void {
    // Validate cover image if present
    if (post.coverImageUrl) {
      if (
        !post.coverImageUrl.includes("pexels.com") ||
        !post.coverImageUrl.startsWith("https://")
      ) {
        throw new Error("Invalid cover image URL - must be from Pexels");
      }
    }

    // Validate inline images if present
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

  private static validateContent(post: BlogPost): void {
    // Validate that content doesn't contain any image references
    if (hasInvalidImageContent(post.content)) {
      throw new Error("Blog post content contains invalid image references");
    }

    // Validate that content is not empty
    if (!post.content || post.content.trim().length === 0) {
      throw new Error("Blog post content cannot be empty");
    }

    // Validate that content has proper structure
    if (!post.content.includes("##")) {
      throw new Error("Blog post must have proper section headers (##)");
    }

    // Validate that content has an introduction and conclusion
    const contentLower = post.content.toLowerCase();
    const hasConclusion =
      contentLower.includes("## conclusion") ||
      contentLower.includes("conclusion") ||
      contentLower.includes("## final thoughts") ||
      contentLower.includes("## wrapping up") ||
      contentLower.includes("## summary") ||
      contentLower.includes("## key takeaways");

    if (!hasConclusion) {
      logger.error(`Blog post "${post.title}" is missing a conclusion section`);
      logger.debug(
        `Content preview (last 500 chars): ${post.content.slice(-500)}`
      );
      throw new Error("Blog post must have a conclusion section");
    }
  }

  private static validateImages(post: BlogPost): void {
    // Validate cover image if present
    if (post.coverImageUrl && !post.coverImageUrl.includes("pexels.com")) {
      throw new Error("Cover image must be from Pexels");
    }

    // Validate inline images if present
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
  }

  private static validateWordCount(post: BlogPost): void {
    const wordCount = this.countWords(post.content);

    if (wordCount < this.MIN_WORD_COUNT) {
      logger.warn(
        `Blog post "${post.title}" is only ${wordCount} words, below minimum of ${this.MIN_WORD_COUNT} words.`
      );
    }

    if (wordCount < this.TARGET_WORD_COUNT) {
      logger.info(
        `Blog post "${post.title}" is ${wordCount} words, below target of ${this.TARGET_WORD_COUNT} words.`
      );
    } else {
      logger.info(
        `Blog post "${post.title}" word count: ${wordCount} words (excellent length)`
      );
    }
  }

  private static validateBlogStyle(post: BlogPost): void {
    const content = post.content.toLowerCase();

    // Check for blog-like writing style indicators
    const hasConversationalElements =
      content.includes("you ") ||
      content.includes("we ") ||
      content.includes("i ") ||
      content.includes("let's ") ||
      content.includes("don't ") ||
      content.includes("can't ") ||
      content.includes("won't ");

    const hasEngagingElements =
      content.includes("imagine ") ||
      content.includes("picture ") ||
      content.includes("think about ") ||
      content.includes("consider ") ||
      content.includes("here's ") ||
      content.includes("here is ");

    const hasPersonalElements =
      content.includes("i've ") ||
      content.includes("i'm ") ||
      content.includes("i'll ") ||
      content.includes("we've ") ||
      content.includes("we're ") ||
      content.includes("we'll ");

    if (!hasConversationalElements) {
      logger.warn(
        `Blog post "${post.title}" may lack conversational tone - consider adding more personal pronouns and contractions`
      );
    }

    if (!hasEngagingElements) {
      logger.warn(
        `Blog post "${post.title}" may lack engaging elements - consider adding more interactive language`
      );
    }

    if (!hasPersonalElements) {
      logger.info(
        `Blog post "${post.title}" could benefit from more personal storytelling elements`
      );
    }
  }

  private static countWords(text: string): number {
    // Remove markdown formatting and count words
    const cleanText = text
      .replace(/[#*`\[\]()]/g, "") // Remove markdown symbols
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return cleanText.split(" ").filter((word) => word.length > 0).length;
  }

  static getWordCountStats(content: string): {
    wordCount: number;
    isAcceptable: boolean;
    isOptimal: boolean;
  } {
    const wordCount = this.countWords(content);
    return {
      wordCount,
      isAcceptable: wordCount >= this.MIN_WORD_COUNT,
      isOptimal: wordCount >= this.TARGET_WORD_COUNT,
    };
  }
}
