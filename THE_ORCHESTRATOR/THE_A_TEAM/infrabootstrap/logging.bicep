// ═══════════════════════════════════════════════════════════════════════════════
// LOGGING MODULE
// ═══════════════════════════════════════════════════════════════════════════════

param location string
param logAnalyticsName string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${logAnalyticsName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

output workspaceId string = logAnalytics.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString
