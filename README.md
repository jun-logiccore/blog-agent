# Blog Agent

A TypeScript-based blog post generation agent that creates high-quality, **diverse blog content** using AI and automatically finds relevant cover images with inline images throughout the content.

## Features

- 🤖 AI-powered blog post generation using OpenRouter API
- 📚 **NEW**: Diverse content types beyond just company-focused posts
- 🎯 **NEW**: Industry insights, educational content, and adjacent topics
- 🖼️ **100% Valid Pexels Images**: Only authentic Pexels images with proper attribution
- 📷 **NEW**: Inline images with proper Pexels attribution
- 📝 Enhanced markdown output with comprehensive frontmatter
- 🏷️ **NEW**: Automatic tag and category generation
- 📅 **NEW**: Automatic date stamping
- ⚙️ Configurable generation limits
- 🐛 Comprehensive error handling and logging
- 🏗️ Modular, maintainable architecture
- ✅ **Image Validation**: Strict validation ensures no invalid or placeholder images
- **Rate Limiting & Retry Logic**: Implements exponential backoff for API reliability
- **Duplicate Detection**: Automatically avoids generating duplicate or similar blog post titles
- **Modular Architecture**: Clean, maintainable codebase with proper separation of concerns
- **CLI Interface**: Easy-to-use command line interface with customizable options

## Content Types Generated

The blog agent creates a **diverse mix of content** to engage different audiences:

### 📊 **Content Distribution**

- **Company-Focused (20%)**: Posts about the company, products, services, mission
- **Industry Insights (25%)**: Trends, analysis, news in the company's industry
- **Educational Content (25%)**: How-to guides, tutorials, best practices
- **Adjacent Topics (20%)**: Related subjects that interest the target audience
- **Broader Themes (10%)**: Lifestyle, productivity, general interest content

### 📝 **Example Content for an Eco-Friendly Water Bottle Company**

- **Company**: "Why We Started Our Sustainable Mission"
- **Industry**: "The Future of Sustainable Packaging in 2024"
- **Educational**: "How to Calculate Your Daily Water Intake"
- **Adjacent**: "Zero Waste Kitchen Essentials for Beginners"
- **Broader**: "Morning Routines That Boost Productivity"

This approach creates a **comprehensive content strategy** that:

- Attracts readers who aren't customers yet
- Establishes thought leadership in the industry
- Provides genuine value beyond sales content
- Improves SEO with diverse, relevant topics
- Builds a broader audience base

## Duplicate Detection

The agent automatically prevents duplicate content generation:

### 🔍 **Smart Detection Process**

1. **Scans Existing Posts**: Reads all `.md` files in the `posts/` directory
2. **Extracts Titles**: Parses frontmatter and H1 headings to get existing titles
3. **AI-Informed Generation**: Includes existing titles in the AI prompt to avoid similar topics
4. **Client-Side Filtering**: Additional similarity detection as a safety net
5. **Detailed Logging**: Reports duplicate detection results

### 🎯 **Detection Examples**

```
Existing: "The Future of Sustainable Packaging"

✅ Detected Duplicates:
- "The Future of Sustainable Packaging" (exact match)
- "Future of Sustainable Packaging Solutions" (80%+ similar)

✅ Allowed Variations:
- "The History of Sustainable Packaging" (different focus)
- "Sustainable Packaging Case Studies" (different approach)
```

### ⚙️ **How It Works**

- **Normalization**: Handles punctuation, capitalization, and spacing differences
- **Similarity Threshold**: Detects titles that are 80%+ similar in word content
- **Word Filtering**: Ignores common words (the, a, an, and, or, etc.)
- **Intelligent Matching**: Considers semantic similarity, not just exact matches

### 📊 **Logging Output**

```
ℹ️  Reading existing post titles to avoid duplicates...
ℹ️  Found 15 existing posts to avoid duplicating
ℹ️  Generated 87 blog ideas, 82 after duplicate filtering.
ℹ️  Filtered out 5 duplicate titles
```

## Project Structure

```
src/
├── config/           # Configuration management
│   └── index.ts     # Environment variables and settings
├── generators/       # Content generation logic
│   └── blogGenerator.ts
├── services/         # External API services
│   ├── openRouterService.ts
│   └── pexelsService.ts
├── types/           # TypeScript interfaces
│   └── index.ts
├── utils/           # Utility functions
│   ├── cliUtils.ts  # Command-line argument parsing
│   ├── fileUtils.ts # File operations
│   ├── logger.ts    # Logging utilities
│   └── stringUtils.ts
└── index.ts         # Main application entry point
```

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

