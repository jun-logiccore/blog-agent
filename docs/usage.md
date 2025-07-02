# Usage

## CLI Usage

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

## Docker Usage

### Using the Pre-built Docker Image

The blog agent is available as a Docker image at `ghcr.io/jun-logiccore/blog-agent:main`. This is the easiest way to run the application without setting up the development environment.

#### Prerequisites

- Docker installed on your system
- API keys for OpenRouter and Pexels

#### Basic Usage

```bash
# Run with environment variables
docker run --rm \
  -e OPENROUTER_API_KEY="your_openrouter_api_key" \
  -e PEXELS_API_KEY="your_pexels_api_key" \
  -v $(pwd)/posts:/app/posts \
  ghcr.io/jun-logiccore/blog-agent:main \
  "a company that sells eco-friendly water bottles"
```

#### Advanced Usage

```bash
# Generate specific number of posts with verbose logging
docker run --rm \
  -e OPENROUTER_API_KEY="your_openrouter_api_key" \
  -e PEXELS_API_KEY="your_pexels_api_key" \
  -v $(pwd)/posts:/app/posts \
  ghcr.io/jun-logiccore/blog-agent:main \
  "a tech startup focused on AI solutions" \
  --max-posts 10 \
  --verbose
```

#### Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  blog-agent:
    image: ghcr.io/jun-logiccore/blog-agent:main
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - PEXELS_API_KEY=${PEXELS_API_KEY}
    volumes:
      - ./posts:/app/posts
    command: ["a company that sells eco-friendly water bottles"]
```

Then run:

```bash
# Create .env file with your API keys
echo "OPENROUTER_API_KEY=your_openrouter_api_key" > .env
echo "PEXELS_API_KEY=your_pexels_api_key" >> .env

# Run the container
docker-compose up
```

#### Volume Mounting

The Docker container expects a `posts` directory to be mounted where generated blog posts will be saved:

```bash
# Create posts directory in current location
mkdir -p posts

# Mount it to the container
-v $(pwd)/posts:/app/posts
```

#### Environment Variables

The following environment variables can be set:

- `OPENROUTER_API_KEY` (required): Your OpenRouter API key
- `PEXELS_API_KEY` (required): Your Pexels API key
- `VERBOSE` (optional): Set to "true" for detailed logging

#### Command Line Arguments

All the same command line arguments work with the Docker image:

```bash
# Show help
docker run --rm ghcr.io/jun-logiccore/blog-agent:main --help

# Generate posts with options
docker run --rm \
  -e OPENROUTER_API_KEY="your_key" \
  -e PEXELS_API_KEY="your_key" \
  -v $(pwd)/posts:/app/posts \
  ghcr.io/jun-logiccore/blog-agent:main \
  "your company description" \
  --max-posts 5 \
  --verbose
```

#### Troubleshooting

**Permission Issues**: If you encounter permission issues with the mounted volume:

```bash
# Fix permissions on the posts directory
chmod 755 posts
```

**API Key Issues**: Ensure your API keys are correctly set:

```bash
# Test with a simple command
docker run --rm \
  -e OPENROUTER_API_KEY="your_key" \
  -e PEXELS_API_KEY="your_key" \
  ghcr.io/jun-logiccore/blog-agent:main \
  --help
```

**Network Issues**: If you're behind a corporate firewall, you may need to configure Docker to use your proxy settings. 