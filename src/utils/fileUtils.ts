import fs from "fs/promises";
import path from "path";
import { BlogPost, InlineImage } from "../types";
import { slugify } from "./stringUtils";
import { config } from "../config";
import { logger } from "./logger";

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function getExistingPostTitles(): Promise<string[]> {
  try {
    // Ensure posts directory exists
    await ensureDirectoryExists(config.postsDirectory);

    // Read all files in posts directory
    const files = await fs.readdir(config.postsDirectory);
    const markdownFiles = files.filter((file) => file.endsWith(".md"));

    if (markdownFiles.length === 0) {
      logger.info("No existing posts found in posts directory");
      return [];
    }

    logger.info(
      `Found ${markdownFiles.length} existing posts, reading titles...`
    );

    const titles: string[] = [];

    for (const file of markdownFiles) {
      try {
        const filePath = path.join(config.postsDirectory, file);
        const content = await fs.readFile(filePath, "utf-8");
        const title = extractTitleFromMarkdown(content);

        if (title) {
          titles.push(title);
        } else {
          logger.warn(`Could not extract title from ${file}`);
        }
      } catch (error) {
        logger.warn(`Error reading ${file}: ${error}`);
      }
    }

    logger.info(`Successfully extracted ${titles.length} existing post titles`);
    return titles;
  } catch (error) {
    logger.error(`Error reading existing posts: ${error}`);
    return [];
  }
}

export function extractTitleFromMarkdown(content: string): string | null {
  // Try to extract title from frontmatter first
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/^title:\s*["']?(.*?)["']?\s*$/m);

    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Fallback: try to extract from first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return null;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

export function isDuplicateTitle(
  newTitle: string,
  existingTitles: string[]
): boolean {
  const normalizedNew = normalizeTitle(newTitle);

  return existingTitles.some((existing) => {
    const normalizedExisting = normalizeTitle(existing);

    // Exact match after normalization
    if (normalizedNew === normalizedExisting) {
      return true;
    }

    // Check for substantial similarity (80% or more words in common)
    const newWords = normalizedNew.split(" ").filter((word) => word.length > 2);
    const existingWords = normalizedExisting
      .split(" ")
      .filter((word) => word.length > 2);

    if (newWords.length === 0 || existingWords.length === 0) {
      return false;
    }

    const commonWords = newWords.filter((word) => existingWords.includes(word));
    const similarity =
      commonWords.length / Math.max(newWords.length, existingWords.length);

    return similarity >= 0.8;
  });
}

export function filterDuplicateTitles(
  newTitles: string[],
  existingTitles: string[]
): string[] {
  const filtered = newTitles.filter(
    (title) => !isDuplicateTitle(title, existingTitles)
  );

  const duplicatesCount = newTitles.length - filtered.length;
  if (duplicatesCount > 0) {
    logger.info(`Filtered out ${duplicatesCount} duplicate titles`);
  }

  return filtered;
}

export async function savePostToMarkdown(post: BlogPost): Promise<string> {
  const fileName = `${slugify(post.title)}.md`;
  const filePath = path.join(config.postsDirectory, fileName);

  const content = generateMarkdownContent(post);

  try {
    await ensureDirectoryExists(config.postsDirectory);
    await fs.writeFile(filePath, content);
    return filePath;
  } catch (error) {
    throw new Error(`Failed to save post to ${filePath}: ${error}`);
  }
}

function generateMarkdownContent(post: BlogPost): string {
  const frontmatter = generateFrontmatter(post);
  const contentWithImages = insertInlineImages(
    post.content,
    post.inlineImages || []
  );

  return `${frontmatter}

${contentWithImages}
`;
}

function generateFrontmatter(post: BlogPost): string {
  const tags = post.tags.map((tag) => `"${tag}"`).join(", ");

  // Only include cover_image if it exists
  const coverImageLine = post.coverImageUrl
    ? `cover_image: "${post.coverImageUrl}"`
    : "";

  return `---
title: "${post.title}"${coverImageLine ? `\n${coverImageLine}` : ""}
tags: [${tags}]
category: "${post.category}"
date: "${post.date}"
---`;
}

function insertInlineImages(content: string, images: InlineImage[]): string {
  if (images.length === 0) return content;

  // Split content into paragraphs
  const paragraphs = content.split("\n\n");
  const totalParagraphs = paragraphs.length;

  // Calculate positions to insert images (roughly every 3-4 paragraphs)
  const imagePositions = calculateImagePositions(
    totalParagraphs,
    images.length
  );

  let result = "";
  let imageIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    result += paragraphs[i];

    // Insert image if this position is in our imagePositions array
    if (imagePositions.includes(i) && imageIndex < images.length) {
      const image = images[imageIndex];
      const imageMarkdown = generateImageMarkdown(image);
      result += "\n\n" + imageMarkdown;
      imageIndex++;
    }

    // Add paragraph spacing unless it's the last paragraph
    if (i < paragraphs.length - 1) {
      result += "\n\n";
    }
  }

  return result;
}

function calculateImagePositions(
  totalParagraphs: number,
  imageCount: number
): number[] {
  if (imageCount === 0 || totalParagraphs < 3) return [];

  const positions: number[] = [];
  const interval = Math.floor(totalParagraphs / (imageCount + 1));

  for (let i = 1; i <= imageCount; i++) {
    const position = Math.min(interval * i, totalParagraphs - 2);
    positions.push(position);
  }

  return positions;
}

function generateImageMarkdown(image: InlineImage): string {
  return `![${image.alt}](${image.url})

*Photo by [${image.photographer}](${image.photographerUrl}) on [Pexels](${image.pexelsUrl})*`;
}
