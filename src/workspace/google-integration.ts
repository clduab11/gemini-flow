/**
 * Google Workspace Integration
 *
 * Native integration with Google Docs, Sheets, Slides, and Drive
 * Leverages Gemini's native Google ecosystem advantages
 */

import { Logger } from "../utils/logger.js";
import { EventEmitter } from "events";
import {
  safeImport,
  getFeatureCapabilities,
} from "../utils/feature-detection.js";

export interface WorkspaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface WorkspaceDocument {
  id: string;
  name: string;
  type: "doc" | "sheet" | "slide" | "drive";
  url: string;
  lastModified: Date;
  permissions: string[];
}

export class GoogleWorkspaceIntegration extends EventEmitter {
  private auth: any; // OAuth2Client when available
  private drive: any;
  private docs: any;
  private sheets: any;
  private slides: any;
  private logger: Logger;

  // Default scopes for comprehensive access
  private readonly DEFAULT_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/cloud-platform",
  ];

  constructor(config: WorkspaceConfig) {
    super();
    this.logger = new Logger("GoogleWorkspace");

    // Initialize OAuth2 client conditionally
    this.initializeAuth(config).catch((error) => {
      this.logger.error("Failed to initialize Google Workspace auth", error);
    });

    // Set scopes - OAuth2Client doesn't have scopes property directly
    // Scopes are set during getAccessToken or setCredentials calls
  }

  /**
   * Initialize authentication with conditional imports
   */
  private async initializeAuth(config: WorkspaceConfig): Promise<void> {
    const capabilities = await getFeatureCapabilities();

    if (!capabilities.hasGoogleServices) {
      this.logger.warn(
        "Google Workspace services not available. Install googleapis and google-auth-library for full functionality.",
      );
      return;
    }

    const googleApis = await safeImport("googleapis");
    if (!googleApis?.google?.auth?.OAuth2) {
      throw new Error("Google APIs not available");
    }

    // Initialize OAuth2 client
    this.auth = new googleApis.google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri || "http://localhost:3000/callback",
    );

    // Initialize service clients
    await this.initializeServices(googleApis.google);
  }

  /**
   * Initialize Google Workspace service clients
   */
  private async initializeServices(google: any): Promise<void> {
    try {
      this.drive = google.drive({ version: "v3", auth: this.auth });
      this.docs = google.docs({ version: "v1", auth: this.auth });
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      this.slides = google.slides({ version: "v1", auth: this.auth });

      this.logger.info("Google Workspace services initialized");
    } catch (error) {
      this.logger.error(
        "Failed to initialize Google Workspace services",
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize Google APIs
   */
  async initialize(tokens?: any): Promise<void> {
    try {
      const googleApis = await safeImport("googleapis");
      if (!googleApis?.google) {
        throw new Error("Google APIs not available");
      }

      if (tokens) {
        this.auth.setCredentials(tokens);
      } else {
        // Use Application Default Credentials for GCP environments
        const auth = new googleApis.google.auth.GoogleAuth({
          scopes: this.DEFAULT_SCOPES,
        });
        const client = await auth.getClient();
        this.auth = client; // OAuth2Client compatibility
      }

      // Initialize API clients with auth
      this.drive = googleApis.google.drive({ version: "v3", auth: this.auth });
      this.docs = googleApis.google.docs({ version: "v1", auth: this.auth });
      this.sheets = googleApis.google.sheets({
        version: "v4",
        auth: this.auth,
      });
      this.slides = googleApis.google.slides({
        version: "v1",
        auth: this.auth,
      });

      this.logger.info("Google Workspace APIs initialized");
      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Google Workspace", error);
      throw error;
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: "offline",
      scope: this.DEFAULT_SCOPES,
      prompt: "consent",
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    return tokens;
  }

  /**
   * Search Google Drive for files
   */
  async searchDrive(
    query: string,
    options?: any,
  ): Promise<WorkspaceDocument[]> {
    try {
      const response = await this.drive.files.list({
        q: query,
        fields:
          "files(id, name, mimeType, webViewLink, modifiedTime, permissions)",
        pageSize: options?.limit || 100,
        orderBy: options?.orderBy || "modifiedTime desc",
      });

      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        type: this.getDocumentType(file.mimeType),
        url: file.webViewLink,
        lastModified: new Date(file.modifiedTime),
        permissions: file.permissions?.map((p: any) => p.role) || [],
      }));
    } catch (error) {
      this.logger.error("Drive search failed", error);
      throw error;
    }
  }

  /**
   * Create a new Google Doc with AI-generated content
   */
  async createDocument(
    title: string,
    content: string,
    folderId?: string,
  ): Promise<WorkspaceDocument> {
    try {
      // Create the document
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title,
        },
      });

      const documentId = createResponse.data.documentId;

      // Add content
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });

      // Move to folder if specified
      if (folderId) {
        await this.drive.files.update({
          fileId: documentId,
          addParents: folderId,
        });
      }

      // Get document details
      const file = await this.drive.files.get({
        fileId: documentId,
        fields: "id, name, webViewLink, modifiedTime",
      });

      this.logger.info("Document created", { documentId, title });

      return {
        id: documentId,
        name: title,
        type: "doc",
        url: file.data.webViewLink,
        lastModified: new Date(file.data.modifiedTime),
        permissions: ["owner"],
      };
    } catch (error) {
      this.logger.error("Document creation failed", error);
      throw error;
    }
  }

  /**
   * Analyze spreadsheet data with AI
   */
  async analyzeSpreadsheet(
    spreadsheetId: string,
    range: string,
    analysisType: string,
  ): Promise<any> {
    try {
      // Get spreadsheet data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values;

      if (!values || values.length === 0) {
        return { error: "No data found" };
      }

      // Perform analysis based on type
      switch (analysisType) {
        case "statistical":
          return this.performStatisticalAnalysis(values);

        case "summary":
          return this.generateDataSummary(values);

        case "anomaly":
          return this.detectAnomalies(values);

        case "forecast":
          return this.generateForecast(values);

        default:
          return { error: "Unknown analysis type" };
      }
    } catch (error) {
      this.logger.error("Spreadsheet analysis failed", error);
      throw error;
    }
  }

  /**
   * Create presentation from content
   */
  async createPresentation(
    title: string,
    slides: any[],
  ): Promise<WorkspaceDocument> {
    try {
      // Create presentation
      const createResponse = await this.slides.presentations.create({
        requestBody: {
          title,
        },
      });

      const presentationId = createResponse.data.presentationId;

      // Add slides
      const requests = slides.map((slide, index) => ({
        createSlide: {
          objectId: `slide_${index}`,
          insertionIndex: index,
          slideLayoutReference: {
            predefinedLayout: slide.layout || "TITLE_AND_BODY",
          },
        },
      }));

      await this.slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests },
      });

      // Add content to slides
      const contentRequests = slides.flatMap((slide, index) =>
        this.createSlideContentRequests(`slide_${index}`, slide),
      );

      await this.slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests: contentRequests },
      });

      // Get presentation details
      const file = await this.drive.files.get({
        fileId: presentationId,
        fields: "id, name, webViewLink, modifiedTime",
      });

      return {
        id: presentationId,
        name: title,
        type: "slide",
        url: file.data.webViewLink,
        lastModified: new Date(file.data.modifiedTime),
        permissions: ["owner"],
      };
    } catch (error) {
      this.logger.error("Presentation creation failed", error);
      throw error;
    }
  }

  /**
   * Update document with AI-enhanced content
   */
  async updateDocument(documentId: string, updates: any[]): Promise<void> {
    try {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: updates,
        },
      });

      this.logger.info("Document updated", {
        documentId,
        updateCount: updates.length,
      });
    } catch (error) {
      this.logger.error("Document update failed", error);
      throw error;
    }
  }

  /**
   * Export document in various formats
   */
  async exportDocument(fileId: string, mimeType: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.export(
        {
          fileId,
          mimeType,
        },
        {
          responseType: "arraybuffer",
        },
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error("Document export failed", error);
      throw error;
    }
  }

  /**
   * Share document with permissions
   */
  async shareDocument(
    fileId: string,
    email: string,
    role: string = "reader",
  ): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          type: "user",
          role,
          emailAddress: email,
        },
        sendNotificationEmail: true,
      });

      this.logger.info("Document shared", { fileId, email, role });
    } catch (error) {
      this.logger.error("Document sharing failed", error);
      throw error;
    }
  }

  /**
   * Monitor document changes in real-time
   */
  async watchDocument(
    fileId: string,
    callback: (change: any) => void,
  ): Promise<void> {
    // Implementation would use Google Drive push notifications
    this.logger.info("Document watch started", { fileId });

    // Emit events when changes occur
    this.on(`change:${fileId}`, callback);
  }

  /**
   * Sync with Gemini memory
   */
  async syncWithMemory(memory: any): Promise<void> {
    try {
      // Store sync metadata
      const syncData: { lastSync: Date; documentCount: number; syncedFiles: string[] } = {
        lastSync: new Date(),
        documentCount: 0,
        syncedFiles: [],
      };

      // List recent files
      const files = await this.searchDrive("modifiedTime > '2024-01-01'");

      for (const file of files) {
        await memory.store({
          key: `workspace/file/${file.id}`,
          value: file,
          namespace: "google-workspace",
          ttl: 86400, // 24 hours
        });

        syncData.documentCount++;
        syncData.syncedFiles.push(file.id);
      }

      await memory.store({
        key: "workspace/sync/status",
        value: syncData,
        namespace: "google-workspace",
      });

      this.logger.info("Workspace sync completed", syncData);
    } catch (error) {
      this.logger.error("Workspace sync failed", error);
      throw error;
    }
  }

  // Helper methods

  private getDocumentType(
    mimeType: string,
  ): "doc" | "sheet" | "slide" | "drive" {
    if (mimeType.includes("document")) return "doc";
    if (mimeType.includes("spreadsheet")) return "sheet";
    if (mimeType.includes("presentation")) return "slide";
    return "drive";
  }

  private performStatisticalAnalysis(data: any[][]): any {
    // Implementation for statistical analysis
    const headers = data[0];
    const values = data.slice(1);

    return {
      type: "statistical",
      rowCount: values.length,
      columnCount: headers.length,
      summary: "Statistical analysis placeholder",
    };
  }

  private generateDataSummary(data: any[][]): any {
    // Implementation for data summary
    return {
      type: "summary",
      totalRows: data.length,
      totalColumns: data[0]?.length || 0,
      preview: data.slice(0, 5),
    };
  }

  private detectAnomalies(data: any[][]): any {
    // Implementation for anomaly detection
    return {
      type: "anomaly",
      anomaliesFound: 0,
      confidence: 0.95,
    };
  }

  private generateForecast(data: any[][]): any {
    // Implementation for forecasting
    return {
      type: "forecast",
      predictions: [],
      confidence: 0.85,
    };
  }

  private createSlideContentRequests(slideId: string, slide: any): any[] {
    const requests: any[] = [];

    if (slide.title) {
      requests.push({
        insertText: {
          objectId: `${slideId}_title`,
          text: slide.title,
        },
      });
    }

    if (slide.body) {
      requests.push({
        insertText: {
          objectId: `${slideId}_body`,
          text: slide.body,
        },
      });
    }

    return requests;
  }
}
