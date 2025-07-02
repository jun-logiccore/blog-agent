import { createClient } from "pexels";
import { config } from "../config";
import { ApiResponse, InlineImage, PexelsPhoto } from "../types";
import { logger } from "../utils/logger";
import {
  withRetry,
  handleApiError,
  formatRetryDelay,
} from "../utils/retryUtils";

export class PexelsService {
  private client: ReturnType<typeof createClient>;
  private excludedKeywords: string[];
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // Minimum 100ms between requests

  constructor() {
    this.client = createClient(config.pexelsApiKey);
    // Keywords to filter out from image results
    this.excludedKeywords = [
      "screenshot",
      "interface",
      "app",
      "application",
      "software",
      "demo",
      "ui",
      "ux",
      "mockup",
      "wireframe",
      "prototype",
      "dashboard",
      "browser",
      "website",
      "webpage",
      "screen",
      "monitor display",
      "logo",
      "brand",
      "branding",
      "identity",
      "trademark",
    ];
  }

  async findCoverImage(query: string): Promise<ApiResponse<string>> {
    return withRetry(
      async () => {
        await this.throttleRequest();

        try {
          // Sanitize the query to avoid problematic terms
          const sanitizedQuery = this.sanitizeQuery(query);

          logger.debug(
            `Searching for cover image with query: "${sanitizedQuery}"`
          );

          const result = await this.client.photos.search({
            query: sanitizedQuery,
            per_page: 5, // Get more results to filter from
          });

          this.requestCount++;
          logger.debug(`Pexels API request count: ${this.requestCount}`);

          if ("photos" in result && result.photos.length > 0) {
            // Filter out screenshots and app-related images
            const filteredPhotos = result.photos.filter(
              (photo) =>
                this.isValidPexelsPhoto(photo) &&
                this.isStockPhotoContent(photo)
            );

            if (filteredPhotos.length > 0) {
              logger.debug(
                `Found valid cover image for query: "${sanitizedQuery}"`
              );
              return {
                success: true,
                data: filteredPhotos[0].src.large,
              };
            }
          }

          logger.warn(
            `No valid stock photos found for cover image query: "${sanitizedQuery}"`
          );
          return {
            success: false,
            error: `No valid stock photos found for query: "${sanitizedQuery}"`,
          };
        } catch (error) {
          logger.error(`Error finding cover image for "${query}":`, error);
          handleApiError(error);
        }
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 60000, // Up to 1 minute for rate limits
      }
    );
  }

  async findInlineImages(
    queries: string[],
    imagesPerQuery: number = 1
  ): Promise<ApiResponse<InlineImage[]>> {
    return withRetry(
      async () => {
        try {
          const allImages: InlineImage[] = [];

          for (const query of queries) {
            await this.throttleRequest();

            const sanitizedQuery = this.sanitizeQuery(query);
            logger.debug(
              `Searching for inline images with sanitized query: "${sanitizedQuery}"`
            );

            const result = await this.client.photos.search({
              query: sanitizedQuery,
              per_page: imagesPerQuery * 3, // Get more results to filter from
            });

            this.requestCount++;
            logger.debug(`Pexels API request count: ${this.requestCount}`);

            if ("photos" in result && result.photos.length > 0) {
              const validPhotos = result.photos.filter(
                (photo) =>
                  this.isValidPexelsPhoto(photo) &&
                  this.isStockPhotoContent(photo)
              );

              // Take only the requested number after filtering
              const selectedPhotos = validPhotos.slice(0, imagesPerQuery);
              const images = selectedPhotos.map((photo) =>
                this.convertToInlineImage(photo)
              );
              allImages.push(...images);

              if (selectedPhotos.length > 0) {
                logger.debug(
                  `Found ${selectedPhotos.length} valid stock photos for query: "${sanitizedQuery}"`
                );
              } else {
                logger.debug(
                  `No valid stock photos found for query: "${sanitizedQuery}" after filtering`
                );
              }
            } else {
              logger.debug(`No images found for query: "${sanitizedQuery}"`);
            }

            // Add delay between queries to be respectful to the API
            if (queries.length > 1) {
              await this.delay(200);
            }
          }

          logger.info(`Total valid stock photos found: ${allImages.length}`);
          return {
            success: true,
            data: allImages,
          };
        } catch (error) {
          logger.error(`Error finding inline images:`, error);
          handleApiError(error);
        }
      },
      {
        maxRetries: 3,
        baseDelayMs: 2000, // Longer delay for multiple requests
        maxDelayMs: 60000,
      }
    );
  }

