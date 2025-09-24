/**
 * Vertex AI Connector Setup Example
 *
 * This file demonstrates how to configure and use the Vertex AI connector
 * with real Google Cloud credentials for Google AI services testing.
 */

import { VertexAIConnector } from './src/core/vertex-ai-connector.js';

// Example 1: Using Service Account Key File
async function setupWithServiceAccount() {
  const config = {
    projectId: 'your-gcp-project-id',
    location: 'us-central1',
    serviceAccountPath: '/path/to/service-account-key.json',
    maxConcurrentRequests: 5,
    requestTimeout: 30000,
  };

  try {
    const vertexAI = new VertexAIConnector(config);

    // Wait for initialization
    await new Promise((resolve) => {
      vertexAI.once('initialized', resolve);
    });

    console.log('✅ Vertex AI connector initialized successfully');

    // Test with a simple request
    const response = await vertexAI.predict({
      model: 'gemini-2.5-flash',
      instances: ['Hello, Vertex AI!'],
      parameters: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    console.log('✅ Test request successful:', response.predictions[0]);

  } catch (error) {
    console.error('❌ Failed to initialize Vertex AI:', error.message);
  }
}

// Example 2: Using Environment Variables (ADC - Application Default Credentials)
async function setupWithEnvironmentVariables() {
  // Set environment variables (in your shell or .env file):
  // export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
  // export GOOGLE_CLOUD_LOCATION="us-central1"
  // export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

  const config = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    maxConcurrentRequests: 10,
    requestTimeout: 30000,
  };

  try {
    const vertexAI = new VertexAIConnector(config);

    await new Promise((resolve) => {
      vertexAI.once('initialized', resolve);
    });

    console.log('✅ Vertex AI connector initialized with environment credentials');

  } catch (error) {
    console.error('❌ Failed to initialize Vertex AI:', error.message);
  }
}

// Example 3: Using Inline Credentials
async function setupWithInlineCredentials() {
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

  try {
    const vertexAI = new VertexAIConnector(config);

    await new Promise((resolve) => {
      vertexAI.once('initialized', resolve);
    });

    console.log('✅ Vertex AI connector initialized with inline credentials');

  } catch (error) {
    console.error('❌ Failed to initialize Vertex AI:', error.message);
  }
}

// Example 4: Error Handling and Health Checks
async function demonstrateErrorHandling() {
  const config = {
    projectId: 'invalid-project-id',
    location: 'us-central1',
    maxConcurrentRequests: 5,
    requestTimeout: 30000,
  };

  const vertexAI = new VertexAIConnector(config);

  try {
    await new Promise((resolve, reject) => {
      vertexAI.once('initialized', resolve);
      vertexAI.once('error', reject);
    });
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }

  // Health check
  const healthStatus = await vertexAI.healthCheck();
  console.log('Health check result:', healthStatus);
}

// Example 5: Batch Processing
async function demonstrateBatchProcessing() {
  const config = {
    projectId: 'your-gcp-project-id',
    location: 'us-central1',
    serviceAccountPath: '/path/to/service-account-key.json',
  };

  const vertexAI = new VertexAIConnector(config);

  await new Promise((resolve) => {
    vertexAI.once('initialized', resolve);
  });

  // Process multiple requests in batch
  const instances = [
    'What is machine learning?',
    'Explain quantum computing',
    'How does AI work?',
  ];

  const response = await vertexAI.batchPredict(
    'gemini-2.5-flash',
    instances,
    { maxOutputTokens: 100, temperature: 0.7 },
    2, // chunk size
  );

  console.log('✅ Batch processing completed:', response.predictions.length, 'responses');

  response.predictions.forEach((prediction, index) => {
    console.log(`Response ${index + 1}:`, prediction.content.substring(0, 100), '...');
  });
}

// Usage Examples:

// 1. Run with service account file
// setupWithServiceAccount().catch(console.error);

// 2. Run with environment variables
// setupWithEnvironmentVariables().catch(console.error);

// 3. Run with inline credentials
// setupWithInlineCredentials().catch(console.error);

// 4. Demonstrate error handling
// demonstrateErrorHandling().catch(console.error);

// 5. Demonstrate batch processing
// demonstrateBatchProcessing().catch(console.error);

export {
  setupWithServiceAccount,
  setupWithEnvironmentVariables,
  setupWithInlineCredentials,
  demonstrateErrorHandling,
  demonstrateBatchProcessing,
};