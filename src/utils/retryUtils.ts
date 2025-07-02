import { logger } from "./logger";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  retryableErrors: number[];
}

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfterMs?: number;
  remainingRequests?: number;
  resetTime?: Date;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  exponentialBase: 2,
  retryableErrors: [429, 500, 502, 503, 504], // Rate limit + server errors
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryAfterMs?: number
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxRetries) {
        logger.error(
          `Operation failed after ${config.maxRetries} retries: ${lastError.message}`
        );
        throw lastError;
      }

      if (error instanceof RetryableError) {
        const delayMs =
          error.retryAfterMs || calculateExponentialDelay(attempt, config);
        logger.warn(
          `Retryable error (${error.statusCode}): ${
            error.message
          }. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${
            config.maxRetries
          })`
        );
        await delay(delayMs);
        continue;
      }

      // For non-retryable errors, throw immediately
      throw error;
    }
  }

  throw lastError!;
}

export function parseRateLimitHeaders(headers: any): RateLimitInfo {
  const rateLimitInfo: RateLimitInfo = {
    isRateLimited: false,
  };

  // Check for rate limiting (status 429 is handled separately)
  if (headers["x-ratelimit-remaining"]) {
    rateLimitInfo.remainingRequests = parseInt(
      headers["x-ratelimit-remaining"],
      10
    );
  }

  if (headers["x-ratelimit-reset"]) {
    const resetTimestamp = parseInt(headers["x-ratelimit-reset"], 10);
    rateLimitInfo.resetTime = new Date(resetTimestamp * 1000);
  }

  if (headers["retry-after"]) {
    const retryAfter = headers["retry-after"];
    if (typeof retryAfter === "string" && retryAfter.match(/^\d+$/)) {
      // Retry-After in seconds
      rateLimitInfo.retryAfterMs = parseInt(retryAfter, 10) * 1000;
    } else if (typeof retryAfter === "string") {
      // Retry-After as HTTP date
      const retryDate = new Date(retryAfter);
      rateLimitInfo.retryAfterMs = Math.max(
        0,
        retryDate.getTime() - Date.now()
      );
    }
    rateLimitInfo.isRateLimited = true;
  }

  return rateLimitInfo;
}

export function handleApiError(error: any): never {
  if (error.response) {
    const status = error.response.status;
    const rateLimitInfo = parseRateLimitHeaders(error.response.headers || {});

    if (status === 429 || rateLimitInfo.isRateLimited) {
      const retryAfterMs = rateLimitInfo.retryAfterMs || 60000; // Default to 1 minute
      throw new RetryableError(
        `Rate limited by API. Retry after ${retryAfterMs}ms`,
        status,
        retryAfterMs
      );
    }

    if ([500, 502, 503, 504].includes(status)) {
      throw new RetryableError(
        `Server error (${status}): ${
          error.response.statusText || "Unknown error"
        }`,
        status
      );
    }

    // Non-retryable client errors (4xx except 429)
    if (status >= 400 && status < 500) {
      throw new Error(
        `Client error (${status}): ${
          error.response.statusText || error.message
        }`
      );
    }
  }

  // Network errors or other issues
  if (
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ENOTFOUND"
  ) {
    throw new RetryableError(`Network error: ${error.message}`, 0);
  }

  // Unknown error, don't retry
  throw error;
}

function calculateExponentialDelay(
  attempt: number,
  options: RetryOptions
): number {
  const delay =
    options.baseDelayMs * Math.pow(options.exponentialBase, attempt);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, options.maxDelayMs);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatRetryDelay(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Test function to demonstrate retry functionality
export async function testRetryFunctionality(): Promise<void> {
  logger.info("Testing retry functionality...");

  // Test 1: Successful operation after retries
  try {
    let attempts = 0;
    await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new RetryableError("Simulated rate limit", 429, 1000);
        }
        return "Success!";
      },
      { maxRetries: 3, baseDelayMs: 500 }
    );
    logger.success("Test 1 passed: Operation succeeded after retries");
  } catch (error) {
    logger.error("Test 1 failed:", error);
  }

  // Test 2: Non-retryable error
  try {
    await withRetry(
      async () => {
        throw new Error("Non-retryable error");
      },
      { maxRetries: 2 }
    );
    logger.error("Test 2 failed: Should have thrown immediately");
  } catch (error) {
    if (error instanceof Error && error.message === "Non-retryable error") {
      logger.success("Test 2 passed: Non-retryable error thrown immediately");
    } else {
      logger.error("Test 2 failed: Wrong error type");
    }
  }

  logger.info("Retry functionality tests completed");
}
