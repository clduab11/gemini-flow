/**
 * @interface InfrastructureConfig
 * @description Configuration for Infrastructure Management.
 */
export interface InfrastructureConfig {
    projectID: string;
    region: string;
    environment: 'development' | 'staging' | 'production';
    terraformStateBucket?: string;
}
/**
 * @interface InfrastructureOperations
 * @description Defines operations for managing Google Cloud infrastructure as code.
 */
export interface InfrastructureOperations {
    provisionInfrastructure(component: string): Promise<void>;
    deployKubernetesApplication(appName: string, manifestPath: string): Promise<void>;
    deployHelmChart(chartName: string, releaseName: string, values: any): Promise<void>;
    configureNetworkSecurity(): Promise<void>;
    setupBackupAndRecovery(): Promise<void>;
}
/**
 * @class InfrastructureManager
 * @description Manages Google Cloud infrastructure provisioning, deployment, and security using Infrastructure as Code principles.
 */
export declare class InfrastructureManager implements InfrastructureOperations {
    private config;
    private logger;
    constructor(config: InfrastructureConfig);
    /**
     * Provisions Google Cloud infrastructure components using Terraform (conceptual).
     * @param {string} component The name of the infrastructure component to provision (e.g., 'gke_cluster', 'cloud_sql').
     * @returns {Promise<void>}
     */
    provisionInfrastructure(component: string): Promise<void>;
    /**
     * Deploys a Kubernetes application using manifests (conceptual).
     * @param {string} appName The name of the application.
     * @param {string} manifestPath The path to the Kubernetes manifest file or directory.
     * @returns {Promise<void>}
     */
    deployKubernetesApplication(appName: string, manifestPath: string): Promise<void>;
    /**
     * Deploys a Helm chart for application deployment (conceptual).
     * @param {string} chartName The name of the Helm chart.
     * @param {string} releaseName The release name for the deployment.
     * @param {any} values Custom values for the Helm chart.
     * @returns {Promise<void>}
     */
    deployHelmChart(chartName: string, releaseName: string, values: any): Promise<void>;
    /**
     * Configures network security and firewall rules (conceptual).
     * @returns {Promise<void>}
     */
    configureNetworkSecurity(): Promise<void>;
    /**
     * Sets up automated backup and disaster recovery procedures (conceptual).
     * @returns {Promise<void>}
     */
    setupBackupAndRecovery(): Promise<void>;
}
//# sourceMappingURL=infrastructure-manager.d.ts.map