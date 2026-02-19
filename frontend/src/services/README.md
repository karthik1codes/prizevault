# Storage Service Documentation

## Overview

The storage service provides secure storage for Verifiable Credentials (VCs) in the wallet. Currently implemented with localStorage, with support for Firestore integration.

## Features

- ✅ Secure localStorage-based storage
- ✅ Add, remove, and retrieve credentials
- ✅ Import/Export functionality
- ✅ Storage statistics
- ✅ Automatic metadata tracking (receivedAt, storedAt)
- ✅ Duplicate prevention
- 🔄 Firestore integration (placeholder for future)

## Usage

### Basic Operations

```javascript
import { 
  addCredential, 
  getStoredCredentials, 
  removeCredential,
  getCredentialById 
} from './services/storageService'

// Add a new credential
const vc = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "http://example.edu/credentials/3732",
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  // ... rest of credential
}

addCredential(vc)

// Get all stored credentials
const allVCs = getStoredCredentials()

// Get a specific credential
const vc = getCredentialById('http://example.edu/credentials/3732')

// Remove a credential
removeCredential('http://example.edu/credentials/3732')
```

### Import/Export

```javascript
import { exportCredentials, importCredentials } from './services/storageService'

// Export all credentials as JSON
const json = exportCredentials()

// Import credentials from JSON
importCredentials(jsonString)
```

### Storage Statistics

```javascript
import { getStorageStats } from './services/storageService'

const stats = getStorageStats()
console.log(stats.count) // Number of credentials
console.log(stats.storageSizeKB) // Storage size in KB
```

## Storage Structure

Credentials are stored with additional metadata:

```javascript
{
  ...originalVC,
  receivedAt: "2024-01-15T10:00:00Z", // When credential was received
  storedAt: "2024-01-15T10:00:00Z"    // When credential was stored
}
```

## Firestore Integration (Future)

To enable Firestore storage:

1. Install Firebase SDK:
```bash
npm install firebase
```

2. Configure Firebase in `storageService.js`:
```javascript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  // Your Firebase config
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
```

3. Update `storageConfig.type` to `'firestore'`

## Security Considerations

- Credentials are stored in browser localStorage (client-side only)
- For production, consider:
  - Encrypting sensitive credential data
  - Using secure storage mechanisms
  - Implementing proper access controls
  - Using Firestore with proper security rules

## Storage Limits

- localStorage typically has a 5-10MB limit
- The service handles quota exceeded errors gracefully
- Consider implementing cleanup strategies for large datasets