3. **Add your API keys to `.env`:**
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   PEXELS_API_KEY=your_pexels_api_key
   ```

## Usage

### Basic Usage

Generate diverse blog posts for a company:

```bash
npm start "a company that sells eco-friendly water bottles"
```

This will generate a mix of:

- Company story and mission posts
- Sustainability industry insights
- Hydration and health education
- Zero-waste lifestyle content
- General productivity and wellness topics

### Advanced Usage

Generate a limited number of posts with verbose logging:

```bash
# Generate specific number of posts
npm start "Your company description" -- --max-posts 5

# Enable verbose logging
npm start "Your company description" -- --verbose

# Combine options
npm start "a tech startup focused on AI solutions" -- --max-posts 10 --verbose
```

### Using the compiled version directly

```bash
# Build the project
npm run build

# Run the compiled version (no -- needed)
node dist/index.js "Your company description" --max-posts 10 --verbose
```

**Important**: When using `npm start`, you must include `--` before the options to pass them through npm to the script.

### Command Line Options

- `--max-posts, -m <number>`: Limit the number of posts to generate
- `--verbose, -v`: Enable detailed logging

## Enhanced Output Format

Generated blog posts now include comprehensive frontmatter and inline images:

```markdown
---
title: "How to Build Sustainable Habits That Actually Stick"
cover_image: "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg"
tags: ["sustainability", "habits", "lifestyle", "productivity"]
category: "lifestyle"
date: "2024-01-15"
---

Building sustainable habits is one of the most impactful ways to create lasting change...

