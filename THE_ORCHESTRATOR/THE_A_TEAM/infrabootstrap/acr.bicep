// ═══════════════════════════════════════════════════════════════════════════════
// AZURE CONTAINER REGISTRY MODULE
// ═══════════════════════════════════════════════════════════════════════════════

param location string
param registryName string

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'  // Use 'Standard' or 'Premium' for production
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

output registryName string = containerRegistry.name
output loginServer string = containerRegistry.properties.loginServer
