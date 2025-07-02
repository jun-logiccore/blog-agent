export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export function extractJsonFromText(text: string): string[] {
  // Try to find JSON array in the text
  const jsonMatch = text.match(/\[.*\]/s);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback to line-by-line parsing
    }
  }

  // Fallback: parse line by line
  return text
    .split("\n")
    .filter(
      (line) =>
        line.trim().length > 0 && (line.includes(".") || line.includes(":"))
    )
    .map((line) => line.replace(/^\d+\.\s*/, "").trim());
}

export function sanitizeTitle(title: string): string {
  return title.replace(/["']/g, '\\"');
}

export function validateAndCleanContent(content: string): string {
  // Remove any image markdown syntax that might have been generated
  let cleanedContent = content;

  // Remove markdown image syntax: ![alt text](url)
  cleanedContent = cleanedContent.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove any standalone image URLs (http/https links that end with image extensions)
  cleanedContent = cleanedContent.replace(
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi,
    ""
  );

  // Remove any references to placeholder images
  cleanedContent = cleanedContent.replace(/placeholder\.com[^\s]*/gi, "");
  cleanedContent = cleanedContent.replace(/via\.placeholder\.com[^\s]*/gi, "");
  cleanedContent = cleanedContent.replace(
    /example\.com[^\s]*\.(jpg|jpeg|png|gif)/gi,
    ""
  );

  // Remove any HTML img tags that might have been generated
  cleanedContent = cleanedContent.replace(/<img[^>]*>/gi, "");

  // Remove any references to "insert image here" or similar placeholder text
  const placeholderPatterns = [
    /\[insert image here\]/gi,
    /\[image placeholder\]/gi,
    /\[add image\]/gi,
    /\[photo here\]/gi,
    /\(image to be added\)/gi,
    /\(insert photo\)/gi,
  ];

  placeholderPatterns.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, "");
  });

  // Clean up any extra whitespace or empty lines created by removals
  cleanedContent = cleanedContent.replace(/\n\n\n+/g, "\n\n");
  cleanedContent = cleanedContent.trim();

  return cleanedContent;
}

export function hasInvalidImageContent(content: string): boolean {
  // Check if content contains any image-related syntax that shouldn't be there
  const invalidPatterns = [
    /!\[.*?\]\(.*?\)/, // Markdown image syntax
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/i, // Image URLs
    /placeholder\.com/i, // Placeholder image services
    /via\.placeholder\.com/i, // Via placeholder
    /<img[^>]*>/i, // HTML img tags
    /\[insert image here\]/i, // Placeholder text
    /\[image placeholder\]/i, // Placeholder text
    /\[add image\]/i, // Placeholder text
  ];

  return invalidPatterns.some((pattern) => pattern.test(content));
}
