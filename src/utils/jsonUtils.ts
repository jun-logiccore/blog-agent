/**
 * Cleans JSON response data by removing markdown code block wrappers
 * @param data - The raw response data that may contain markdown formatting
 * @returns Cleaned JSON string ready for parsing
 */
export function cleanJsonResponse(data: string): string {
  let jsonData = data.trim();

  // Remove markdown code block wrappers if present
  if (jsonData.startsWith("```json")) {
    jsonData = jsonData.replace(/^```json\s*/, "");
  }
  if (jsonData.startsWith("```")) {
    jsonData = jsonData.replace(/^```\s*/, "");
  }
  if (jsonData.endsWith("```")) {
    jsonData = jsonData.replace(/\s*```$/, "");
  }

  return jsonData;
}

/**
 * Safely parses JSON response data, handling markdown code blocks
 * @param data - The raw response data
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed JSON object or fallback value
 */
export function safeJsonParse<T>(data: string, fallback: T): T {
  try {
    const cleanedData = cleanJsonResponse(data);
    return JSON.parse(cleanedData) as T;
  } catch (error) {
    console.error(`Failed to parse JSON: ${error}`);
    console.debug(`Raw response data: ${data}`);
    return fallback;
  }
}
