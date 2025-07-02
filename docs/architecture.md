# Architecture

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

## Services

- **OpenRouterService**: Handles AI content generation, metadata, and image queries with content-type awareness
- **PexelsService**: Manages image search with strict validation and detailed attribution data

## Generators

- **BlogGenerator**: Orchestrates content, metadata, and image generation with validation

## Utilities

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

### Scripts

- `npm start`: Run the application
- `npm run build`: Compile TypeScript
- `npm run dev`: Run in development mode
- `npm run lint`: Type checking
- `npm run clean`: Remove build artifacts

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