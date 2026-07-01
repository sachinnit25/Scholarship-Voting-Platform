# Decentralized Scholarship Voting Platform

A premium decentralized application (dApp) built on the **Stellar Blockchain** using **Soroban smart contracts** and a **React + TypeScript + Vite** frontend. 

The platform enables students to submit scholarship applications on-chain, allows administrators to review and approve candidacies, and lets community members securely vote for projects using their **Freighter Wallets**.

---

## 🌟 Key Features

*   **Immutable Candidate Registration**: Students can apply for scholarships by submitting their name, major, proposal essay, and requested amount directly to the blockchain.
*   **Dual-Perspective UI**: Toggle between Voter and Admin interfaces inside the dashboard for easy demonstration.
*   **Freighter Wallet Integration**: Fully integrated wallet connection fetching active address and real-time XLM balances on Stellar Testnet.
*   **Robust Smart Contract Logic**: Built with Rust & Soroban SDK including comprehensive unit tests validating application flows, double-voting prevention, and admin checks.
*   **Dynamic Styling**: Modern, glowing glassmorphism theme using deep space colors, custom progress bars, and animated toast feedback.
*   **Simulation Mode Fallback**: If no contract address is set, the app runs in **Simulation Mode** using local state and mocks, making it instantly demo-ready.

---

## 📁 Repository Structure

```
d:\Scholarship Voting Platform\
├── Cargo.toml                      # Workspace configurations
├── README.md                       # Documentation (This file)
├── contract/                       # Soroban Smart Contract source
│   └── scholarship-contract/
│       ├── Cargo.toml              # Rust dependency manager
│       ├── Makefile                # Build/test helpers
│       └── src/
│           ├── lib.rs              # Smart contract logic
│           └── test.rs             # Unit tests
├── contracts/                      # Mirror of the contract layout
│   └── scholarship-contract/
│       ├── Cargo.toml
│       └── src/
└── frontend/                       # React client
    ├── package.json                # NPM packages
    ├── index.html                  # HTML entry point (Outfit font)
    ├── vite.config.ts              # Vite configurations
    └── src/
        ├── main.tsx                # React mount point
        ├── index.css               # Global theme & typography
        ├── App.tsx                 # Core dashboard component
        ├── App.css                 # Glassmorphic layout & animations
        └── services/
            └── stellarService.ts   # Freighter connection & contract endpoints
```

---

## 🛠️ Prerequisites

Ensure you have the following installed on your local machine:
*   [Rust & Cargo](https://www.rust-lang.org/tools/install)
*   [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) (replaces Soroban CLI in newer versions)
*   [Node.js (v18+)](https://nodejs.org/)
*   [Freighter Wallet Extension](https://www.freighter.app/) installed in your browser.

---

## 🦀 Smart Contract Development

## CONTRACT ADDRESS : CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYTSJ5GPLYARPRDAGAOEYTKV5P3

### 1. Run Unit Tests
To verify the contract's business logic, compile and run the test suite locally:
```bash
cd contract/scholarship-contract
cargo test
```

### 2. Build the Contract
Compile the Rust code into optimized WebAssembly (`.wasm`) format:
```bash
stellar contract build
```
This produces `target/wasm32-unknown-unknown/release/scholarship_contract.wasm`.

### 3. Deploy to Stellar Testnet
Create or import an account in the Stellar CLI and deploy the compiled WASM:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/scholarship_contract.wasm \
  --source <YOUR_ACCOUNT_NAME> \
  --network testnet
```
**Take note of the Contract ID** printed in the output console (e.g., `CD5DYYJ7...`).

---

## 💻 Frontend Setup

### 1. Install Dependencies
Navigate into the frontend directory and install the packages:
```bash
cd frontend
npm install
```

### 2. Configure the Contract ID
*   Open [frontend/src/App.tsx](file:///d:/Scholarship%20Voting%20Platform/frontend/src/App.tsx).
*   Locate the `contractId` state initialization (around line 52):
    ```typescript
    const [contractId, setContractId] = useState<string>("YOUR_DEPLOYED_CONTRACT_ID");
    ```
*   Replace `"PLACEHOLDER_CONTRACT_ID"` with your newly deployed Contract ID, or simply launch the app and paste it inside the **Settings Panel** (gear icon) in the header.

### 3. Start Development Server
Run the local dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Freighter Wallet Configuration
1.  Open the Freighter extension.
2.  Go to **Settings** -> **Preferences** -> **Network** and set it to **Testnet**.
3.  Fund your wallet using the Friendbot faucet at [https://laboratory.stellar.org/#account-creator](https://laboratory.stellar.org/#account-creator) to receive 10,000 test XLM.

---

## 🚀 Live Deployment

The application is deployed and ready to use on Stellar Testnet.

### Proof of Testnet Deployment
- **Live dApp URL**: https://frontend-eta-seven-24.vercel.app
- **Alternate Vercel URL**: https://frontend-iwkz8ejfu-yodhadigital331-8554s-projects.vercel.app
- **Stellar Testnet Contract**: https://lab.stellar.org/r/testnet/contract/CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYTSJ5P3
- **Transaction Proof**: https://stellar.expert/explorer/testnet/tx/f4dec41192442c545dfc4fb13366552a5e3180e521be82bb14fcdd2dd1aa0ff9

**Contract Information:**
- **Network**: Stellar Testnet
- **Contract ID**: `CBL6SY43NK7VWYJ6J3RYTSJ5GPLYARPRDAGAOEYTKV5P3`
- **Status**: Active and ready for transactions

### CI/CD Pipeline
This repository includes a GitHub Actions workflow that automatically:
- runs frontend lint and build checks on every push and pull request
- runs Soroban contract tests
- deploys the frontend to Vercel when changes are merged into the main branch and Vercel secrets are configured

Simply visit the deployed testnet URL above with your Freighter Wallet configured for Testnet to start voting on scholarship applications!
