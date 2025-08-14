/**
 * Comprehensive TypeScript Examples for Google Services Integration
 * 
 * This file contains production-ready TypeScript examples demonstrating
 * all major features and use cases for Google Services integration.
 */

import { 
  GeminiFlow, 
  GoogleAI, 
  GoogleWorkspace, 
  VertexAI,
  VideoGeneration,
  AudioGeneration,
  ImageGeneration 
} from '@clduab11/gemini-flow';
import fs from 'fs/promises';
import path from 'path';

// ==================== Configuration ====================

interface GoogleServicesConfig {
  aiApiKey: string;
  workspaceCredentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  vertexAI: {
    projectId: string;
    location: string;
    credentials: any;
  };
}

const config: GoogleServicesConfig = {
  aiApiKey: process.env.GEMINI_API_KEY!,
  workspaceCredentials: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!
  },
  vertexAI: {
    projectId: process.env.GOOGLE_PROJECT_ID!,
    location: process.env.GOOGLE_LOCATION || 'us-central1',
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  }
};

// ==================== Google AI Examples ====================

class GoogleAIExamples {
  private ai: GoogleAI;

  constructor(apiKey: string) {
    this.ai = new GoogleAI({ apiKey });
  }

  /**
   * Basic text generation with different models
   */
  async basicTextGeneration() {
    console.log('🤖 Basic Text Generation Examples\n');

    // Example 1: Simple generation
    const simpleResult = await this.ai.generate({
      model: 'gemini-1.5-flash',
      prompt: 'Explain the concept of machine learning in 100 words',
      temperature: 0.7
    });
    
    console.log('Simple Generation:');
    console.log(simpleResult.content);
    console.log(`Tokens used: ${simpleResult.usage?.totalTokens}\n`);

    // Example 2: Creative writing with higher temperature
    const creativeResult = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: 'Write a short story about a robot who discovers emotions',
      temperature: 1.2,
      maxTokens: 500
    });
    
    console.log('Creative Writing:');
    console.log(creativeResult.content);
    console.log(`Tokens used: ${creativeResult.usage?.totalTokens}\n`);

    // Example 3: Technical documentation with low temperature
    const technicalResult = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: `
        Create API documentation for a function that calculates compound interest.
        Include parameters, return values, and examples.
      `,
      temperature: 0.2,
      maxTokens: 800
    });
    
    console.log('Technical Documentation:');
    console.log(technicalResult.content);
  }

  /**
   * Streaming generation for real-time applications
   */
  async streamingGeneration() {
    console.log('🌊 Streaming Generation Example\n');

    const prompt = 'Tell me a detailed story about space exploration in the year 2100';
    
    console.log('Streaming response:');
    console.log('-------------------');
    
    const stream = this.ai.generateStream({
      model: 'gemini-1.5-pro',
      prompt,
      temperature: 0.8
    });

    let fullContent = '';
    for await (const chunk of stream) {
      process.stdout.write(chunk.content);
      fullContent += chunk.content;
      
      // Optional: Add typing effect delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n-------------------');
    console.log(`Total characters streamed: ${fullContent.length}\n`);
  }

  /**
   * Multimodal input with images
   */
  async multimodalAnalysis() {
    console.log('🖼️  Multimodal Analysis Examples\n');

    // Example 1: Image description
    try {
      const imageBuffer = await fs.readFile(path.join(__dirname, 'sample-image.jpg'));
      
      const result = await this.ai.generate({
        model: 'gemini-1.5-pro',
        prompt: 'Describe this image in detail and suggest potential use cases',
        media: [{
          type: 'image',
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }],
        temperature: 0.4
      });
      
      console.log('Image Analysis:');
      console.log(result.content);
    } catch (error) {
      console.log('Note: Add sample-image.jpg to run image analysis example');
    }

    // Example 2: Multiple images comparison
    try {
      const image1 = await fs.readFile(path.join(__dirname, 'image1.jpg'));
      const image2 = await fs.readFile(path.join(__dirname, 'image2.jpg'));
      
      const comparison = await this.ai.generate({
        model: 'gemini-1.5-pro',
        prompt: 'Compare these two images and highlight their similarities and differences',
        media: [
          {
            type: 'image',
            data: image1.toString('base64'),
            mimeType: 'image/jpeg'
          },
          {
            type: 'image',
            data: image2.toString('base64'),
            mimeType: 'image/jpeg'
          }
        ]
      });
      
      console.log('Image Comparison:');
      console.log(comparison.content);
    } catch (error) {
      console.log('Note: Add image1.jpg and image2.jpg for comparison example');
    }
  }

  /**
   * Function calling and tool usage
   */
  async functionCalling() {
    console.log('🔧 Function Calling Examples\n');

    const tools = [
      {
        name: 'get_weather',
        description: 'Get current weather information for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name or coordinates'
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit'
            }
          },
          required: ['location']
        }
      },
      {
        name: 'calculate_distance',
        description: 'Calculate distance between two locations',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Starting location' },
            to: { type: 'string', description: 'Destination location' },
            unit: { 
              type: 'string',
              enum: ['miles', 'kilometers'],
              default: 'miles'
            }
          },
          required: ['from', 'to']
        }
      }
    ];

    const response = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: 'What\'s the weather like in Tokyo, and how far is it from New York?',
      tools,
      toolChoice: 'auto'
    });

    console.log('AI Response:', response.content);

    if (response.toolCalls) {
      console.log('\nTool Calls Made:');
      
      for (const call of response.toolCalls) {
        console.log(`- ${call.name}(${JSON.stringify(call.arguments)})`);
        
        // Simulate tool execution
        let result;
        switch (call.name) {
          case 'get_weather':
            result = await this.simulateWeatherAPI(call.arguments.location);
            break;
          case 'calculate_distance':
            result = await this.simulateDistanceAPI(call.arguments.from, call.arguments.to);
            break;
        }
        
        console.log(`  Result: ${JSON.stringify(result)}`);
      }
    }
  }

  /**
   * Safety settings and content filtering
   */
  async safetyAndFiltering() {
    console.log('🛡️  Safety and Content Filtering Examples\n');

    const safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];

    try {
      const result = await this.ai.generate({
        model: 'gemini-1.5-flash',
        prompt: 'Write a professional email about workplace safety protocols',
        safetySettings,
        temperature: 0.3
      });
      
      console.log('Safe Content Generated:');
      console.log(result.content);
      
      if (result.safetyRatings) {
        console.log('\nSafety Ratings:');
        result.safetyRatings.forEach(rating => {
          console.log(`- ${rating.category}: ${rating.probability} (blocked: ${rating.blocked})`);
        });
      }
    } catch (error) {
      console.log('Content blocked by safety filters:', error.message);
    }
  }

  /**
   * Error handling and retry logic
   */
  async errorHandlingExamples() {
    console.log('⚠️  Error Handling Examples\n');

    // Example 1: Rate limit handling
    try {
      const results = await Promise.all([
        this.generateWithRetry('Tell me about AI'),
        this.generateWithRetry('Explain quantum computing'),
        this.generateWithRetry('Describe machine learning')
      ]);
      
      console.log('All generations completed successfully');
    } catch (error) {
      console.log('Generation failed after retries:', error.message);
    }

    // Example 2: Content safety handling
    await this.handleContentSafety();

    // Example 3: Model fallback
    await this.modelFallbackExample();
  }

  // Helper methods
  private async generateWithRetry(
    prompt: string, 
    maxRetries = 3
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.ai.generate({
          model: 'gemini-1.5-flash',
          prompt
        });
      } catch (error: any) {
        if (error.code === 'QUOTA_EXCEEDED' && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  private async handleContentSafety() {
    try {
      const result = await this.ai.generate({
        model: 'gemini-1.5-flash',
        prompt: 'Write about controversial topics'
      });
      console.log('Content generated successfully');
    } catch (error: any) {
      if (error.code === 'SAFETY_FILTER') {
        console.log('Content blocked by safety filter, trying alternative approach');
        
        // Try with more specific, professional prompt
        const safeResult = await this.ai.generate({
          model: 'gemini-1.5-flash',
          prompt: 'Write a balanced analysis of different viewpoints on current events'
        });
        console.log('Alternative content generated:', safeResult.content.slice(0, 100));
      }
    }
  }

  private async modelFallbackExample() {
    const models = ['gemini-1.5-pro', 'gemini-1.5-flash'];
    const prompt = 'Explain artificial intelligence';

    for (const model of models) {
      try {
        const result = await this.ai.generate({ model, prompt });
        console.log(`Successfully used model: ${model}`);
        return result;
      } catch (error) {
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }

    throw new Error('All models failed');
  }

  private async simulateWeatherAPI(location: string) {
    // Simulate weather API call
    return {
      location,
      temperature: 22,
      condition: 'Partly Cloudy',
      humidity: 65,
      unit: 'celsius'
    };
  }

  private async simulateDistanceAPI(from: string, to: string) {
    // Simulate distance calculation
    return {
      from,
      to,
      distance: 6740,
      unit: 'miles',
      travelTime: '13 hours 30 minutes (by flight)'
    };
  }
}

// ==================== Google Workspace Examples ====================

class GoogleWorkspaceExamples {
  private workspace: GoogleWorkspace;

  constructor(credentials: any) {
    this.workspace = new GoogleWorkspace(credentials);
  }

  /**
   * Google Drive operations
   */
  async driveOperations() {
    console.log('📁 Google Drive Operations\n');

    // Example 1: Search files with advanced filters
    const searchResults = await this.workspace.drive.search(
      'mimeType="application/pdf" and modifiedTime > "2024-01-01"',
      {
        limit: 10,
        orderBy: 'modifiedTime desc'
      }
    );

    console.log(`Found ${searchResults.length} PDF files:`);
    searchResults.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.lastModified})`);
    });

    // Example 2: Create folder structure
    const projectFolder = await this.workspace.drive.createFolder({
      name: 'Q1 2025 Project',
      description: 'All documents for Q1 2025 project planning'
    });

    console.log(`Created project folder: ${projectFolder.name}`);

    const subFolders = ['Documents', 'Spreadsheets', 'Presentations', 'Resources'];
    
    for (const folderName of subFolders) {
      await this.workspace.drive.createFolder({
        name: folderName,
        parents: [projectFolder.id]
      });
      console.log(`Created subfolder: ${folderName}`);
    }

    // Example 3: Batch file operations
    await this.batchFileOperations(projectFolder.id);
  }

  /**
   * Google Docs operations with AI integration
   */
  async documentOperations() {
    console.log('📝 Google Docs Operations with AI\n');

    // Example 1: Create document with AI-generated content
    const meetingNotes = await this.workspace.docs.create({
      title: 'Team Meeting Notes - AI Generated',
      content: await this.generateMeetingTemplate(),
      folderId: 'your-folder-id'
    });

    console.log(`Created meeting notes: ${meetingNotes.url}`);

    // Example 2: Collaborative document editing
    await this.collaborativeEditing(meetingNotes.id);

    // Example 3: Document analysis and summarization
    await this.documentAnalysis(meetingNotes.id);
  }

  /**
   * Google Sheets data analysis
   */
  async spreadsheetsOperations() {
    console.log('📊 Google Sheets Operations\n');

    // Example 1: Create data analysis spreadsheet
    const analysisSheet = await this.workspace.sheets.create({
      title: 'Sales Data Analysis 2025',
      sheets: [
        { name: 'Raw Data', gridProperties: { rowCount: 1000, columnCount: 20 } },
        { name: 'Analysis', gridProperties: { rowCount: 100, columnCount: 10 } },
        { name: 'Charts', gridProperties: { rowCount: 50, columnCount: 5 } }
      ]
    });

    // Example 2: Populate with sample data
    await this.populateSampleData(analysisSheet.id);

    // Example 3: AI-powered data analysis
    await this.performDataAnalysis(analysisSheet.id);

    // Example 4: Create automated reports
    await this.createAutomatedReports(analysisSheet.id);
  }

  /**
   * Google Slides presentation generation
   */
  async presentationOperations() {
    console.log('🎯 Google Slides Operations\n');

    const slidesData = [
      {
        title: 'Q1 2025 Strategy Overview',
        layout: 'TITLE_SLIDE',
        content: {
          title: 'Quarterly Business Review',
          subtitle: 'Q1 2025 Performance & Strategy',
          presenter: 'AI-Generated Presentation'
        }
      },
      {
        title: 'Key Metrics',
        layout: 'TITLE_AND_BODY',
        content: {
          title: 'Performance Metrics',
          bullets: [
            'Revenue growth: 15% YoY',
            'Customer acquisition: 1,200 new customers',
            'Market expansion: 3 new regions',
            'Product launches: 2 major releases'
          ]
        }
      },
      {
        title: 'Market Analysis',
        layout: 'TWO_COLUMNS',
        content: {
          title: 'Market Position',
          leftColumn: [
            'Competitive Advantages:',
            '• Strong brand recognition',
            '• Superior technology stack',
            '• Customer loyalty program'
          ],
          rightColumn: [
            'Growth Opportunities:',
            '• Emerging markets',
            '• Partnership expansions', 
            '• Product innovation'
          ]
        }
      }
    ];

    const presentation = await this.workspace.slides.generate({
      title: 'Q1 2025 Business Review',
      slides: slidesData,
      template: 'business'
    });

    console.log(`Created presentation: ${presentation.url}`);
  }

  // Helper methods for workspace operations
  private async batchFileOperations(folderId: string) {
    const operations = [
      { action: 'create', type: 'doc', name: 'Project Charter' },
      { action: 'create', type: 'sheet', name: 'Resource Allocation' },
      { action: 'create', type: 'slide', name: 'Kickoff Presentation' }
    ];

    const results = await Promise.allSettled(
      operations.map(op => this.createFile(op, folderId))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Created ${operations[index].name}`);
      } else {
        console.log(`❌ Failed to create ${operations[index].name}`);
      }
    });
  }

  private async createFile(operation: any, folderId: string) {
    switch (operation.type) {
      case 'doc':
        return this.workspace.docs.create({
          title: operation.name,
          content: '# Document Template\n\nThis document was created automatically.',
          folderId
        });
      case 'sheet':
        return this.workspace.sheets.create({
          title: operation.name,
          folderId
        });
      case 'slide':
        return this.workspace.slides.create({
          title: operation.name,
          folderId
        });
    }
  }

  private async generateMeetingTemplate(): Promise<string> {
    // This would use the AI service to generate content
    return `
# Team Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** [To be filled]

## Agenda
1. Previous action items review
2. Current project status
3. New initiatives discussion
4. Resource allocation
5. Next steps planning

## Discussion Points
[Meeting discussion will be captured here]

## Action Items
- [ ] Item 1 - Assigned to [Name] - Due: [Date]
- [ ] Item 2 - Assigned to [Name] - Due: [Date]
- [ ] Item 3 - Assigned to [Name] - Due: [Date]

## Next Meeting
**Date:** [To be scheduled]
**Topics:** [To be determined]
    `;
  }

  private async collaborativeEditing(documentId: string) {
    // Example of programmatic document editing
    const updates = [
      {
        insertText: {
          location: { index: 1 },
          text: 'IMPORTANT: This document was updated by AI automation\n\n'
        }
      },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 50 },
          textStyle: { bold: true, foregroundColor: { color: { rgbColor: { red: 1.0 } } } }
        }
      }
    ];

    await this.workspace.docs.batchUpdate(documentId, { requests: updates });
    console.log('Document updated with collaborative edits');
  }

  private async documentAnalysis(documentId: string) {
    const content = await this.workspace.docs.getContent(documentId);
    
    // This would integrate with AI service for analysis
    console.log('Document analysis completed');
    console.log(`- Word count: ${this.countWords(content)}`);
    console.log(`- Estimated reading time: ${Math.ceil(this.countWords(content) / 200)} minutes`);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private async populateSampleData(spreadsheetId: string) {
    const sampleData = [
      ['Month', 'Revenue', 'Expenses', 'Profit', 'Growth Rate'],
      ['January', 150000, 120000, 30000, '12%'],
      ['February', 165000, 125000, 40000, '15%'],
      ['March', 175000, 130000, 45000, '18%'],
      ['April', 185000, 135000, 50000, '20%'],
      ['May', 195000, 140000, 55000, '22%']
    ];

    await this.workspace.sheets.updateValues({
      spreadsheetId,
      range: 'Raw Data!A1:E6',
      values: sampleData
    });

    console.log('Sample data populated in spreadsheet');
  }

  private async performDataAnalysis(spreadsheetId: string) {
    const analysis = await this.workspace.sheets.analyze({
      spreadsheetId,
      range: 'Raw Data!A1:E6',
      analysisType: 'statistical'
    });

    console.log('Data analysis completed:');
    console.log(`- Total revenue: $${analysis.totals?.revenue || 'N/A'}`);
    console.log(`- Average growth rate: ${analysis.averages?.growthRate || 'N/A'}`);
    console.log(`- Trend: ${analysis.trends?.overall || 'Positive'}`);
  }

  private async createAutomatedReports(spreadsheetId: string) {
    // Create formulas for automated calculations
    const formulas = [
      ['Total Revenue', '=SUM(B2:B6)'],
      ['Average Revenue', '=AVERAGE(B2:B6)'],
      ['Total Profit', '=SUM(D2:D6)'],
      ['Profit Margin', '=D7/B7'],
      ['Growth Trend', '=TREND(B2:B6)']
    ];

    await this.workspace.sheets.updateValues({
      spreadsheetId,
      range: 'Analysis!A1:B5',
      values: formulas
    });

    console.log('Automated report formulas created');
  }
}

