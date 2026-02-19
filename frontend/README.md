# DID Issuer Frontend

A modern React-based frontend application for managing Decentralized Identifier (DID) credentials.

## Features

- **Header**: Navigation bar with user info and wallet connection
- **Wallet View**: Display wallet connection status, address, and balance
- **Credential List**: View and manage issued credentials

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd ciphers_2.0/issuer/did/frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

### Preview Production Build

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Header component
│   │   ├── WalletView.jsx      # Wallet view component
│   │   ├── CredentialList.jsx  # Credential list component
│   │   ├── Header.css
│   │   ├── WalletView.css
│   │   ├── CredentialList.css
│   │   └── shared.css          # Shared styles
│   ├── App.jsx                 # Main app component
│   ├── App.css
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js             # Vite configuration
└── package.json               # Dependencies
```

## Technologies Used

- **React 18**: UI library
- **Vite 7**: Build tool and dev server
- **IPFS HTTP Client**: For IPFS interactions
- **CSS3**: Modern styling with CSS variables

## Security & Dependencies

All security vulnerabilities have been resolved:
- ✅ Updated Vite to version 7.2.2 to fix esbuild vulnerabilities
- ✅ Added npm overrides to fix nanoid and parse-duration vulnerabilities in ipfs-http-client dependencies

### Note on Deprecation Warnings

You may see deprecation warnings about `ipfs-http-client` and related packages being deprecated in favor of Helia. These are **warnings only** and will not prevent the application from working. The package is still functional, but consider migrating to [Helia](https://github.com/ipfs/helia) for future-proofing.

## Customization

The application uses CSS variables for easy theming. Modify the variables in `src/index.css` to change colors, spacing, and other design tokens.

