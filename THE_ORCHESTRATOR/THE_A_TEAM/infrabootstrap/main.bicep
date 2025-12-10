// ═══════════════════════════════════════════════════════════════════════════════
// SEO INTELLIGENCE PLATFORM - AZURE INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Deploy with:
//   az deployment sub create --location westeurope --template-file main.bicep
//
// ═══════════════════════════════════════════════════════════════════════════════

targetScope = 'subscription'

// ═══════════════════════════════════════════════════════════════════════════════
// PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════════

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region')
param location string = 'westeurope'

@description('Base name for resources')
param baseName string = 'seoplatform'

// ═══════════════════════════════════════════════════════════════════════════════
// VARIABLES
// ═══════════════════════════════════════════════════════════════════════════════

var resourceGroupName = '${baseName}-${environment}-rg'
var containerRegistryName = '${baseName}${environment}acr'
var keyVaultName = '${baseName}-${environment}-kv'
var containerAppsEnvName = '${baseName}-${environment}-cae'
var logAnalyticsName = '${baseName}-${environment}-logs'

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE GROUP
// ═══════════════════════════════════════════════════════════════════════════════

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: {
    environment: environment
    project: 'seo-intelligence-platform'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════════════════════

module logging 'modules/logging.bicep' = {
  name: 'logging'
  scope: rg
  params: {
    location: location
    logAnalyticsName: logAnalyticsName
  }
}

module containerRegistry 'modules/acr.bicep' = {
  name: 'containerRegistry'
  scope: rg
  params: {
    location: location
    registryName: containerRegistryName
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  scope: rg
  params: {
    location: location
    keyVaultName: keyVaultName
  }
}

module databases 'modules/databases.bicep' = {
  name: 'databases'
  scope: rg
  params: {
    location: location
    baseName: baseName
    environment: environment
    keyVaultName: keyVault.outputs.keyVaultName
  }
}

module containerApps 'modules/container-apps.bicep' = {
  name: 'containerApps'
  scope: rg
  params: {
    location: location
    environmentName: containerAppsEnvName
    logAnalyticsWorkspaceId: logging.outputs.workspaceId
    registryName: containerRegistry.outputs.registryName
    registryLoginServer: containerRegistry.outputs.loginServer
    keyVaultName: keyVault.outputs.keyVaultName
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUTS
// ═══════════════════════════════════════════════════════════════════════════════

output resourceGroupName string = rg.name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output keyVaultUri string = keyVault.outputs.keyVaultUri
output containerAppsEnvironmentId string = containerApps.outputs.environmentId