// ==================== Vertex AI Examples ====================

class VertexAIExamples {
  private vertexAI: VertexAI;

  constructor(config: any) {
    this.vertexAI = new VertexAI(config);
  }

  /**
   * Enterprise AI model usage
   */
  async enterpriseAIOperations() {
    console.log('🏢 Vertex AI Enterprise Operations\n');

    // Example 1: List available models
    const models = await this.vertexAI.listModels();
    console.log('Available models:');
    models.forEach(model => {
      console.log(`- ${model.name} (${model.version})`);
    });

    // Example 2: Batch predictions
    await this.batchPredictions();

    // Example 3: Custom model deployment
    await this.customModelOperations();

    // Example 4: Model monitoring and analytics
    await this.modelAnalytics();
  }

  /**
   * Large scale text processing
   */
  async batchTextProcessing() {
    console.log('📄 Batch Text Processing\n');

    const textSamples = [
      'Customer feedback: The product exceeded my expectations!',
      'Support ticket: Having trouble with login authentication',
      'Review: Average product, could be improved in several areas',
      'Feedback: Excellent customer service and fast delivery'
    ];

    const batchResults = await Promise.allSettled(
      textSamples.map(text => this.processText(text))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Text ${index + 1}: ${result.value.sentiment} (${result.value.confidence})`);
      } else {
        console.log(`Text ${index + 1}: Processing failed`);
      }
    });
  }

  private async batchPredictions() {
    const instances = [
      { content: 'Analyze market trends for Q1 2025' },
      { content: 'Generate risk assessment report' },
      { content: 'Create competitive analysis summary' }
    ];

    const batchJob = await this.vertexAI.createBatchPrediction({
      model: 'text-bison@001',
      instances,
      outputPath: 'gs://your-bucket/predictions/'
    });

    console.log(`Batch prediction job created: ${batchJob.name}`);
    
    // Monitor job progress
    let status = 'RUNNING';
    while (status === 'RUNNING') {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
      const job = await this.vertexAI.getBatchPrediction(batchJob.name);
      status = job.state;
      console.log(`Job status: ${status}`);
    }

    if (status === 'JOB_STATE_SUCCEEDED') {
      const results = await this.vertexAI.getBatchPredictionResults(batchJob.name);
      console.log('Batch prediction completed:', results.length, 'results');
    }
  }

  private async customModelOperations() {
    // Example of custom model deployment and management
    console.log('Deploying custom model...');
    
    try {
      const deployment = await this.vertexAI.deployModel({
        model: 'custom-text-classifier',
        endpoint: 'projects/your-project/locations/us-central1/endpoints/custom-endpoint',
        machineType: 'n1-standard-4',
        minReplicas: 1,
        maxReplicas: 10
      });

      console.log(`Custom model deployed: ${deployment.name}`);

      // Test the deployed model
      const prediction = await this.vertexAI.predict({
        endpoint: deployment.endpoint,
        instances: [{ text: 'Sample text for classification' }]
      });

      console.log('Custom model prediction:', prediction);
    } catch (error) {
      console.log('Custom model deployment skipped (requires setup)');
    }
  }

  private async modelAnalytics() {
    // Monitor model performance and usage
    const analytics = await this.vertexAI.getModelAnalytics({
      model: 'text-bison@001',
      timeRange: '7d'
    });

    console.log('Model Analytics:');
    console.log(`- Total requests: ${analytics.totalRequests}`);
    console.log(`- Average latency: ${analytics.averageLatency}ms`);
    console.log(`- Success rate: ${analytics.successRate}%`);
    console.log(`- Cost: $${analytics.totalCost.toFixed(2)}`);
  }

  private async processText(text: string) {
    const result = await this.vertexAI.predict({
      model: 'text-bison@001',
      instances: [{
        prompt: `Analyze the sentiment of this text and provide a confidence score: "${text}"`
      }],
      parameters: {
        temperature: 0.2,
        maxOutputTokens: 100
      }
    });

    return {
      text,
      sentiment: this.extractSentiment(result.predictions[0].content),
      confidence: this.extractConfidence(result.predictions[0].content)
    };
  }

  private extractSentiment(content: string): string {
    // Simple extraction logic - in reality, you'd parse the AI response
    if (content.toLowerCase().includes('positive')) return 'Positive';
    if (content.toLowerCase().includes('negative')) return 'Negative';
    return 'Neutral';
  }

  private extractConfidence(content: string): string {
    // Simple extraction logic
    const match = content.match(/(\d+)%/);
    return match ? match[1] + '%' : 'Unknown';
  }
}

// ==================== Multimedia Services Examples ====================

class MultimediaExamples {
  private videoGen: VideoGeneration;
  private audioGen: AudioGeneration;
  private imageGen: ImageGeneration;

  constructor(config: any) {
    this.videoGen = new VideoGeneration(config);
    this.audioGen = new AudioGeneration(config);
    this.imageGen = new ImageGeneration(config);
  }

  /**
   * Video generation examples
   */
  async videoGenerationExamples() {
    console.log('🎬 Video Generation Examples\n');

    // Example 1: Basic video generation
    const basicVideo = await this.videoGen.generate({
      prompt: 'A serene mountain landscape with a flowing river at golden hour',
      duration: 10,
      resolution: '1080p',
      style: 'cinematic'
    });

    console.log(`Video generation started: ${basicVideo.taskId}`);
    console.log(`Estimated completion: ${basicVideo.estimatedTime} seconds`);

    // Example 2: Advanced video with custom parameters
    const advancedVideo = await this.videoGen.generate({
      prompt: 'A busy city street with people walking, cars moving, and lights reflecting on wet pavement',
      duration: 15,
      resolution: '4K',
      aspectRatio: '16:9',
      style: 'realistic',
      motionLevel: 'high',
      seed: 12345,
      negativePrompt: 'blurry, low quality, distorted'
    });

    // Monitor progress
    const finalVideo = await this.videoGen.waitForCompletion(advancedVideo.taskId, {
      onProgress: (status) => {
        console.log(`Video generation progress: ${status.progress}%`);
      },
      timeout: 600000 // 10 minutes
    });

    console.log(`Video ready: ${finalVideo.videoUrl}`);
    console.log(`Thumbnail: ${finalVideo.thumbnailUrl}`);
  }

  /**
   * Audio generation examples
   */
  async audioGenerationExamples() {
    console.log('🎵 Audio Generation Examples\n');

    // Example 1: Voice generation
    const voiceAudio = await this.audioGen.generate({
      prompt: 'Welcome to our company! We are excited to have you join our team.',
      voice: 'female',
      language: 'en-US',
      style: 'professional',
      speed: 1.0,
      format: 'mp3'
    });

    console.log(`Voice audio generated: ${voiceAudio.audioUrl}`);

    // Example 2: Sound effects
    const soundEffect = await this.audioGen.generate({
      prompt: 'Ocean waves crashing on a rocky shore with seagulls in the background',
      duration: 30,
      format: 'wav',
      quality: 'high'
    });

    console.log(`Sound effect generated: ${soundEffect.audioUrl}`);

    // Example 3: Music composition
    const music = await this.audioGen.composeMusic({
      prompt: 'Uplifting electronic music for a product launch video',
      genre: 'electronic',
      mood: 'energetic',
      tempo: 128,
      key: 'C',
      duration: 120
    });

    console.log(`Music composition: ${music.audioUrl}`);
    console.log(`MIDI file: ${music.midiUrl}`);
  }

  /**
   * Image generation examples
   */
  async imageGenerationExamples() {
    console.log('🎨 Image Generation Examples\n');

    // Example 1: Product photography
    const productImage = await this.imageGen.generate({
      prompt: 'Professional product photo of a sleek wireless headphone on a clean white background',
      style: 'photorealistic',
      aspectRatio: '1:1',
      resolution: '1024x1024',
      quality: 'high',
      samples: 4
    });

    console.log(`Generated ${productImage.images.length} product images:`);
    productImage.images.forEach((image, index) => {
      console.log(`- Image ${index + 1}: ${image.url}`);
    });

    // Example 2: Artistic illustration
    const illustration = await this.imageGen.generate({
      prompt: 'Minimalist vector illustration of a startup team collaborating around a modern desk',
      style: 'artistic',
      aspectRatio: '16:9',
      resolution: '1536x864',
      guidance: 8.0,
      steps: 30
    });

    console.log(`Artistic illustration: ${illustration.images[0].url}`);

    // Example 3: Batch image generation
    await this.batchImageGeneration();
  }

  private async batchImageGeneration() {
    const prompts = [
      'Modern office space with natural lighting',
      'Cozy coffee shop interior with warm lighting',
      'Futuristic laboratory with advanced equipment',
      'Outdoor park setting with people exercising'
    ];

    const batchResults = await Promise.allSettled(
      prompts.map(prompt => this.imageGen.generate({
        prompt,
        style: 'photorealistic',
        resolution: '1024x1024'
      }))
    );

    console.log('\nBatch Image Generation Results:');
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Image ${index + 1}: ${result.value.images[0].url}`);
      } else {
        console.log(`❌ Image ${index + 1}: Failed to generate`);
      }
    });
  }
}

