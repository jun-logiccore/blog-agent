import dotenv from "dotenv";

dotenv.config();

export class Config {
  private static instance: Config;

  public readonly openRouterApiKey: string;
  public readonly pexelsApiKey: string;
  public readonly openRouterBaseUrl: string;
  public readonly defaultModel: string;
  public readonly postsDirectory: string;

  private constructor() {
    this.openRouterApiKey = this.getRequiredEnvVar("OPENROUTER_API_KEY");
    this.pexelsApiKey = this.getRequiredEnvVar("PEXELS_API_KEY");
    this.openRouterBaseUrl = "https://openrouter.ai/api/v1";
    this.defaultModel = "openai/gpt-4o-mini";
    this.postsDirectory = "posts";
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} is not set in the .env file.`);
    }
    return value;
  }
}

export const config = Config.getInstance();
