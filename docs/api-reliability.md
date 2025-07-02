# API Reliability & Rate Limiting

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

## Testing Rate Limiting

The retry utilities include test functions to verify functionality:

```typescript
import { testRetryFunctionality } from "./src/utils/retryUtils";
await testRetryFunctionality();
``` 