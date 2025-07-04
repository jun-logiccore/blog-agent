import axios, { AxiosInstance } from "axios";
import { config } from "../config";
import { OpenRouterResponse, ApiResponse } from "../types";
import { withRetry, handleApiError } from "../utils/retryUtils";
import { logger } from "../utils/logger";

export class OpenRouterService {
  private client: AxiosInstance;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 200; // Minimum 200ms between requests

  constructor() {
    this.client = axios.create({
      baseURL: config.openRouterBaseUrl,
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
  }

  async generateContent(
    prompt: string,
    model?: string
  ): Promise<ApiResponse<string>> {
    return withRetry(
      async () => {
        await this.throttleRequest();

        try {
          logger.debug(
            `Generating content with model: ${model || config.defaultModel}`
          );

          const response = await this.client.post<OpenRouterResponse>(
            "/chat/completions",
            {
              model: model || config.defaultModel,
              messages: [{ role: "user", content: prompt }],
            }
          );

          this.requestCount++;
          logger.debug(`OpenRouter API request count: ${this.requestCount}`);

          const content = response.data.choices[0]?.message?.content;
          if (!content) {
            return {
              success: false,
              error: "No content received from API",
            };
          }

          return {
            success: true,
            data: content,
          };
        } catch (error) {
          logger.error(`OpenRouter API error:`, error);
          handleApiError(error);
        }
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
      }
    );
  }

  // Note: Blog-specific methods have been moved to BlogGenerator and ContentProcessor classes
  // These methods are kept for backward compatibility but should not be used
  async generateBlogIdeas(
    companyInstruction: string,
    existingTitles: string[] = []
  ): Promise<ApiResponse<string[]>> {
    throw new Error(
      "This method is deprecated. Use BlogGenerator.generateBlogIdeas() instead."
    );
  }

  async generateBlogPostContent(
    title: string,
    companyInstruction: string
  ): Promise<ApiResponse<string>> {
    throw new Error(
      "This method is deprecated. Use ContentProcessor.generateBlogContent() instead."
    );
  }

  async generateResearchBasedBlogPost(
    title: string,
    companyInstruction: string
  ): Promise<ApiResponse<string>> {
    throw new Error(
      "This method is deprecated. Use ContentProcessor.generateBlogContent() instead."
    );
  }

  async generateBlogMetadata(
    title: string,
    companyInstruction: string
  ): Promise<ApiResponse<any>> {
    throw new Error(
      "This method is deprecated. Use ContentProcessor.generateBlogContent() instead."
    );
  }

  async generateImageQueries(
    title: string,
    content: string
  ): Promise<ApiResponse<string[]>> {
    throw new Error(
      "This method is deprecated. Use ContentProcessor.generateBlogContent() instead."
    );
  }

  private async throttleRequest(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
      await this.delay(delayNeeded);
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
}
