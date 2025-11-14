/**
 * Google Services Configuration
 *
 * Defines which services use API keys (GCP-managed) vs Playwright browser automation (web-only)
 */

export interface ServiceConfig {
  name: string;
  type: 'api' | 'playwright';
  url?: string;
  requiresAuth: boolean;
  ultraOnly?: boolean;
  description: string;
}

/**
 * API-based services (GCP/Vertex AI)
 */
export const API_SERVICES: Record<string, ServiceConfig> = {
  'gemini-flash': {
    name: 'Gemini 2.0 Flash',
    type: 'api',
    requiresAuth: true,
    description: 'Fast multimodal AI model via Gemini API'
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    type: 'api',
    requiresAuth: true,
    description: 'Advanced AI model via Gemini API'
  },
  'vertex-ai': {
    name: 'Vertex AI',
    type: 'api',
    requiresAuth: true,
    description: 'Google Cloud Vertex AI platform'
  },
  'gcp-services': {
    name: 'Google Cloud Platform',
    type: 'api',
    requiresAuth: true,
    description: 'GCP services via API keys'
  }
};

/**
 * Playwright browser automation services (web-only)
 */
export const PLAYWRIGHT_SERVICES: Record<string, ServiceConfig> = {
  'ai-studio-ultra': {
    name: 'AI Studio Ultra',
    type: 'playwright',
    url: 'https://aistudio.google.com',
    requiresAuth: true,
    ultraOnly: true,
    description: 'AI Studio Ultra features (web-only, requires Ultra membership)'
  },
  'labs-flow': {
    name: 'Google Labs Flow',
    type: 'playwright',
    url: 'https://labs.google.com/flow',
    requiresAuth: true,
    description: 'Flow workflow automation (web-only)'
  },
  'labs-whisk': {
    name: 'Google Labs Whisk',
    type: 'playwright',
    url: 'https://labs.google.com/whisk',
    requiresAuth: true,
    description: 'Whisk creative tool (web-only)'
  },
  'labs-music': {
    name: 'Google Labs Music',
    type: 'playwright',
    url: 'https://labs.google.com/music',
    requiresAuth: true,
    description: 'Music generation (web-only)'
  },
  'labs-image': {
    name: 'Google Labs Image',
    type: 'playwright',
    url: 'https://labs.google.com/image',
    requiresAuth: true,
    description: 'Image generation (web-only)'
  },
  'project-mariner': {
    name: 'Project Mariner',
    type: 'playwright',
    url: 'https://deepmind.google/project-mariner',
    requiresAuth: true,
    ultraOnly: true,
    description: 'Autonomous web agent (web-only, experimental)'
  },
  'notebooklm': {
    name: 'NotebookLM',
    type: 'playwright',
    url: 'https://notebooklm.google.com',
    requiresAuth: true,
    description: 'AI-powered notebook (web-only)'
  }
};

/**
 * All services combined
 */
export const ALL_SERVICES = {
  ...API_SERVICES,
  ...PLAYWRIGHT_SERVICES
};

/**
 * Get service configuration by name
 */
export function getServiceConfig(serviceName: string): ServiceConfig | undefined {
  return ALL_SERVICES[serviceName];
}

/**
 * Check if service requires Playwright
 */
export function requiresPlaywright(serviceName: string): boolean {
  const config = getServiceConfig(serviceName);
  return config?.type === 'playwright';
}

/**
 * Check if service requires Ultra membership
 */
export function requiresUltra(serviceName: string): boolean {
  const config = getServiceConfig(serviceName);
  return config?.ultraOnly === true;
}

/**
 * Get all services by type
 */
export function getServicesByType(type: 'api' | 'playwright'): ServiceConfig[] {
  return Object.values(ALL_SERVICES).filter(service => service.type === type);
}
