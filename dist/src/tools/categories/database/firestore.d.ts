import { ToolCapability } from '../../../types/mcp-config';
/**
 * @interface FirestoreConfig
 * @description Configuration for Google Cloud Firestore operations.
 */
export interface FirestoreConfig {
    projectID: string;
}
/**
 * @interface FirestoreOperations
 * @description Defines the operations available for Google Cloud Firestore.
 */
export interface FirestoreOperations {
    addDocument(collectionPath: string, documentData: {
        [key: string]: any;
    }, documentId?: string): Promise<any>;
    getDocument(collectionPath: string, documentId: string): Promise<any | undefined>;
    updateDocument(collectionPath: string, documentId: string, updates: {
        [key: string]: any;
    }): Promise<void>;
    deleteDocument(collectionPath: string, documentId: string): Promise<void>;
    queryCollection(collectionPath: string, queries?: {
        field: string;
        operator: string;
        value: any;
    }[]): Promise<any[]>;
}
/**
 * @class FirestoreTool
 * @description Implements Google Cloud Firestore operations as an MCP tool.
 */
export declare class FirestoreTool implements FirestoreOperations {
    private config;
    constructor(config: FirestoreConfig);
    /**
     * Adds a document to a Firestore collection.
     * @param {string} collectionPath The path to the collection.
     * @param {object} documentData The data for the document.
     * @param {string} [documentId] Optional ID for the document. If not provided, Firestore generates one.
     * @returns {Promise<any>} The ID of the added document.
     */
    addDocument(collectionPath: string, documentData: {
        [key: string]: any;
    }, documentId?: string): Promise<any>;
    /**
     * Retrieves a document from a Firestore collection.
     * @param {string} collectionPath The path to the collection.
     * @param {string} documentId The ID of the document to retrieve.
     * @returns {Promise<any | undefined>} The document data or undefined if not found.
     */
    getDocument(collectionPath: string, documentId: string): Promise<any | undefined>;
    /**
     * Updates an existing document in a Firestore collection.
     * @param {string} collectionPath The path to the collection.
     * @param {string} documentId The ID of the document to update.
     * @param {object} updates The fields to update.
     * @returns {Promise<void>}
     */
    updateDocument(collectionPath: string, documentId: string, updates: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * Deletes a document from a Firestore collection.
     * @param {string} collectionPath The path to the collection.
     * @param {string} documentId The ID of the document to delete.
     * @returns {Promise<void>}
     */
    deleteDocument(collectionPath: string, documentId: string): Promise<void>;
    /**
     * Queries a Firestore collection.
     * @param {string} collectionPath The path to the collection.
     * @param {object[]} [queries] Optional array of query conditions (e.g., [{ field: 'status', operator: '==', value: 'active' }]).
     * @returns {Promise<any[]>} A list of documents matching the query.
     */
    queryCollection(collectionPath: string, queries?: {
        field: string;
        operator: string;
        value: any;
    }[]): Promise<any[]>;
    /**
     * Returns the capabilities provided by this tool.
     * @returns {ToolCapability[]} An array of tool capabilities.
     */
    static getCapabilities(): ToolCapability[];
}
//# sourceMappingURL=firestore.d.ts.map