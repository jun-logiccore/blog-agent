export class Logger {
  private static instance: Logger;
  private isVerbose: boolean;

  private constructor() {
    this.isVerbose = process.env.VERBOSE === "true";
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || "");
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  debug(message: string): void {
    if (this.isVerbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }
}

export const logger = Logger.getInstance();
