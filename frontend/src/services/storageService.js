/**
 * Storage Service for Verifiable Credentials
 * Supports localStorage (default) and can be extended for Firestore
 */

const STORAGE_KEY = 'wallet_vc_storage'
const STORAGE_VERSION = '1.0.0'

// Storage configuration
const storageConfig = {
  type: 'localStorage', // 'localStorage' or 'firestore'
  encryptionEnabled: false // Set to true to enable encryption
}

/**
 * Get all stored credentials from localStorage
 */
export const getStoredCredentials = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    
    // Validate storage version
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, migrating...')
      // Migration logic can be added here
    }

    return parsed.credentials || []
  } catch (error) {
    console.error('Error reading stored credentials:', error)
    return []
  }
}

/**
 * Save credentials to localStorage
 */
export const saveCredentials = (credentials) => {
  try {
    const storageData = {
      version: STORAGE_VERSION,
      credentials: credentials,
      lastUpdated: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    return true
  } catch (error) {
    console.error('Error saving credentials:', error)
    
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some credentials.')
    }
    
    return false
  }
}

/**
 * Add a new credential to storage
 */
export const addCredential = (credential) => {
  try {
    // Validate credential structure
    if (!credential || typeof credential !== 'object') {
      throw new Error('Invalid credential format')
    }

    // Check if credential already exists (by ID)
    const existing = getStoredCredentials()
    const existingIndex = existing.findIndex(vc => vc.id === credential.id)
    
    if (existingIndex !== -1) {
      // Update existing credential
      existing[existingIndex] = {
        ...credential,
        receivedAt: existing[existingIndex].receivedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } else {
      // Add new credential with metadata
      const credentialWithMetadata = {
        ...credential,
        receivedAt: new Date().toISOString(),
        storedAt: new Date().toISOString()
      }
      existing.push(credentialWithMetadata)
    }

    return saveCredentials(existing)
  } catch (error) {
    console.error('Error adding credential:', error)
    throw error
  }
}

/**
 * Remove a credential from storage
 */
export const removeCredential = (credentialId) => {
  try {
    const existing = getStoredCredentials()
    const filtered = existing.filter(vc => vc.id !== credentialId)
    return saveCredentials(filtered)
  } catch (error) {
    console.error('Error removing credential:', error)
    return false
  }
}

/**
 * Get a specific credential by ID
 */
export const getCredentialById = (credentialId) => {
  try {
    const credentials = getStoredCredentials()
    return credentials.find(vc => vc.id === credentialId) || null
  } catch (error) {
    console.error('Error getting credential:', error)
    return null
  }
}

/**
 * Clear all stored credentials
 */
export const clearAllCredentials = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing credentials:', error)
    return false
  }
}

/**
 * Export credentials as JSON
 */
export const exportCredentials = () => {
  try {
    const credentials = getStoredCredentials()
    return JSON.stringify(credentials, null, 2)
  } catch (error) {
    console.error('Error exporting credentials:', error)
    return null
  }
}

/**
 * Import credentials from JSON
 */
export const importCredentials = (jsonString) => {
  try {
    const imported = JSON.parse(jsonString)
    
    if (!Array.isArray(imported)) {
      throw new Error('Invalid import format. Expected an array of credentials.')
    }

    // Validate each credential
    const validCredentials = imported.filter(vc => {
      return vc && typeof vc === 'object' && vc.id
    })

    // Merge with existing credentials (avoid duplicates)
    const existing = getStoredCredentials()
    const existingIds = new Set(existing.map(vc => vc.id))
    
    const newCredentials = validCredentials.filter(vc => !existingIds.has(vc.id))
    const merged = [...existing, ...newCredentials]

    return saveCredentials(merged)
  } catch (error) {
    console.error('Error importing credentials:', error)
    throw error
  }
}

/**
 * Get storage statistics
 */
export const getStorageStats = () => {
  try {
    const credentials = getStoredCredentials()
    const storageSize = new Blob([localStorage.getItem(STORAGE_KEY)]).size
    
    return {
      count: credentials.length,
      storageSize: storageSize,
      storageSizeKB: (storageSize / 1024).toFixed(2),
      lastUpdated: credentials.length > 0 
        ? credentials[credentials.length - 1].storedAt || 'Unknown'
        : 'Never'
    }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return {
      count: 0,
      storageSize: 0,
      storageSizeKB: '0',
      lastUpdated: 'Never'
    }
  }
}

// Firestore integration (placeholder for future implementation)
export const initializeFirestore = async (config) => {
  // TODO: Implement Firestore initialization
  console.log('Firestore integration not yet implemented')
  return false
}

export const syncToFirestore = async () => {
  // TODO: Implement Firestore sync
  console.log('Firestore sync not yet implemented')
  return false
}

