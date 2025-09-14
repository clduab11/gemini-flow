/**
 * Google Workspace Integration
 *
 * Native integration with Google Docs, Sheets, Slides, and Drive
 * Leverages Gemini's native Google ecosystem advantages
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
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
export declare class GoogleWorkspaceIntegration extends EventEmitter {
    private auth;
    private drive;
    private docs;
    private sheets;
    private slides;
    private logger;
    private readonly DEFAULT_SCOPES;
    constructor(config: WorkspaceConfig);
    /**
     * Initialize authentication with conditional imports
     */
    private initializeAuth;
    /**
     * Initialize Google Workspace service clients
     */
    private initializeServices;
    /**
     * Initialize Google APIs
     */
    initialize(tokens?: any): Promise<void>;
    /**
     * Get authorization URL for OAuth flow
     */
    getAuthUrl(): string;
    /**
     * Exchange authorization code for tokens
     */
    getTokens(code: string): Promise<any>;
    /**
     * Search Google Drive for files
     */
    searchDrive(query: string, options?: any): Promise<WorkspaceDocument[]>;
    /**
     * Create a new Google Doc with AI-generated content
     */
    createDocument(title: string, content: string, folderId?: string): Promise<WorkspaceDocument>;
    /**
     * Analyze spreadsheet data with AI
     */
    analyzeSpreadsheet(spreadsheetId: string, range: string, analysisType: string): Promise<any>;
    /**
     * Create presentation from content
     */
    createPresentation(title: string, slides: any[]): Promise<WorkspaceDocument>;
    /**
     * Update document with AI-enhanced content
     */
    updateDocument(documentId: string, updates: any[]): Promise<void>;
    /**
     * Export document in various formats
     */
    exportDocument(fileId: string, mimeType: string): Promise<Buffer>;
    /**
     * Share document with permissions
     */
    shareDocument(fileId: string, email: string, role?: string): Promise<void>;
    /**
     * Monitor document changes in real-time
     */
    watchDocument(fileId: string, callback: (change: any) => void): Promise<void>;
    /**
     * Sync with Gemini memory
     */
    syncWithMemory(memory: any): Promise<void>;
    private getDocumentType;
    private performStatisticalAnalysis;
    private generateDataSummary;
    private detectAnomalies;
    private generateForecast;
    private createSlideContentRequests;
}
//# sourceMappingURL=google-integration.d.ts.map