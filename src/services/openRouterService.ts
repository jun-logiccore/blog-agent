import axios, { AxiosInstance } from "axios";
import { config } from "../config";
import { OpenRouterResponse, ApiResponse, BlogMetadata } from "../types";
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

  async generateBlogIdeas(
    companyInstruction: string,
    existingTitles: string[] = []
  ): Promise<ApiResponse<string[]>> {
    const prompt = this.buildBlogIdeasPrompt(
      companyInstruction,
      existingTitles
    );
    const response = await this.generateContent(prompt);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to generate blog ideas",
      };
    }

    try {
      const ideas = this.parseBlogIdeasResponse(response.data);
      return {
        success: true,
        data: ideas,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse blog ideas: ${error}`,
      };
    }
  }

  async generateBlogPostContent(
    title: string,
    companyInstruction: string
  ): Promise<ApiResponse<string>> {
    const prompt = this.buildBlogPostPrompt(title, companyInstruction);
    return await this.generateContent(prompt);
  }

  async generateBlogMetadata(
    title: string,
    companyInstruction: string
  ): Promise<ApiResponse<BlogMetadata>> {
    const prompt = this.buildMetadataPrompt(title, companyInstruction);
    const response = await this.generateContent(prompt);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to generate metadata",
      };
    }

    try {
      const metadata = JSON.parse(response.data);
      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
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

  async generateImageQueries(
    title: string,
    content: string
  ): Promise<ApiResponse<string[]>> {
    const prompt = this.buildImageQueriesPrompt(title, content);
    const response = await this.generateContent(prompt);

    if (!response.success || !response.data) {
      return {
        success: true,
        data: this.getFallbackImageQueries(title), // Use fallback queries
      };
    }

    try {
      const queries = JSON.parse(response.data);
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
      // Fallback to safe generic queries
      return {
        success: true,
        data: this.getFallbackImageQueries(title),
      };
    }
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayMs = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`Throttling OpenRouter request, waiting ${delayMs}ms`);
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

  private buildBlogIdeasPrompt(
    companyInstruction: string,
    existingTitles: string[] = []
  ): string {
    const basePrompt = [
      `Based on the following company description: "${companyInstruction}",`,
      "generate a diverse list of around 100 blog post titles that would be valuable to their target audience.",
      "Create a MIX of different types of content:",
      "1. COMPANY-FOCUSED (20%): Posts directly about the company, products, or services",
      "2. INDUSTRY INSIGHTS (25%): Trends, news, analysis in the company's industry",
      "3. EDUCATIONAL CONTENT (25%): How-to guides, tutorials, best practices related to the field",
      "4. ADJACENT TOPICS (20%): Related subjects that would interest the target audience",
      "5. BROADER THEMES (10%): Lifestyle, productivity, general interest topics for the audience",
      "Examples for an eco-friendly water bottle company:",
      "- Company: 'Why We Started Our Sustainable Mission' (company-focused)",
      "- Industry: 'The Future of Sustainable Packaging in 2024' (industry insights)",
      "- Educational: 'How to Calculate Your Daily Water Intake' (educational)",
      "- Adjacent: 'Zero Waste Kitchen Essentials for Beginners' (adjacent)",
      "- Broader: 'Morning Routines That Boost Productivity' (broader themes)",
      "Make the titles engaging, SEO-friendly, and valuable to readers even if they're customers yet.",
    ];

    // Add existing titles constraint if we have any
    if (existingTitles.length > 0) {
      basePrompt.push(
        "",
        "IMPORTANT: The following blog post titles already exist. Do NOT generate similar or duplicate titles:",
        ...existingTitles.map((title) => `- "${title}"`),
        "",
        "Ensure your new titles are completely different from the existing ones above.",
        "Avoid similar topics, wording, or themes that might create duplicates."
      );
    }

    basePrompt.push(
      "Return the titles as a JSON array of strings.",
      "Do not include any other text in your response, just the JSON array."
    );

    return basePrompt.join(" ");
  }

  private buildBlogPostPrompt(
    title: string,
    companyInstruction: string
  ): string {
    return [
      `Write a high-quality blog post with the title "${title}".`,
      `This is for a blog associated with a company described as: "${companyInstruction}".`,
      "IMPORTANT: Determine the type of content based on the title:",
      "- If it's about the company directly, write from the company's perspective",
      "- If it's educational/how-to content, focus on providing valuable information",
      "- If it's industry insights, write as an industry expert/thought leader",
      "- If it's adjacent topics, connect it naturally to the company's audience interests",
      "- If it's broader themes, write engaging content that appeals to the target demographic",
      "The post should be informative, engaging, and well-structured, use creative writing techniques when needed, use your own judgement.",
      "Write in a natural, human tone that doesn't sound AI-generated.",
      "Provide genuine value to readers, whether they're customers or just interested in the topic.",
      "Use markdown for formatting with clear section headers.",
      "IMPORTANT: Do NOT include any images, image URLs, or image markdown syntax (![]) in the content.",
      "Do NOT create placeholder image links or fake URLs.",
      "Do NOT reference specific images or include any ![image]() syntax.",
      "Write the content in a way that allows for images to be inserted naturally by the system later.",
      "Include section headers and natural break points where images could enhance the content, but do not insert the images yourself.",
      "Focus purely on text content - images will be added separately by the system.",
      "Do not include the title in the post content, as it will be added separately.",
    ].join(" ");
  }

  private buildMetadataPrompt(
    title: string,
    companyInstruction: string
  ): string {
    return [
      `Generate metadata for a blog post titled "${title}" for a blog associated with a company described as: "${companyInstruction}".`,
      "Analyze the title to determine the content type and generate appropriate metadata:",
      "- Company-focused posts: Use company/brand-related tags and business category",
      "- Educational content: Use instructional/tutorial tags and education/how-to categories",
      "- Industry insights: Use industry-specific tags and analysis/trends categories",
      "- Adjacent topics: Use broader interest tags and lifestyle/general categories",
      "- Broader themes: Use universal appeal tags and appropriate general categories",
      "Return a JSON object with 'tags' (array of 3-5 relevant tags) and 'category' (single category string).",
      "Tags should be lowercase, single words or short phrases that accurately reflect the content.",
      "Categories can include: technology, business, lifestyle, health, education, industry-insights, how-to, productivity, sustainability, finance, marketing, trends, general, etc.",
      "Make tags and categories that would help with SEO and content discovery.",
      "Examples:",
      '- \'How to Stay Hydrated During Workouts\' → {"tags": ["hydration", "fitness", "health", "wellness"], "category": "health"}',
      '- \'The Future of Sustainable Packaging\' → {"tags": ["sustainability", "packaging", "trends", "environment"], "category": "industry-insights"}',
      '- \'Morning Routines for Productivity\' → {"tags": ["productivity", "morning-routine", "lifestyle", "habits"], "category": "productivity"}',
      "Return only the JSON object, no other text.",
    ].join(" ");
  }

  private buildImageQueriesPrompt(title: string, content: string): string {
    const contentPreview = content.substring(0, 500);
    return [
      `Based on this blog post title "${title}" and content preview: "${contentPreview}",`,
      "generate 2-3 search queries for finding relevant GENERIC STOCK PHOTOS only.",
      "IMPORTANT: Avoid any queries that might return screenshots, app interfaces, branding, logos, or specific products.",
      "Focus on generic concepts like: people working, nature scenes, business concepts, lifestyle activities, abstract concepts.",
      "Good examples: 'business meeting', 'person typing laptop', 'office workspace', 'team collaboration', 'coffee cup desk', 'natural lighting office'.",
      "Bad examples: 'application screenshot', 'app interface', 'software demo', 'product logo', 'brand identity'.",
      "The queries should find PEOPLE, OBJECTS, SCENES, or CONCEPTS - never screenshots or interfaces.",
      "Return as a JSON array of strings with generic, descriptive terms only.",
      "Return only the JSON array, no other text.",
    ].join(" ");
  }

  private parseBlogIdeasResponse(content: string): string[] {
    // Try to extract JSON array first
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
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
    ];
    return title
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3);
  }

  private generateFallbackCategory(companyInstruction: string): string {
    const instruction = companyInstruction.toLowerCase();

    // Industry-specific categories
    if (
      instruction.includes("tech") ||
      instruction.includes("software") ||
      instruction.includes("ai")
    )
      return "technology";
    if (
      instruction.includes("health") ||
      instruction.includes("fitness") ||
      instruction.includes("wellness")
    )
      return "health";
    if (
      instruction.includes("food") ||
      instruction.includes("restaurant") ||
      instruction.includes("nutrition")
    )
      return "food";
    if (instruction.includes("travel") || instruction.includes("tourism"))
      return "travel";
    if (
      instruction.includes("finance") ||
      instruction.includes("money") ||
      instruction.includes("investment")
    )
      return "finance";
    if (
      instruction.includes("education") ||
      instruction.includes("learning") ||
      instruction.includes("training")
    )
      return "education";
    if (
      instruction.includes("marketing") ||
      instruction.includes("advertising") ||
      instruction.includes("social media")
    )
      return "marketing";
    if (
      instruction.includes("sustainable") ||
      instruction.includes("eco") ||
      instruction.includes("environment")
    )
      return "sustainability";
    if (
      instruction.includes("fashion") ||
      instruction.includes("clothing") ||
      instruction.includes("style")
    )
      return "lifestyle";
    if (instruction.includes("real estate") || instruction.includes("property"))
      return "real-estate";
    if (
      instruction.includes("automotive") ||
      instruction.includes("car") ||
      instruction.includes("vehicle")
    )
      return "automotive";

    // Default to business for company-related content, general for broader topics
    return "business";
  }

  private sanitizeImageQuery(query: string): string {
    // Remove problematic terms that might return screenshots or app interfaces
    const problematicTerms = [
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
      "monitor",
      "display",
      "logo",
      "brand",
      "branding",
      "identity",
      "trademark",
    ];

    let sanitized = query.toLowerCase();

    // Replace problematic terms with safe alternatives
    for (const term of problematicTerms) {
      if (sanitized.includes(term)) {
        // Replace with generic business/work terms
        const replacements = [
          "business",
          "workspace",
          "office",
          "professional",
          "team",
          "meeting",
        ];
        const replacement =
          replacements[Math.floor(Math.random() * replacements.length)];
        sanitized = sanitized.replace(new RegExp(term, "gi"), replacement);
      }
    }

    return sanitized;
  }

  private getFallbackImageQueries(title: string): string[] {
    // Safe, generic stock photo queries that won't return screenshots or app interfaces
    const genericQueries = [
      "business meeting",
      "professional workspace",
      "team collaboration",
      "office environment",
      "people working",
      "modern office",
      "business discussion",
      "professional setting",
      "workplace productivity",
      "corporate environment",
    ];

    // Try to match the title to appropriate generic concepts
    const titleLower = title.toLowerCase();

    if (titleLower.includes("team") || titleLower.includes("collaboration")) {
      return [
        "team collaboration",
        "business meeting",
        "professional workspace",
      ];
    }
    if (titleLower.includes("productivity") || titleLower.includes("work")) {
      return [
        "workplace productivity",
        "professional workspace",
        "office environment",
      ];
    }
    if (titleLower.includes("business") || titleLower.includes("company")) {
      return [
        "business meeting",
        "corporate environment",
        "professional setting",
      ];
    }
    if (titleLower.includes("technology") || titleLower.includes("digital")) {
      return ["modern office", "professional workspace", "business technology"];
    }

    // Default safe queries
    return genericQueries.slice(0, 3);
  }
}
