# Blog Agent

A TypeScript-based blog post generation agent that creates high-quality, **diverse blog content** using AI and automatically finds relevant cover images with inline images throughout the content.

## Quick Start

### Using Docker (Recommended)

```bash
docker run --rm \
  -e OPENROUTER_API_KEY="your_openrouter_api_key" \
  -e PEXELS_API_KEY="your_pexels_api_key" \
  -v $(pwd)/posts:/app/posts \
  ghcr.io/jun-logiccore/blog-agent:main \
  "a company that sells eco-friendly water bottles"
```

### Using CLI

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your API keys to .env

# Generate blog posts
npm start "a company that sells eco-friendly water bottles"
```

## What It Does

- 🤖 **AI-Powered Content**: Generates diverse blog posts using OpenRouter API
- 📚 **Content Strategy**: Creates company-focused, industry insights, educational, and lifestyle content
- 🖼️ **Professional Images**: Finds relevant Pexels images with proper attribution
- 📷 **Inline Images**: Adds contextual images throughout the content
- 🏷️ **Smart Metadata**: Automatic tags, categories, and SEO optimization
- 🔍 **Duplicate Prevention**: Avoids generating similar content
- ⚡ **Reliable APIs**: Built-in rate limiting and retry logic

## Documentation

- **[Features](docs/features.md)** - Detailed feature overview and content types
- **[Usage](docs/usage.md)** - CLI and Docker usage instructions
- **[Output Format](docs/output-format.md)** - Blog post structure and image handling
- **[Duplicate Detection](docs/duplicate-detection.md)** - How duplicate prevention works
- **[Architecture](docs/architecture.md)** - Project structure and development guide
- **[API Reliability](docs/api-reliability.md)** - Rate limiting and error handling

## Setup

1. **Get API Keys**:
   - [OpenRouter API](https://openrouter.ai/) for AI content generation
   - [Pexels API](https://www.pexels.com/api/) for images

2. **Environment Variables**:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key
   PEXELS_API_KEY=your_pexels_api_key
   ```

## License

MIT 