# Development Setup & Contribution Guide

## Local Development Setup

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- Rust & Cargo (https://www.rust-lang.org/tools/install)
- Git (https://git-scm.com/)
- Stellar CLI (installed via `cargo install stellar-cli`)
- Freighter Wallet Extension

### Frontend Setup

```bash
# 1. Clone repository
git clone https://github.com/sachinnit25/Scholarship-Voting-Platform.git
cd Scholarship\ Voting\ Platform

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Start development server
npm run dev

# App will be available at http://localhost:5173
```

### Smart Contract Setup

```bash
# 1. Navigate to contract directory
cd contract/scholarship-contract

# 2. Run unit tests
cargo test

# 3. Build contract
stellar contract build

# Output: target/wasm32v1-none/release/scholarship_contract.wasm
```

### Environment Variables

Create `.env` file in `frontend/` directory:
```
VITE_NETWORK=testnet
VITE_CONTRACT_ID=<your-deployed-contract-id>
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

---

## Project Structure

```
Scholarship Voting Platform/
├── contract/
│   └── scholarship-contract/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs          # Smart contract code
│           └── test.rs         # Unit tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main component
│   │   ├── App.css            # Styling
│   │   ├── main.tsx           # React entry point
│   │   ├── index.css          # Global styles
│   │   └── services/
│   │       └── stellarService.ts  # Blockchain integration
│   ├── package.json
│   ├── vite.config.ts         # Build config
│   └── tsconfig.json          # TypeScript config
├── README.md
├── DEPLOYMENT.md
├── FEATURES.md
└── Cargo.toml (workspace)
```

---

## Development Workflow

### Making Changes

#### Frontend Changes
```bash
cd frontend

# Make your changes in src/

# Run dev server to see live reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

#### Smart Contract Changes
```bash
cd contract/scholarship-contract

# Make your changes in src/

# Build contract
stellar contract build

# Run tests
cargo test

# Run specific test
cargo test test_voting
```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "Description of changes"

# 3. Push to GitHub
git push origin feature/your-feature-name

# 4. Create Pull Request on GitHub
```

### Commit Message Guidelines

Follow conventional commits:
```
feat: Add new voting feature
fix: Correct wallet connection error
docs: Update README with new info
style: Format code with prettier
test: Add voting validation tests
chore: Update dependencies
refactor: Reorganize component structure
```

---

## Testing

### Running Tests

#### Frontend Tests
```bash
npm test
```

#### Contract Tests
```bash
cargo test
```

#### Run Specific Tests
```bash
cargo test test_double_voting
cargo test test_approval_workflow
```

#### Run Tests with Output
```bash
cargo test -- --nocapture --test-threads=1
```

### Test Coverage

```bash
# Generate coverage report (requires tarpaulin)
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

---

## Debugging

### Frontend Debugging

#### Chrome DevTools
1. Open app in Chrome
2. Press F12 or Right-click → Inspect
3. Check Console tab for errors
4. Use Debugger tab for breakpoints

#### VSCode Debugging
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### Contract Debugging

```bash
# Enable debug logging
RUST_LOG=debug cargo test test_voting -- --nocapture

# Print debug info
eprintln!("Debug: {:?}", value);
```

---

## Code Style

### Frontend (TypeScript/React)

```bash
# Format code
npx prettier --write src/

# Check lint
npm run lint

# Fix lint issues
npm run lint -- --fix
```

### Smart Contract (Rust)

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt -- --check

# Run clippy (linter)
cargo clippy

# Fix clippy warnings
cargo clippy --fix
```

---

## Building & Deployment

### Local Build

#### Frontend Build
```bash
cd frontend
npm run build

# Output: dist/
```

#### Contract Build
```bash
cd contract/scholarship-contract
stellar contract build

# Output: target/wasm32v1-none/release/scholarship_contract.wasm
```

### Deployment to Testnet

#### Deploy Contract
```bash
# Set up account
stellar keys generate my-account --network testnet --fund

# Upload WASM
stellar contract upload --wasm scholarship_contract.wasm \
  --source-account my-account --network testnet

# Deploy instance
stellar contract deploy --wasm-hash <hash> \
  --source-account my-account --network testnet
```

#### Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## Performance Optimization

### Frontend Optimization

```typescript
// Use React.memo for pure components
export const CandidateCard = React.memo(({ candidate }) => {
  // Component code
});

// Use useCallback to memoize functions
const handleVote = useCallback((id) => {
  voteForCandidate(contractId, walletAddress, id);
}, [contractId, walletAddress]);
```

### Contract Optimization

```rust
// Use efficient data structures
// Avoid unnecessary clones
// Optimize gas consumption
// Use streaming where possible
```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'stellar-sdk'"
**Solution:** Run `npm install` in frontend directory

### Issue: "WASM target not installed"
**Solution:** Run `rustup target add wasm32v1-none`

### Issue: "Freighter not detected"
**Solution:** Install Freighter extension from https://www.freighter.app/

### Issue: "Insufficient balance for transaction"
**Solution:** Fund account using Friendbot at https://laboratory.stellar.org/

### Issue: Port 5173 already in use
**Solution:** Kill process or use different port: `npm run dev -- --port 3000`

---

## Contributing

### Before Contributing

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Read CONTRIBUTING.md (if exists)

### Code Review Process

1. Make sure all tests pass
2. Update documentation
3. Create Pull Request
4. Address review feedback
5. Merge when approved

### Contribution Guidelines

✅ **DO:**
- Follow existing code style
- Add tests for new features
- Update documentation
- Write clear commit messages
- Create meaningful PRs

❌ **DON'T:**
- Commit large unrelated changes
- Skip tests
- Ignore code review feedback
- Rewrite commit history
- Push to main directly

---

## Resources

### Documentation
- [Stellar Docs](https://developers.stellar.org/)
- [Soroban Guide](https://developers.stellar.org/docs/soroban/)
- [React Docs](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)

### Tools
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet)
- [Stellar Laboratory](https://lab.stellar.org/)
- [VSCode Extensions](https://marketplace.visualstudio.com/)

### Community
- [Stellar Discord](https://discord.gg/stellardev)
- [GitHub Discussions](https://github.com/sachinnit25/Scholarship-Voting-Platform/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stellar)

---

## Support

For questions or issues:
1. Check existing documentation
2. Search GitHub issues
3. Create new issue with details
4. Join Stellar community Discord

---

**Happy coding! 🚀**

Last updated: June 29, 2026
