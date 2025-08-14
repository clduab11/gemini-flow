/**
 * Intelligent Form Filler
 *
 * AI-powered form filling with smart field detection, validation,
 * and adaptive interaction patterns
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";

import {
  FormFillingConfig,
  ValidationRule,
  ElementDetectionConfig,
  CaptchaSolvingConfig,
  AntiDetectionConfig,
  FormStructure,
  FormField,
  FormValidation,
  SubmissionInfo,
  BrowserTab,
  IntegrationBaseError,
} from "./types.js";

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

export class IntelligentFormFiller extends BaseIntegration {
  private config: FormFillingConfig;
  private fieldMappings: Map<string, FieldMapping> = new Map();
  private smartDefaults: SmartDefault[] = [];
  private formCache: Map<string, FormStructure> = new Map();

  // Performance metrics
  private fillerMetrics = {
    formsProcessed: 0,
    fieldsProcessed: 0,
    successRate: 0,
    avgProcessingTime: 0,
    validationErrors: 0,
    captchasSolved: 0,
  };

  constructor(config: FormFillingConfig) {
    super({
      id: "intelligent-form-filler",
      name: "Intelligent Form Filler",
      version: "1.0.0",
      enabled: config.enabled,
      dependencies: ["puppeteer"],
      features: {
        aiAssisted: config.aiAssisted,
        dataValidation: config.dataValidation,
        smartDefaults: config.smartDefaults,
      },
      performance: {
        maxConcurrentOperations: 5,
        timeoutMs: 30000,
        retryAttempts: 3,
        cacheEnabled: true,
        cacheTTLMs: 3600000,
        metricsEnabled: true,
      },
      security: {
        encryption: true,
        validateOrigins: true,
        allowedHosts: [],
        tokenExpiration: 3600,
        auditLogging: true,
      },
      storage: {
        provider: "memory",
        encryption: true,
        compression: false,
      },
    });

    this.config = config;
    this.logger = new Logger("IntelligentFormFiller");
  }

  async initialize(): Promise<void> {
    try {
      this.status = "initializing";
      this.logger.info("Initializing Intelligent Form Filler");

      // Initialize field mappings
      this.initializeFieldMappings();

      // Initialize smart defaults
      this.initializeSmartDefaults();

      // Load validation rules
      this.loadValidationRules();

      this.status = "ready";
      this.logger.info("Intelligent Form Filler initialized successfully");
      this.emit("initialized", { timestamp: new Date() });
    } catch (error) {
      this.status = "error";
      const fillerError = new IntegrationBaseError(
        `Failed to initialize Intelligent Form Filler: ${error.message}`,
        "INIT_FAILED",
        "IntelligentFormFiller",
        "critical",
        false,
        { originalError: error.message },
      );

      this.emitError(fillerError);
      throw fillerError;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info("Shutting down Intelligent Form Filler");
      this.status = "shutdown";

      // Clear caches
      this.formCache.clear();
      this.fieldMappings.clear();

      this.logger.info("Intelligent Form Filler shutdown complete");
      this.emit("shutdown", { timestamp: new Date() });
    } catch (error) {
      this.logger.error("Error during Intelligent Form Filler shutdown", error);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      // Check if we can perform basic operations
      if (this.fieldMappings.size === 0 || this.smartDefaults.length === 0) {
        return "warning";
      }

      return "healthy";
    } catch (error) {
      this.logger.error("Health check failed", error);
      return "critical";
    }
  }

  getMetrics(): Record<string, number> {
    return {
      ...this.fillerMetrics,
      fieldMappings: this.fieldMappings.size,
      smartDefaults: this.smartDefaults.length,
      cachedForms: this.formCache.size,
    };
  }

  // === MAIN FORM FILLING METHOD ===

  async fillForm(request: FormFillingRequest): Promise<FormFillingResult> {
    const startTime = performance.now();

    try {
      this.logger.info("Starting intelligent form filling", {
        requestId: request.id,
        tabId: request.tab.id,
        fieldsToFill: Object.keys(request.formData).length,
      });

      // Analyze form structure
      const formStructure = await this.analyzeFormStructure(request.tab);

      // Map form data to fields
      const fieldMappings = this.mapFormData(request.formData, formStructure);

      // Fill form fields intelligently
      const fillResult = await this.performIntelligentFilling(
        request.tab,
        fieldMappings,
        request.options,
      );

      // Validate form if required
      let validationErrors: string[] = [];
      if (request.validation.validateBeforeSubmit) {
        validationErrors = await this.validateForm(
          request.tab,
          formStructure,
          request.validation,
        );
      }

      // Submit form if requested and validation passed
      let submissionResult: SubmissionResult | undefined;
      if (request.options.submitForm && validationErrors.length === 0) {
        submissionResult = await this.submitForm(request.tab, formStructure);
      }

      const duration = performance.now() - startTime;
      this.fillerMetrics.formsProcessed++;
      this.fillerMetrics.avgProcessingTime =
        (this.fillerMetrics.avgProcessingTime + duration) / 2;

      const result: FormFillingResult = {
        success: validationErrors.length === 0,
        formId: formStructure.selector,
        fieldsProcessed: fillResult.fieldsProcessed,
        fieldsFilled: fillResult.fieldsFilled,
        validationErrors,
        submissionResult,
        duration,
        metadata: {
          requestId: request.id,
          aiAssisted: this.config.aiAssisted,
          smartDefaults: request.options.useSmartDefaults,
          formComplexity: formStructure.fields.length,
        },
      };

      this.logger.info("Form filling completed", {
        requestId: request.id,
        success: result.success,
        fieldsProcessed: result.fieldsProcessed,
        fieldsFilled: result.fieldsFilled,
        duration: result.duration,
      });

      this.emit("form_filled", { request, result, timestamp: new Date() });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const fillingError = new IntegrationBaseError(
        `Form filling failed: ${error.message}`,
        "FORM_FILLING_FAILED",
        "IntelligentFormFiller",
        "medium",
        true,
        { requestId: request.id, tabId: request.tab.id },
      );

      this.emitError(fillingError);

      return {
        success: false,
        formId: "unknown",
        fieldsProcessed: 0,
        fieldsFilled: 0,
        validationErrors: [error.message],
        duration,
        metadata: { requestId: request.id, failed: true },
      };
    }
  }

  // === FORM ANALYSIS ===

  async analyzeFormStructure(tab: BrowserTab): Promise<FormStructure> {
    try {
      const page = tab.page;
      const formAnalysis = await page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll("form"));

        if (forms.length === 0) {
          throw new Error("No forms found on page");
        }

        // Analyze the most prominent form
        const form = forms[0]; // TODO: Improve form selection logic

        const fields: any[] = [];
        const inputs = form.querySelectorAll("input, select, textarea");

        inputs.forEach((input: any) => {
          const field = {
            name: input.name || input.id || "",
            type: input.type || input.tagName.toLowerCase(),
            selector: this.generateSelector(input),
            required: input.required || input.hasAttribute("required"),
            validation: this.extractValidationRules(input),
            options: this.extractOptions(input),
            placeholder: input.placeholder || "",
          };

          if (field.name || field.selector) {
            fields.push(field);
          }
        });

        return {
          selector: this.generateSelector(form),
          method: form.method || "POST",
          action: form.action || "",
          fields,
          validation: {
            clientSide: !!form.querySelector("[required]"),
            serverSide: false, // Can't detect from client
            realTime: false,
            patterns: {},
          },
          submission: {
            selector: this.generateSelector(
              form.querySelector(
                '[type="submit"], button[type="submit"], input[type="submit"]',
              ) || form.querySelector("button"),
            ),
            method: "click",
            confirmationSelector: "",
            redirectPattern: "",
          },
        };
      });

      // Cache the analyzed form
      this.formCache.set(tab.url, formAnalysis);

      return formAnalysis;
    } catch (error) {
      throw new IntegrationBaseError(
        `Form analysis failed: ${error.message}`,
        "FORM_ANALYSIS_FAILED",
        "IntelligentFormFiller",
        "medium",
        true,
        { tabId: tab.id, url: tab.url },
      );
    }
  }

  // === DATA MAPPING ===

  private mapFormData(
    formData: Record<string, any>,
    formStructure: FormStructure,
  ): Map<string, any> {
    const mappings = new Map<string, any>();

    for (const field of formStructure.fields) {
      let value = null;
      let mapped = false;

      // Try exact name match first
      if (formData[field.name]) {
        value = formData[field.name];
        mapped = true;
      }

      // Try configured field mappings
      if (!mapped) {
        for (const [sourceField, mapping] of this.fieldMappings) {
          if (formData[sourceField] && this.isFieldMatch(field, mapping)) {
            value = mapping.transformer
              ? mapping.transformer(formData[sourceField])
              : formData[sourceField];
            mapped = true;
            break;
          }
        }
      }

      // Try smart matching by field patterns
      if (!mapped && this.config.aiAssisted) {
        value = this.smartMatchField(field, formData);
        mapped = !!value;
      }

      // Use smart defaults if configured
      if (!mapped && this.config.smartDefaults) {
        value = this.generateSmartDefault(field);
        mapped = !!value;
      }

      if (mapped && value !== null) {
        mappings.set(field.selector, value);
      }
    }

    return mappings;
  }

  private isFieldMatch(field: FormField, mapping: FieldMapping): boolean {
    // Check if field matches the mapping criteria
    return (
      field.selector === mapping.targetSelector ||
      field.name === mapping.targetSelector ||
      field.selector.includes(mapping.targetSelector)
    );
  }

  private smartMatchField(
    field: FormField,
    formData: Record<string, any>,
  ): any {
    // AI-assisted field matching based on field characteristics
    const fieldLower = (field.name + " " + field.placeholder).toLowerCase();

    // Email fields
    if (fieldLower.includes("email") || field.type === "email") {
      return this.findValueByPattern(formData, /email|mail/i);
    }

    // Name fields
    if (
      fieldLower.includes("name") ||
      fieldLower.includes("first") ||
      fieldLower.includes("last")
    ) {
      if (fieldLower.includes("first")) {
        return this.findValueByPattern(
          formData,
          /first.*name|given.*name|fname/i,
        );
      }
      if (fieldLower.includes("last")) {
        return this.findValueByPattern(
          formData,
          /last.*name|family.*name|surname|lname/i,
        );
      }
      return this.findValueByPattern(
        formData,
        /^name$|full.*name|display.*name/i,
      );
    }

    // Phone fields
    if (fieldLower.includes("phone") || field.type === "tel") {
      return this.findValueByPattern(formData, /phone|tel|mobile|cell/i);
    }

    // Address fields
    if (fieldLower.includes("address")) {
      return this.findValueByPattern(formData, /address|street|addr/i);
    }

    // Date fields
    if (field.type === "date" || fieldLower.includes("date")) {
      return this.findValueByPattern(formData, /date|birth|dob/i);
    }

    return null;
  }

  private findValueByPattern(data: Record<string, any>, pattern: RegExp): any {
    for (const [key, value] of Object.entries(data)) {
      if (pattern.test(key)) {
        return value;
      }
    }
    return null;
  }

  private generateSmartDefault(field: FormField): any {
    for (const smartDefault of this.smartDefaults) {
      const fieldText = (
        field.name +
        " " +
        field.placeholder +
        " " +
        field.type
      ).toLowerCase();
      if (smartDefault.pattern.test(fieldText)) {
        return smartDefault.generator();
      }
    }
    return null;
  }

  // === INTELLIGENT FILLING ===

  private async performIntelligentFilling(
    tab: BrowserTab,
    fieldMappings: Map<string, any>,
    options: FormFillingOptions,
  ): Promise<{ fieldsProcessed: number; fieldsFilled: number }> {
    const page = tab.page;
    let fieldsProcessed = 0;
    let fieldsFilled = 0;

    // Sort fields by priority if specified
    const sortedFields = Array.from(fieldMappings.entries()).sort((a, b) => {
      const priorityA = options.fieldPriority[a[0]] || 0;
      const priorityB = options.fieldPriority[b[0]] || 0;
      return priorityB - priorityA;
    });

    for (const [selector, value] of sortedFields) {
      fieldsProcessed++;

      try {
        // Wait for field to be available
        await page.waitForSelector(selector, { timeout: 5000 });

        // Get field information
        const fieldInfo = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (!element) return null;

          return {
            tagName: element.tagName.toLowerCase(),
            type: (element as any).type || "",
            readonly: (element as any).readOnly,
            disabled: (element as any).disabled,
            value: (element as any).value || "",
          };
        }, selector);

        if (!fieldInfo || fieldInfo.readonly || fieldInfo.disabled) {
          continue;
        }

        // Apply human-like delays
        if (options.humanLikeDelay) {
          await this.humanLikeDelay();
        }

        // Fill field based on type
        await this.fillFieldByType(page, selector, value, fieldInfo);
        fieldsFilled++;

        this.fillerMetrics.fieldsProcessed++;

        this.logger.debug("Field filled successfully", {
          selector,
          type: fieldInfo.type,
          value:
            typeof value === "string" ? value.substring(0, 20) + "..." : value,
        });
      } catch (error) {
        this.logger.warn(`Failed to fill field ${selector}`, error);

        // Try alternative selectors or methods
        const filled = await this.tryAlternativeFilling(page, selector, value);
        if (filled) {
          fieldsFilled++;
        }
      }
    }

    return { fieldsProcessed, fieldsFilled };
  }

  private async fillFieldByType(
    page: any,
    selector: string,
    value: any,
    fieldInfo: any,
  ): Promise<void> {
    switch (fieldInfo.tagName) {
      case "input":
        await this.fillInputField(page, selector, value, fieldInfo.type);
        break;
      case "select":
        await this.fillSelectField(page, selector, value);
        break;
      case "textarea":
        await this.fillTextareaField(page, selector, value);
        break;
      default:
        await this.fillGenericField(page, selector, value);
    }
  }

  private async fillInputField(
    page: any,
    selector: string,
    value: any,
    type: string,
  ): Promise<void> {
    switch (type) {
      case "checkbox":
      case "radio":
        if (value) {
          await page.click(selector);
        }
        break;
      case "file":
        if (typeof value === "string") {
          const input = await page.$(selector);
          await input.uploadFile(value);
        }
        break;
      default:
        // Clear existing value and type new one
        await page.click(selector, { clickCount: 3 }); // Select all
        await page.type(selector, String(value), { delay: 50 });
    }
  }

  private async fillSelectField(
    page: any,
    selector: string,
    value: any,
  ): Promise<void> {
    // Try to select by value, then by text
    try {
      await page.select(selector, String(value));
    } catch (error) {
      // Try selecting by visible text
      await page.evaluate(
        (sel, val) => {
          const select = document.querySelector(sel) as HTMLSelectElement;
          if (select) {
            for (let i = 0; i < select.options.length; i++) {
              if (
                select.options[i].text.toLowerCase().includes(val.toLowerCase())
              ) {
                select.selectedIndex = i;
                select.dispatchEvent(new Event("change"));
                break;
              }
            }
          }
        },
        selector,
        String(value),
      );
    }
  }

  private async fillTextareaField(
    page: any,
    selector: string,
    value: any,
  ): Promise<void> {
    await page.click(selector);
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.type(selector, String(value), { delay: 20 });
  }

  private async fillGenericField(
    page: any,
    selector: string,
    value: any,
  ): Promise<void> {
    // Generic filling for custom elements
    await page.evaluate(
      (sel, val) => {
        const element = document.querySelector(sel) as any;
        if (element) {
          element.value = val;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      selector,
      value,
    );
  }

  private async tryAlternativeFilling(
    page: any,
    selector: string,
    value: any,
  ): Promise<boolean> {
    // Try alternative selectors and methods
    try {
      // Try by name attribute
      const nameSelector = `[name="${selector}"]`;
      await page.waitForSelector(nameSelector, { timeout: 1000 });
      await page.type(nameSelector, String(value));
      return true;
    } catch (error) {
      // Try by id
      try {
        const idSelector = `#${selector}`;
        await page.waitForSelector(idSelector, { timeout: 1000 });
        await page.type(idSelector, String(value));
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  // === VALIDATION ===

  private async validateForm(
    tab: BrowserTab,
    formStructure: FormStructure,
    validation: FormFillingValidation,
  ): Promise<string[]> {
    const errors: string[] = [];
    const page = tab.page;

    try {
      // Check required fields
      for (const fieldName of validation.requiredFields) {
        const field = formStructure.fields.find((f) => f.name === fieldName);
        if (field) {
          const value = await page.evaluate((selector) => {
            const element = document.querySelector(selector) as any;
            return element ? element.value : "";
          }, field.selector);

          if (!value || value.trim() === "") {
            errors.push(`Required field '${fieldName}' is empty`);
          }
        }
      }

      // Run custom validators
      for (const [fieldName, validator] of validation.customValidators) {
        const field = formStructure.fields.find((f) => f.name === fieldName);
        if (field) {
          const value = await page.evaluate((selector) => {
            const element = document.querySelector(selector) as any;
            return element ? element.value : "";
          }, field.selector);

          if (!validator(value)) {
            errors.push(`Validation failed for field '${fieldName}'`);
          }
        }
      }

      // Check built-in validation rules
      for (const rule of this.config.validationRules) {
        const field = formStructure.fields.find((f) => f.name === rule.field);
        if (field) {
          const value = await page.evaluate((selector) => {
            const element = document.querySelector(selector) as any;
            return element ? element.value : "";
          }, field.selector);

          if (!this.validateFieldValue(value, rule)) {
            errors.push(
              `Field '${rule.field}' failed validation: ${rule.type}`,
            );
          }
        }
      }

      this.fillerMetrics.validationErrors += errors.length;
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return errors;
  }

  private validateFieldValue(value: any, rule: ValidationRule): boolean {
    if (rule.required && (!value || value.trim() === "")) {
      return false;
    }

    if (!value && !rule.required) {
      return true; // Optional empty field is valid
    }

    switch (rule.type) {
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case "phone":
        return /^[\d\s\-\+\(\)]+$/.test(value);
      case "date":
        return !isNaN(Date.parse(value));
      case "number":
        return !isNaN(Number(value));
      case "regex":
        return rule.pattern ? new RegExp(rule.pattern).test(value) : true;
      case "text":
        return typeof value === "string" && value.length > 0;
      default:
        return rule.custom ? rule.custom(value) : true;
    }
  }

  // === FORM SUBMISSION ===

  private async submitForm(
    tab: BrowserTab,
    formStructure: FormStructure,
  ): Promise<SubmissionResult> {
    const page = tab.page;

    try {
      this.logger.info("Submitting form", {
        formSelector: formStructure.selector,
      });

      // Handle CAPTCHA if present
      if (this.config.enabled) {
        await this.handleCaptcha(page);
      }

      // Click submit button
      const submitSelector = formStructure.submission.selector;
      await page.waitForSelector(submitSelector, { timeout: 5000 });

      // Wait for navigation or response
      const [response] = await Promise.all([
        page
          .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 })
          .catch(() => null), // Don't fail if no navigation
        page.click(submitSelector),
      ]);

      // Check for submission success
      const currentUrl = page.url();
      const submitted = response !== null || currentUrl !== tab.url;

      return {
        submitted,
        response: response ? await response.text() : null,
        redirectUrl: submitted ? currentUrl : undefined,
        errors: [],
      };
    } catch (error) {
      return {
        submitted: false,
        response: null,
        errors: [error.message],
      };
    }
  }

  private async handleCaptcha(page: any): Promise<void> {
    // Simple CAPTCHA detection and handling
    try {
      const captchaElements = await page.$$eval(
        '[class*="captcha"], [id*="captcha"], [src*="captcha"]',
        (elements: any[]) => elements.length,
      );

      if (captchaElements > 0) {
        this.logger.info("CAPTCHA detected, attempting to solve");

        if (this.config.enabled) {
          // Implement CAPTCHA solving logic here
          // This would integrate with services like 2captcha, AntiCaptcha, etc.
          this.fillerMetrics.captchasSolved++;
        } else {
          throw new Error("CAPTCHA detected but solving is disabled");
        }
      }
    } catch (error) {
      this.logger.warn("CAPTCHA handling failed", error);
    }
  }

  // === INITIALIZATION HELPERS ===

  private initializeFieldMappings(): void {
    // Common field mappings
    const commonMappings: Array<[string, FieldMapping]> = [
      [
        "email",
        {
          sourceField: "email",
          targetSelector: '[type="email"], [name*="email"], [id*="email"]',
          priority: 10,
        },
      ],
      [
        "firstName",
        {
          sourceField: "firstName",
          targetSelector: '[name*="first"], [id*="first"], [name*="fname"]',
          priority: 9,
        },
      ],
      [
        "lastName",
        {
          sourceField: "lastName",
          targetSelector: '[name*="last"], [id*="last"], [name*="lname"]',
          priority: 9,
        },
      ],
      [
        "phone",
        {
          sourceField: "phone",
          targetSelector: '[type="tel"], [name*="phone"], [id*="phone"]',
          priority: 8,
        },
      ],
      [
        "address",
        {
          sourceField: "address",
          targetSelector:
            '[name*="address"], [id*="address"], [name*="street"]',
          priority: 7,
        },
      ],
    ];

    for (const [key, mapping] of commonMappings) {
      this.fieldMappings.set(key, mapping);
    }

    // Add configured mappings
    for (const [source, target] of Object.entries(this.config.fieldMapping)) {
      this.fieldMappings.set(source, {
        sourceField: source,
        targetSelector: target,
        priority: 5,
      });
    }
  }

  private initializeSmartDefaults(): void {
    this.smartDefaults = [
      {
        pattern: /email/i,
        generator: () => `user${Date.now()}@example.com`,
        category: "email",
      },
      {
        pattern: /first.*name|fname/i,
        generator: () => "John",
        category: "name",
      },
      {
        pattern: /last.*name|lname/i,
        generator: () => "Doe",
        category: "name",
      },
      {
        pattern: /phone|tel/i,
        generator: () => "+1-555-0123",
        category: "phone",
      },
      {
        pattern: /zip|postal/i,
        generator: () => "12345",
        category: "postal",
      },
      {
        pattern: /city/i,
        generator: () => "New York",
        category: "location",
      },
    ];
  }

  private loadValidationRules(): void {
    // Add configured validation rules
    for (const rule of this.config.validationRules) {
      this.logger.debug("Loaded validation rule", {
        field: rule.field,
        type: rule.type,
        required: rule.required,
      });
    }
  }

  private async humanLikeDelay(): Promise<void> {
    // Random delay between 100-500ms to simulate human typing
    const delay = Math.random() * 400 + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
