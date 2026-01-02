# Project Documentation: TokanA

## 1. Project Summary
**TokanA** is a specialized web application designed for **Token Filter Analysis** on blockchain networks (specifically tailored for BSC based on the BSCScan links). It provides a comprehensive dashboard for users to analyze token transactions, monitor specific buy/sell activities, and manage address tags for better identification.

The application allows users to:
- Input a Token Contract Address to retrieve transaction data.
- Filter transactions by block range, amount range, and specific addresses.
- Monitor "Buy" and "Sell" flows separately with dedicated address lists.
- View real-time aggregated data (Net Flow, Total Buy/Sell).
- Manage custom tags for wallet addresses to identify them easily in the table.
- View detailed transaction records and find similar transactions.

## 2. Project Structure
The project follows a standard **Vue 3 + Vite** directory structure.

```
tokanA/
├── public/              # Static assets (favicons, etc.)
├── src/                 # Source code
│   ├── api/             # Backend API interaction layer
│   ├── assets/          # Project assets (images, styles)
│   ├── constants/       # Global constants and configuration
│   ├── utils/           # Utility functions
│   ├── views/           # Vue Page components (Main Application Logic)
│   ├── App.vue          # Root Vue Component
│   ├── main.ts          # Application Entry Point
│   └── vite-env.d.ts    # TypeScript declarations for Vite
├── index.html           # HTML Entry point
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## 3. Module Breakdown & Core Code

### 3.1. API Module (`src/api/index.ts`)
This module handles all HTTP communication with the backend server. It uses `axios` for requests.

**Core Code Pieces:**
- **Axios Instance**: Configured with a 60s timeout and credential support (`withCredentials: true`). Interceptors are set up to handle response data unpacking and error logging.
- **Endpoints**:
    - `getTokenFilterAnalysisAggregate(params)`: The primary endpoint. It sends filter parameters (contract address, blocks, amounts, buy/sell groups) via POST to `/api/token-filter-analysis/aggregate` to get analyzed transaction data.
    - `getAddressTags(params)`: GET request to fetch tags for a specific address.
    - `addAddressTag(body)`: POST request to create a new tag for an address.
    - `updateAddressTag(body)`: PUT request to update an existing tag.
    - `deleteAddressTag(body)`: DELETE request to remove a tag.
    - `getUniqueAddressTags()`: GET request to fetch a list of all unique tags used in the system.

### 3.2. Views Module (`src/views/TokenFilterAnalysis.vue`)
This is the heart of the application, containing the single-page logic and UI.

**Core Code Pieces:**
- **State Management (Vue `ref/reactive`)**:
    - `searchParams`: Stores user inputs like `contractAddress`, `startBlock`, `endBlock`, `minAmount`, `decimals`.
    - `buyAddresses`/`sellAddresses`: Arrays of objects `{ from, to, data }` representing the dynamic list of address pairs to filter by.
    - `transactions`: The main list of transactions currently displayed.
    - `isPolling`: Boolean flag for the auto-refresh feature.
- **Data Fetching Logic**:
    - `fetchAllData()`: Orchestrates the main query. It builds the request payload using `buildRequestParams` and calls the API. It updates both buy and sell groups.
    - `fetchRowData(type, index)`: Fetches data for a specific buy or sell row (optimization to avoid reloading everything if only one row changed).
    - `startPolling()` / `stopPolling()`: Uses `setInterval` to periodically call `fetchAllData` based on `refreshInterval`.
- **UI Components (Arco Design)**:
    - Uses `<a-form>` for the top search bar.
    - Uses `<a-card>` to group "Buy Address Filter" and "Sell Address Filter" sections.
    - Uses `<a-table>` to display the transaction list with custom slots for formatting (e.g., coloring buy/sell amounts, linking to BSCScan).
    - Uses `<a-modal>` for the "Address Tag Management" and "Record Detail" features.
- **Features**:
    - **Dynamic Filtering**: Users can add/remove multiple "Buy" and "Sell" address pairs.
    - **Tagging System**: Clicking a tag icon opens a modal to assign a human-readable name to an address.
    - **Clipboard**: Integrated copy button for addresses and hashes.

### 3.3. Utils Module (`src/utils/clipboard.ts`)
A helper module for user interaction.

**Core Code Pieces:**
- `copyToClipboard(text)`: Attempts to use the modern `navigator.clipboard.writeText` API. If that fails (or context is not secure), it falls back to a legacy `document.execCommand('copy')` method using a hidden textarea. It provides user feedback via Arco's `Message` component.

### 3.4. Constants Module (`src/constants/baseURL.ts`)
Centralized configuration for the API connection.

**Core Code Pieces:**
- **Server Options**: Defines a map of available servers (`localhost`, `apiLocal`, `remote`).
- **Configuration**: Exports `baseURL` which is used by the API module. Currently set to `localhost`, but can be easily switched by uncommenting lines.

## 4. Technical Stack
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: Arco Design Vue
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **CSS Preprocessor**: SCSS
