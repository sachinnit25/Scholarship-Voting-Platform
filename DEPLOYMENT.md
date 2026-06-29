# Contract Deployment Guide

## Network: Stellar Testnet

### Contract Address
```
CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYTSJ5GPLYARPRDAGAOEYTKV5P3
```

### Deployment Details

**Deployed Date:** June 29, 2026  
**Network:** Stellar Testnet  
**WASM Hash:** `9540815628844157bba229bccf6dbd63c5346e4784b3a2e4e664a0f85a3e66e0`  
**File Size:** 4,411 bytes (optimized)  

### Transaction Link
- Explorer: https://stellar.expert/explorer/testnet/tx/f4dec41192442c545dfc4fb13366552a5e3180e521be82bb14fcdd2dd1aa0ff9
- Lab Link: https://lab.stellar.org/r/testnet/contract/CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYTSJ5GPLYARPRDAGAOEYTKV5P3

### Contract Functions
The deployed contract includes the following 10 exported functions:

1. **initialize** - Initialize the contract with admin address
2. **apply_scholarship** - Allow students to apply for scholarships
3. **approve_candidate** - Admin approval of scholarship candidates
4. **vote** - Community members vote for scholarship recipients
5. **end_voting** - Admin function to close voting period
6. **get_admin** - Retrieve current admin address
7. **get_candidate** - Get specific candidate information
8. **get_candidates** - Retrieve all candidates
9. **has_voted** - Check if address has voted
10. **is_voting_active** - Check if voting period is active

### Deployment Steps Performed

```bash
# 1. Build the contract
stellar contract build

# 2. Upload WASM to ledger
stellar contract upload --wasm target/wasm32v1-none/release/scholarship_contract.wasm \
  --source-account scholarship-deploy --network testnet

# 3. Deploy contract instance
stellar contract deploy --wasm-hash 9540815628844157bba229bccf6dbd63c5346e4784b3a2e4e664a0f85a3e66e0 \
  --source-account scholarship-deploy --network testnet --alias scholarship-voting
```

### Verification
The contract is fully functional and ready for:
- Candidate registration
- Admin approval workflows
- Community voting
- Vote counting and results

All features have been tested with the frontend application.
