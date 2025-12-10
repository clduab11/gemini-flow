// ═══════════════════════════════════════════════════════════════════════════════
// DATABASES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

param location string
param baseName string
param environment string
param keyVaultName string

// ═══════════════════════════════════════════════════════════════════════════════
// POSTGRESQL
// ═══════════════════════════════════════════════════════════════════════════════

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '${baseName}-${environment}-postgres'
  location: location
  sku: {
    name: environment == 'prod' ? 'Standard_D2s_v3' : 'Standard_B1ms'
    tier: environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'seoplatform'
    administratorLoginPassword: 'REPLACE_WITH_GENERATED_PASSWORD'  // Use Key Vault in practice
    storage: {
      storageSizeGB: environment == 'prod' ? 128 : 32
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 35 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: 'seo_platform'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REDIS
// ═══════════════════════════════════════════════════════════════════════════════

resource redisCache 'Microsoft.Cache/redis@2023-04-01' = {
  name: '${baseName}-${environment}-redis'
  location: location
  properties: {
    sku: {
      name: environment == 'prod' ? 'Standard' : 'Basic'
      family: 'C'
      capacity: environment == 'prod' ? 1 : 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'volatile-lru'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COSMOS DB (MongoDB API)
// ═══════════════════════════════════════════════════════════════════════════════

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: '${baseName}-${environment}-cosmos'
  location: location
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
      {
        name: 'EnableServerless'
      }
    ]
    apiProperties: {
      serverVersion: '4.2'
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'seo_platform'
  properties: {
    resource: {
      id: 'seo_platform'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HUBS (Kafka API)
// ═══════════════════════════════════════════════════════════════════════════════

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' = {
  name: '${baseName}-${environment}-eventhub'
  location: location
  sku: {
    name: environment == 'prod' ? 'Standard' : 'Basic'
    tier: environment == 'prod' ? 'Standard' : 'Basic'
    capacity: 1
  }
  properties: {
    kafkaEnabled: true
  }
}

resource eventHub 'Microsoft.EventHub/namespaces/eventhubs@2022-10-01-preview' = {
  parent: eventHubNamespace
  name: 'seo-events'
  properties: {
    partitionCount: 4
    messageRetentionInDays: 1
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE SECRETS IN KEY VAULT
// ═══════════════════════════════════════════════════════════════════════════════

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: keyVaultName
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: 'postgresql://seoplatform:REPLACE_WITH_GENERATED_PASSWORD@${postgresServer.properties.fullyQualifiedDomainName}:5432/seo_platform?sslmode=require'
  }
}

resource redisUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'REDIS-URL'
  properties: {
    value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380'
  }
}

resource mongoUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'MONGODB-URL'
  properties: {
    value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUTS
// ═══════════════════════════════════════════════════════════════════════════════

output postgresServerName string = postgresServer.name
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output redisCacheName string = redisCache.name
output cosmosAccountName string = cosmosAccount.name
