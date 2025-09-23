# Vertex AI Connector Setup Guide

This guide explains how to set up and use the Vertex AI connector with real Google Cloud credentials for comprehensive testing of Google AI services (Imagen4, Veo3, Multi-modal Streaming API).

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud Project with Vertex AI API enabled
2. **Authentication**: One of the following:
   - Service Account Key file
   - Application Default Credentials (ADC)
   - Environment variables

## Installation Requirements

Install the required Google Cloud packages:

```bash
npm install @google-cloud/vertexai google-auth-library
```

## Authentication Methods

### Method 1: Service Account Key File (Recommended for testing)

1. **Create a Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Grant Vertex AI User role

2. **Download Key File**:
   - Create and download the JSON key file
   - Place it in a secure location (e.g., `/path/to/service-account-key.json`)

3. **Configure the Connector**:

```javascript
import { VertexAIConnector } from './src/core/vertex-ai-connector.js';

const config = {
  projectId: 'your-gcp-project-id',
  location: 'us-central1',
  serviceAccountPath: '/path/to/service-account-key.json',
  maxConcurrentRequests: 5,
  requestTimeout: 30000,
};

const vertexAI = new VertexAIConnector(config);
```

### Method 2: Application Default Credentials (ADC)

1. **Set Environment Variables**:

```bash
export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

2. **Configure the Connector**:

```javascript
const config = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  maxConcurrentRequests: 10,
  requestTimeout: 30000,
};

const vertexAI = new VertexAIConnector(config);
```

### Method 3: Inline Credentials

```javascript
const config = {
  projectId: 'your-gcp-project-id',
  location: 'us-central1',
  credentials: {
    type: 'service_account',
    project_id: 'your-gcp-project-id',
    private_key_id: 'your-private-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    client_email: 'your-service-account@your-project.iam.gserviceaccount.com',
    client_id: 'your-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/...',
  },
  maxConcurrentRequests: 5,
  requestTimeout: 30000,
};

const vertexAI = new VertexAIConnector(config);
```

## Usage Examples

### Basic Text Generation

```javascript
const response = await vertexAI.predict({
  model: 'gemini-2.5-flash',
  instances: ['What is machine learning?'],
  parameters: {
    maxOutputTokens: 100,
    temperature: 0.7,
  },
});

console.log(response.predictions[0].content);
```

### Batch Processing

```javascript
const instances = [
  'Explain quantum computing',
  'What is artificial intelligence?',
  'Describe machine learning',
];

const response = await vertexAI.batchPredict(
  'gemini-2.5-flash',
  instances,
  { maxOutputTokens: 100, temperature: 0.7 },
  2, // chunk size
);

console.log('Processed', response.predictions.length, 'requests');
```

### Health Check

```javascript
const healthStatus = await vertexAI.healthCheck();
console.log('Health Status:', healthStatus);
```

## Available Models

The connector supports these Vertex AI models:

| Model | Description | Context Window | Best For |
|-------|-------------|----------------|----------|
| `gemini-2.5-pro` | Advanced reasoning and code | 2M tokens | Complex tasks, coding |
| `gemini-2.5-flash` | Fast responses | 1M tokens | Quick interactions |
| `gemini-2.0-flash` | Balanced performance | 1M tokens | General use |
| `gemini-2.5-deep-think` | Deep reasoning (Preview) | 2M tokens | Complex problem-solving |

## Error Handling

The connector provides comprehensive error handling:

```javascript
try {
  const response = await vertexAI.predict({
    model: 'gemini-2.5-flash',
    instances: ['Hello, Vertex AI!'],
  });

  console.log('Success:', response);
} catch (error) {
  console.error('Error:', error.message);

  // Common error scenarios:
  if (error.message.includes('PERMISSION_DENIED')) {
    console.log('Check your service account permissions');
  } else if (error.message.includes('QUOTA_EXCEEDED')) {
    console.log('API quota exceeded');
  } else if (error.message.includes('INVALID_ARGUMENT')) {
    console.log('Check your request parameters');
  }
}
```

## Performance Monitoring

The connector provides built-in performance monitoring:

```javascript
// Get performance metrics
const metrics = vertexAI.getMetrics();
console.log('Total Requests:', metrics.totalRequests);
console.log('Success Rate:', metrics.successRate);
console.log('Average Latency:', metrics.avgLatency);

// Listen to events
vertexAI.on('request_completed', (data) => {
  console.log('Request completed:', data.model, data.latency + 'ms');
});

vertexAI.on('request_failed', (data) => {
  console.log('Request failed:', data.model, data.error);
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | Required | Your Google Cloud Project ID |
| `location` | string | Required | Vertex AI location (e.g., 'us-central1') |
| `apiEndpoint` | string | Optional | Custom API endpoint |
| `credentials` | object | Optional | Inline credentials |
| `serviceAccountPath` | string | Optional | Path to service account key file |
| `maxConcurrentRequests` | number | 10 | Maximum concurrent requests |
| `requestTimeout` | number | 30000 | Request timeout in milliseconds |

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive configuration
3. **Rotate service account keys** regularly
4. **Grant minimal permissions** to service accounts
5. **Monitor API usage** for unusual activity

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your service account has Vertex AI User permissions
   - Check that your credentials file is valid JSON
   - Ensure the service account key hasn't expired

2. **Quota Errors**:
   - Check your Google Cloud quotas in the console
   - Implement retry logic with exponential backoff
   - Consider upgrading your billing plan

3. **Model Not Found**:
   - Verify the model name is correct
   - Check if the model is available in your region
   - Ensure your project has access to the model

4. **Network Issues**:
   - Check your internet connection
   - Verify firewall settings allow HTTPS traffic
   - Consider using a proxy if needed

### Debugging

Enable detailed logging:

```javascript
// The connector uses the Logger class for debugging
// Set log level to 'debug' for detailed output
const logger = new Logger('VertexAIConnector', 'debug');
```

## Next Steps

1. Set up your Google Cloud Project and authentication
2. Run the example scripts to test connectivity
3. Integrate the connector into your test suites
4. Monitor performance and costs in Google Cloud Console
5. Implement proper error handling and retries

## Support

For issues related to:
- **Google Cloud Setup**: Check [Google Cloud Documentation](https://cloud.google.com/docs)
- **Vertex AI API**: See [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- **Authentication**: Review [Google Auth Library Documentation](https://github.com/googleapis/google-auth-library-nodejs)

## Costs

Vertex AI pricing varies by model and usage. Monitor costs in:
- Google Cloud Console > Billing
- Vertex AI > Monitor > Quotas and limits
- Set up budget alerts for cost control