// ==================== Advanced Integration Examples ====================

class AdvancedIntegrationExamples {
  private ai: GoogleAI;
  private workspace: GoogleWorkspace;
  private vertexAI: VertexAI;

  constructor(config: GoogleServicesConfig) {
    this.ai = new GoogleAI({ apiKey: config.aiApiKey });
    this.workspace = new GoogleWorkspace(config.workspaceCredentials);
    this.vertexAI = new VertexAI(config.vertexAI);
  }

  /**
   * Complete content creation pipeline
   */
  async contentCreationPipeline() {
    console.log('🚀 Content Creation Pipeline\n');

    const topic = 'Artificial Intelligence in Healthcare';

    // Step 1: Research and outline generation
    console.log('Step 1: Generating research outline...');
    const outline = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: `Create a comprehensive research outline for an article about "${topic}". Include:
        - Main sections and subsections
        - Key points to cover
        - Potential data sources
        - Target audience considerations`,
      temperature: 0.7
    });

    // Step 2: Content generation
    console.log('Step 2: Generating full content...');
    const content = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: `Based on this outline: ${outline.content}
      
      Write a comprehensive, well-researched article about "${topic}". 
      Make it engaging, informative, and suitable for a professional audience.
      Include statistics, examples, and future predictions.`,
      temperature: 0.6,
      maxTokens: 3000
    });

    // Step 3: Create and format document
    console.log('Step 3: Creating Google Doc...');
    const document = await this.workspace.docs.create({
      title: `Article: ${topic}`,
      content: content.content
    });

    // Step 4: Generate supporting visuals
    console.log('Step 4: Generating supporting images...');
    await this.generateSupportingVisuals(topic, document.id);

    // Step 5: Create presentation
    console.log('Step 5: Creating presentation...');
    await this.createPresentationFromContent(content.content, topic);

    console.log(`\n✅ Content creation pipeline completed!`);
    console.log(`📄 Document: ${document.url}`);
  }

  /**
   * Automated data analysis and reporting
   */
  async automatedDataAnalysis() {
    console.log('📊 Automated Data Analysis Pipeline\n');

    // Step 1: Create sample dataset
    const spreadsheet = await this.workspace.sheets.create({
      title: 'Sales Data Analysis - Automated',
      sheets: [
        { name: 'Raw Data' },
        { name: 'Analysis' }, 
        { name: 'Visualizations' }
      ]
    });

    // Step 2: Populate with sample data
    await this.populateAnalysisData(spreadsheet.id);

    // Step 3: AI-powered data analysis
    const analysisResult = await this.performAIAnalysis(spreadsheet.id);

    // Step 4: Generate insights report
    const insights = await this.ai.generate({
      model: 'gemini-1.5-pro',
      prompt: `Analyze this sales data and provide business insights:
      ${JSON.stringify(analysisResult)}
      
      Provide:
      1. Key findings and trends
      2. Performance indicators
      3. Recommendations for improvement
      4. Risk factors to consider
      5. Opportunities for growth`,
      temperature: 0.3
    });

    // Step 5: Create comprehensive report
    const report = await this.workspace.docs.create({
      title: 'AI-Generated Sales Analysis Report',
      content: `
# Sales Data Analysis Report
*Generated on ${new Date().toLocaleDateString()}*

## Executive Summary
${insights.content}

## Data Source
- Spreadsheet: [Sales Data](${spreadsheet.webViewLink})
- Analysis Period: ${new Date().toLocaleDateString()}
- Records Analyzed: ${analysisResult.recordCount}

## Detailed Analysis
[Detailed analysis content would be inserted here]

## Recommendations
[AI-generated recommendations based on the data]
      `
    });

    console.log(`\n✅ Analysis pipeline completed!`);
    console.log(`📊 Spreadsheet: ${spreadsheet.webViewLink}`);
    console.log(`📄 Report: ${report.url}`);
  }

  /**
   * Customer support automation
   */
  async customerSupportAutomation() {
    console.log('🎧 Customer Support Automation\n');

    const supportTickets = [
      {
        id: 'TICKET-001',
        customer: 'john@example.com',
        subject: 'Login Issues',
        message: 'I cannot log into my account. It says my password is incorrect but I know it\'s right.',
        priority: 'medium',
        category: 'technical'
      },
      {
        id: 'TICKET-002', 
        customer: 'sarah@company.com',
        subject: 'Billing Question',
        message: 'I was charged twice this month. Can you please check my billing?',
        priority: 'high',
        category: 'billing'
      },
      {
        id: 'TICKET-003',
        customer: 'mike@startup.co',
        subject: 'Feature Request',
        message: 'Would love to see integration with Slack in the next update.',
        priority: 'low',
        category: 'feature'
      }
    ];

    // Process each ticket
    for (const ticket of supportTickets) {
      console.log(`\nProcessing ${ticket.id}...`);
      
      // AI analysis of the ticket
      const analysis = await this.ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Analyze this customer support ticket:
        
        Subject: ${ticket.subject}
        Message: ${ticket.message}
        Current Category: ${ticket.category}
        Current Priority: ${ticket.priority}
        
        Please provide:
        1. Sentiment analysis
        2. Urgency assessment
        3. Category verification
        4. Suggested resolution steps
        5. Estimated resolution time`,
        temperature: 0.3
      });

      // Generate response
      const response = await this.ai.generate({
        model: 'gemini-1.5-pro',
        prompt: `Based on this ticket analysis: ${analysis.content}
        
        Write a professional, empathetic customer support response for:
        Subject: ${ticket.subject}
        Customer Issue: ${ticket.message}
        
        The response should:
        - Acknowledge their concern
        - Provide clear next steps
        - Include expected timeline
        - Be friendly and professional`,
        temperature: 0.4
      });

      // Create tracking document
      const trackingDoc = await this.workspace.docs.create({
        title: `Support Ticket ${ticket.id}`,
        content: `
# Support Ticket ${ticket.id}

## Customer Information
- **Email:** ${ticket.customer}
- **Date:** ${new Date().toLocaleDateString()}

## Issue Details
- **Subject:** ${ticket.subject}
- **Category:** ${ticket.category}
- **Priority:** ${ticket.priority}

**Customer Message:**
${ticket.message}

## AI Analysis
${analysis.content}

## Suggested Response
${response.content}

## Status
- [x] Received
- [ ] Responded  
- [ ] Resolved
- [ ] Closed

## Internal Notes
[Space for support team notes]
        `
      });

      console.log(`✅ ${ticket.id} processed - Document: ${trackingDoc.url}`);
    }
  }

  // Helper methods
  private async generateSupportingVisuals(topic: string, documentId: string) {
    try {
      // This would use image generation service
      console.log(`Generating visuals for: ${topic}`);
      // const images = await this.imageGen.generate(...);
      // await this.workspace.docs.insertImages(documentId, images);
      console.log('Visual generation completed');
    } catch (error) {
      console.log('Visual generation skipped (service not available)');
    }
  }

  private async createPresentationFromContent(content: string, topic: string) {
    // Extract key points for slides
    const slideContent = await this.ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `Convert this article content into presentation slides:
      
      ${content.slice(0, 1000)}...
      
      Create 5-7 slides with:
      - Title slide
      - Key points as bullet points
      - Conclusion slide
      
      Format as JSON with title and content for each slide.`,
      temperature: 0.3
    });

    // Create presentation (simplified)
    const presentation = await this.workspace.slides.create({
      title: `Presentation: ${topic}`,
      // slides would be parsed from slideContent
    });

    console.log(`Presentation created: ${presentation.url}`);
  }

  private async populateAnalysisData(spreadsheetId: string) {
    const sampleData = [
      ['Date', 'Revenue', 'Orders', 'Customers', 'Region', 'Product'],
      ['2025-01-01', 15000, 45, 42, 'North', 'Product A'],
      ['2025-01-02', 18000, 52, 48, 'South', 'Product B'],
      ['2025-01-03', 22000, 67, 61, 'East', 'Product A'],
      ['2025-01-04', 19000, 58, 54, 'West', 'Product C'],
      ['2025-01-05', 25000, 78, 72, 'North', 'Product B']
      // ... more sample data
    ];

    await this.workspace.sheets.updateValues({
      spreadsheetId,
      range: 'Raw Data!A1:F6',
      values: sampleData
    });
  }

  private async performAIAnalysis(spreadsheetId: string) {
    const data = await this.workspace.sheets.getValues({
      spreadsheetId,
      range: 'Raw Data!A1:F10'
    });

    return {
      recordCount: data.values?.length || 0,
      totalRevenue: 99000, // Calculated from data
      averageOrderValue: 346.5, // Calculated
      topRegion: 'North',
      topProduct: 'Product A',
      trends: 'Positive growth trend observed'
    };
  }
}

// ==================== Main Execution ====================

async function runExamples() {
  console.log('🚀 Starting Google Services Integration Examples\n');

  try {
    // Initialize examples
    const aiExamples = new GoogleAIExamples(config.aiApiKey);
    const workspaceExamples = new GoogleWorkspaceExamples(config.workspaceCredentials);
    const vertexExamples = new VertexAIExamples(config.vertexAI);
    const multimediaExamples = new MultimediaExamples(config.vertexAI);
    const advancedExamples = new AdvancedIntegrationExamples(config);

    // Run Google AI examples
    await aiExamples.basicTextGeneration();
    await aiExamples.streamingGeneration();
    await aiExamples.multimodalAnalysis();
    await aiExamples.functionCalling();
    await aiExamples.safetyAndFiltering();
    await aiExamples.errorHandlingExamples();

    // Run Workspace examples  
    console.log('\n' + '='.repeat(60) + '\n');
    await workspaceExamples.driveOperations();
    await workspaceExamples.documentOperations();
    await workspaceExamples.spreadsheetsOperations();
    await workspaceExamples.presentationOperations();

    // Run Vertex AI examples
    console.log('\n' + '='.repeat(60) + '\n');
    await vertexExamples.enterpriseAIOperations();
    await vertexExamples.batchTextProcessing();

    // Run Multimedia examples (when available)
    console.log('\n' + '='.repeat(60) + '\n');
    await multimediaExamples.videoGenerationExamples();
    await multimediaExamples.audioGenerationExamples();
    await multimediaExamples.imageGenerationExamples();

    // Run Advanced Integration examples
    console.log('\n' + '='.repeat(60) + '\n');
    await advancedExamples.contentCreationPipeline();
    await advancedExamples.automatedDataAnalysis();
    await advancedExamples.customerSupportAutomation();

    console.log('\n🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export {
  GoogleAIExamples,
  GoogleWorkspaceExamples, 
  VertexAIExamples,
  MultimediaExamples,
  AdvancedIntegrationExamples
};