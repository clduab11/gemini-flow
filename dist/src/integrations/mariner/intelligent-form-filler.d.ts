/**
 * Intelligent Form Filler
 *
 * AI-powered form filling with smart field detection, validation,
 * and adaptive interaction patterns
 */
import { FormFillingConfig, FormStructure, BrowserTab } from "./types.js";
import { BaseIntegration, HealthStatus } from "../shared/types.js";
export interface FormFillingRequest {
    id: string;
    tab: BrowserTab;
    formData: Record<string, any>;
    options: FormFillingOptions;
    validation: FormFillingValidation;
}
export interface FormFillingOptions {
    skipOptionalFields: boolean;
    useSmartDefaults: boolean;
    enableValidation: boolean;
    submitForm: boolean;
    captchaSolving: boolean;
    humanLikeDelay: boolean;
    fieldPriority: Record<string, number>;
}
export interface FormFillingValidation {
    validateBeforeSubmit: boolean;
    requiredFields: string[];
    customValidators: Map<string, (value: any) => boolean>;
    skipInvalidFields: boolean;
}
export interface FormFillingResult {
    success: boolean;
    formId: string;
    fieldsProcessed: number;
    fieldsFilled: number;
    validationErrors: string[];
    submissionResult?: SubmissionResult;
    duration: number;
    metadata: Record<string, any>;
}
export interface SubmissionResult {
    submitted: boolean;
    response: any;
    redirectUrl?: string;
    errors: string[];
}
export interface FieldMapping {
    sourceField: string;
    targetSelector: string;
    transformer?: (value: any) => any;
    validator?: (value: any) => boolean;
    priority: number;
}
export interface SmartDefault {
    pattern: RegExp;
    generator: () => any;
    category: string;
}
export declare class IntelligentFormFiller extends BaseIntegration {
    private config;
    private fieldMappings;
    private smartDefaults;
    private formCache;
    private fillerMetrics;
    constructor(config: FormFillingConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    fillForm(request: FormFillingRequest): Promise<FormFillingResult>;
    analyzeFormStructure(tab: BrowserTab): Promise<FormStructure>;
    private mapFormData;
    private isFieldMatch;
    private smartMatchField;
    private findValueByPattern;
    private generateSmartDefault;
    private performIntelligentFilling;
    private fillFieldByType;
    private fillInputField;
    private fillSelectField;
    private fillTextareaField;
    private fillGenericField;
    private tryAlternativeFilling;
    private validateForm;
    private validateFieldValue;
    private submitForm;
    private handleCaptcha;
    private initializeFieldMappings;
    private initializeSmartDefaults;
    private loadValidationRules;
    private humanLikeDelay;
}
//# sourceMappingURL=intelligent-form-filler.d.ts.map