![Relevant Image](https://images.pexels.com/photos/789012/pexels-photo-789012.jpeg)

_Photo by [Photographer Name](https://www.pexels.com/@photographer) on [Pexels](https://www.pexels.com/photo/789012/)_

More content continues...
```

## New Features

### 🎯 **Diverse Content Strategy**

- **Audience Development**: Content that attracts readers beyond existing customers
- **Thought Leadership**: Industry insights and trend analysis
- **Educational Value**: How-to guides and tutorials that provide genuine help
- **SEO Optimization**: Broader topic coverage for better search visibility
- **Content Calendar**: Natural mix of content types for sustained engagement

### 🏷️ **Smart Metadata Generation**

- **Context-Aware Tags**: Tags that match the content type (educational, industry, lifestyle, etc.)
- **Varied Categories**: Beyond just "business" - includes education, industry-insights, how-to, productivity, etc.
- **SEO-Friendly**: Tags and categories optimized for content discovery

### 📷 **Inline Images with Attribution**

- **100% Pexels Images**: All images are guaranteed to be valid Pexels photos
- **Smart Image Placement**: Images are strategically placed throughout the content
- **Pexels Attribution**: Proper credit with photographer name and links
- **Contextual Images**: AI-generated search queries for relevant stock photos
- **No Placeholder Images**: Posts are skipped if no valid Pexels images are found
- **Image Validation**: Multiple validation layers ensure image authenticity

### 📝 **Enhanced Content Generation**

- **Adaptive Tone**: Adjusts writing style based on content type (company voice vs. educational vs. industry expert)
- **Value-First Approach**: Content provides genuine value whether readers are customers or not
- **SEO-Friendly**: Broader topic coverage improves search engine visibility

## Content Examples by Type

### **Educational Content**

- "The Complete Guide to Sustainable Living on a Budget"
- "How to Create a Zero-Waste Office Environment"
- "5 Science-Backed Methods to Stay Hydrated"

### **Industry Insights**

- "The Future of Sustainable Packaging: 2024 Trends"
- "How Circular Economy Principles Are Reshaping Business"
- "Consumer Behavior Shifts Toward Eco-Friendly Products"

### **Adjacent Topics**

- "Minimalist Kitchen Essentials for Eco-Conscious Cooking"
- "The Psychology Behind Habit Formation"
- "Building a Sustainable Workout Routine"

### **Broader Themes**

- "Morning Routines That Boost Daily Productivity"
- "The Art of Mindful Consumption"
- "Creating Work-Life Balance in a Remote World"

## Image Quality Assurance

### Strict Validation Process

1. **API Response Validation**: Ensures Pexels API returns valid photo data
2. **URL Verification**: Confirms all image URLs are from pexels.com domain
3. **HTTPS Enforcement**: Only secure image URLs are accepted
4. **Attribution Validation**: Verifies photographer and attribution URLs
5. **Pre-Save Validation**: Final check before saving any blog post

### Error Handling for Images

- **No Placeholder Images**: Never uses generic placeholder images
- **Graceful Degradation**: Skips posts if no valid cover image is found
- **Optional Inline Images**: Continues without inline images if none are found
- **Detailed Logging**: Reports image search results and validation status

## Architecture

### Services

- **OpenRouterService**: Handles AI content generation, metadata, and image queries with content-type awareness
- **PexelsService**: Manages image search with strict validation and detailed attribution data

### Generators

- **BlogGenerator**: Orchestrates content, metadata, and image generation with validation

### Utilities

- **Config**: Singleton pattern for managing application configuration
- **Logger**: Centralized logging with different levels
- **CLI Utils**: Command-line argument parsing and validation
- **File Utils**: Enhanced markdown generation with frontmatter and inline images
- **String Utils**: Text processing, content validation, and formatting functions

## Error Handling

The application includes comprehensive error handling:

- **Image Validation Failures**: Posts are skipped if images don't meet Pexels standards
- **Content Validation**: Removes any invalid image references from AI-generated content
- **Graceful degradation when image search fails**
- **Fallback metadata generation if AI parsing fails**
- **Detailed error logging with context**
- **Unhandled promise rejection and exception catching**
- **Validation of command-line arguments**

## Development

### Adding New Features

1. **New API Service**: Create a new service class in `src/services/`
2. **New Generator**: Add generator logic in `src/generators/`
3. **New Utils**: Place utility functions in `src/utils/`
4. **New Types**: Define interfaces in `src/types/index.ts`

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## API Requirements

### OpenRouter API

- Used for AI content generation, metadata, and image query generation
- Supports multiple models (default: gpt-4o-mini)
- Generates diverse content types with appropriate context

### Pexels API

- Used for cover images and inline images
- Provides photographer attribution data
- Free tier available with attribution requirements
- **All images must be from Pexels - no external or generated images**

## Contributing

1. Follow the existing code structure and patterns
2. Add proper error handling and logging
3. Update types and documentation as needed
4. Test your changes thoroughly
5. **Ensure all images come from Pexels API with proper validation**
6. Never use placeholder or invalid image URLs
7. Consider content diversity when adding new features

## License

ISC

## API Rate Limiting & Reliability

The agent implements sophisticated rate limiting and retry mechanisms:

### Rate Limiting

- **Pexels API**: Minimum 100ms between requests with request throttling
- **OpenRouter API**: Minimum 200ms between requests
- **Request Tracking**: Monitors API usage and provides statistics

### Retry Logic

- **Exponential Backoff**: Automatically retries failed requests with increasing delays
- **Rate Limit Handling**: Respects `Retry-After` headers from APIs
- **Error Classification**: Distinguishes between retryable (429, 5xx) and non-retryable (4xx) errors
- **Smart Timeouts**: 30-second timeout for OpenRouter, configurable delays for retries

### Error Handling

- **429 Rate Limits**: Automatically waits for the specified retry period
- **Server Errors (5xx)**: Retries with exponential backoff up to 3 times
- **Network Issues**: Handles connection resets, timeouts, and DNS failures
- **Graceful Degradation**: Falls back to safe defaults when APIs are unavailable

## API Usage Monitoring

The agent provides detailed API usage statistics:

```
API Usage - OpenRouter: 15 requests, Pexels: 23 requests
Time since last OpenRouter request: 1250ms
Time since last Pexels request: 890ms
```

## Error Handling Examples

### Rate Limiting

```
⚠️  Retryable error (429): Rate limited by API. Retry after 60000ms (attempt 1/3)
✅  Operation succeeded after 1 retries
```

### Server Errors

```
⚠️  Retryable error (503): Server error (503): Service Unavailable. Retrying in 2.1s (attempt 2/3)
```

### Network Issues

```
⚠️  Network error: ECONNRESET. Retrying in 4.2s (attempt 3/3)
```

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `PEXELS_API_KEY`: Your Pexels API key
- `VERBOSE`: Set to "true" for detailed logging

### Default Settings

- **OpenRouter Model**: `anthropic/claude-3.5-sonnet`
- **Max Retries**: 3 attempts
- **Base Delay**: 1 second (exponential backoff)
- **Max Delay**: 30-60 seconds depending on API

## Development

### Scripts

- `npm start`: Run the application
- `npm run build`: Compile TypeScript
- `npm run dev`: Run in development mode
- `npm run lint`: Type checking
- `npm run clean`: Remove build artifacts

### Testing Rate Limiting

The retry utilities include test functions to verify functionality:

```typescript
import { testRetryFunctionality } from "./src/utils/retryUtils";
await testRetryFunctionality();
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: The agent automatically handles rate limits, but if you see frequent 429 errors, consider:

   - Reducing the number of concurrent posts
   - Using the `--max-posts` flag to limit generation

2. **No Valid Images**: If posts fail due to "no valid Pexels images found":

   - The agent filters out screenshots and app interfaces
   - Try more generic company descriptions
   - Check your Pexels API key validity

3. **Network Timeouts**: For unreliable connections:
   - The agent automatically retries network failures
   - Consider running with `--verbose` to see retry attempts

### Getting Help

If you encounter issues:

1. Run with `--verbose` flag for detailed logging
2. Check the API usage statistics in the logs
3. Verify your API keys are valid and have sufficient quota