  async findImagesForQuery(
    query: string,
    count: number = 5
  ): Promise<ApiResponse<string[]>> {
    return withRetry(
      async () => {
        await this.throttleRequest();

        try {
          const sanitizedQuery = this.sanitizeQuery(query);

          const result = await this.client.photos.search({
            query: sanitizedQuery,
            per_page: count * 2, // Get more results to filter from
          });

          this.requestCount++;
          logger.debug(`Pexels API request count: ${this.requestCount}`);

          if ("photos" in result && result.photos.length > 0) {
            const validPhotos = result.photos.filter(
              (photo) =>
                this.isValidPexelsPhoto(photo) &&
                this.isStockPhotoContent(photo)
            );
            const imageUrls = validPhotos
              .slice(0, count)
              .map((photo) => photo.src.large);

            if (imageUrls.length > 0) {
              return {
                success: true,
                data: imageUrls,
              };
            }
          }

          logger.warn(
            `No valid stock photos found for query: "${sanitizedQuery}"`
          );
          return {
            success: false,
            error: `No valid stock photos found for query: "${sanitizedQuery}"`,
          };
        } catch (error) {
          logger.error(`Error finding images for "${query}":`, error);
          handleApiError(error);
        }
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 60000,
      }
    );
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayMs = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`Throttling request, waiting ${delayMs}ms`);
      await this.delay(delayMs);
    }

    this.lastRequestTime = Date.now();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRequestStats(): { count: number; lastRequestTime: number } {
    return {
      count: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }

  private sanitizeQuery(query: string): string {
    // Remove problematic terms and replace with generic alternatives
    let sanitized = query.toLowerCase();

    // Replace app/software related terms with generic alternatives
    const replacements: { [key: string]: string } = {
      app: "workspace",
      application: "business",
      software: "technology",
      interface: "design",
      dashboard: "office",
      screen: "workspace",
      website: "computer",
      browser: "laptop",
      mobile: "phone",
      screenshot: "computer work",
    };

    for (const [bad, good] of Object.entries(replacements)) {
      sanitized = sanitized.replace(new RegExp(bad, "gi"), good);
    }

    // Add generic stock photo terms to improve results
    const stockPhotoTerms = ["professional", "business", "modern", "clean"];
    const randomTerm =
      stockPhotoTerms[Math.floor(Math.random() * stockPhotoTerms.length)];

    return `${randomTerm} ${sanitized}`.trim();
  }

  private isStockPhotoContent(photo: any): boolean {
    if (!photo.alt) return true; // If no alt text, assume it's okay

    const altText = photo.alt.toLowerCase();

    // Check if alt text contains excluded keywords
    const hasExcludedContent = this.excludedKeywords.some((keyword) =>
      altText.includes(keyword.toLowerCase())
    );

    if (hasExcludedContent) {
      logger.debug(`Filtered out image with alt text: "${photo.alt}"`);
      return false;
    }

    return true;
  }

  private isValidPexelsPhoto(photo: any): boolean {
    return (
      photo &&
      photo.src &&
      photo.src.large &&
      photo.src.medium &&
      photo.photographer &&
      photo.photographer_url &&
      photo.url &&
      typeof photo.src.large === "string" &&
      photo.src.large.includes("pexels.com") &&
      photo.src.large.startsWith("https://")
    );
  }

  private convertToInlineImage(photo: any): InlineImage {
    if (!this.isValidPexelsPhoto(photo)) {
      throw new Error("Invalid Pexels photo data");
    }

    return {
      url: photo.src.medium,
      alt: photo.alt || "Stock photo",
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pexelsUrl: photo.url,
    };
  }

  generateImageMarkdown(image: InlineImage): string {
    // Double-check that the image URL is from Pexels
    if (
      !image.url.includes("pexels.com") ||
      !image.url.startsWith("https://")
    ) {
      throw new Error("Invalid image URL - must be from Pexels");
    }

    return `![${image.alt}](${image.url})

*Photo by [${image.photographer}](${image.photographerUrl}) on [Pexels](${image.pexelsUrl})*`;
  }
}
