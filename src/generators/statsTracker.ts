import { OpenRouterService } from "../services/openRouterService";
import { PexelsService } from "../services/pexelsService";
import { logger } from "../utils/logger";

export class StatsTracker {
  private openRouterService: OpenRouterService;
  private pexelsService: PexelsService;

  constructor(
    openRouterService: OpenRouterService,
    pexelsService: PexelsService
  ) {
    this.openRouterService = openRouterService;
    this.pexelsService = pexelsService;
  }

  logApiUsageStats(): void {
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

  logProgress(current: number, total: number, title: string): void {
    const percentage = Math.round((current / total) * 100);
    logger.info(
      `Progress: ${current}/${total} (${percentage}%) - Currently processing: "${title}"`
    );
  }

  logCompletionStats(savedFiles: string[], errors: string[]): void {
    logger.success(`Successfully generated ${savedFiles.length} posts.`);

    if (errors.length > 0) {
      logger.warn(
        `Failed to generate ${errors.length} posts (likely due to content validation issues).`
      );

      if (process.env.VERBOSE === "true") {
        logger.debug("Failed posts:");
        errors.forEach((error) => logger.debug(`  - ${error}`));
      }
    }

    // Log final API usage stats
    this.logApiUsageStats();
  }
}
