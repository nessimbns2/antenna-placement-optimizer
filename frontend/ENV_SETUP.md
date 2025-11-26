# Environment Variables Setup

To configure the FastAPI backend URL, create a `.env.local` file in the root directory:

```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
```

Or manually create the file with this content:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Default Configuration

If no `.env.local` file is present, the application defaults to:
- `http://localhost:8000`

## Production Configuration

For production deployments, set:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## Verifying Configuration

The API configuration is defined in `lib/api-config.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  ENDPOINTS: {
    OPTIMIZE: '/api/optimize'
  }
};
```

Full API endpoint: `${BASE_URL}/api/optimize`
