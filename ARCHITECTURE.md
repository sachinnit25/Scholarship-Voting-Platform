# Technical Architecture & API Documentation

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                        │
│              React + TypeScript + Vite                       │
│            https://frontend-eta-seven-24.vercel.app          │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ HTTPS
                  │
        ┌─────────▼──────────┐
        │  Freighter Wallet  │
        │  (User Signing)    │
        └─────────┬──────────┘
                  │
                  │ Stellar Network
                  │
    ┌─────────────▼──────────────────┐
    │   Stellar Testnet RPC          │
    │   soroban-testnet.stellar.org   │
    └─────────────┬──────────────────┘
                  │
                  │
    ┌─────────────▼──────────────────────────┐
    │   Soroban Smart Contract               │
    │   CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYT... │
    │   (On-chain Voting Logic)              │
    └────────────────────────────────────────┘
```

## Contract Interface

### State Variables
- `admin`: Address of contract administrator
- `voting_active`: Boolean flag for voting period
- `candidates`: Vector of candidate records
- `votes`: Map of voter addresses to candidate IDs

### Contract Functions

#### 1. `initialize(admin_address: Address)`
Initializes contract with admin address.

**Parameters:**
- `admin_address`: Stellar public key of administrator

**Returns:** Boolean success flag

**Permissions:** Anyone (idempotent)

---

#### 2. `apply_scholarship(name: String, major: String, description: String, amount: i128)`
Submit a scholarship application.

**Parameters:**
- `name`: Applicant's full name
- `major`: Field of study
- `description`: Proposal essay
- `amount`: XLM amount requested

**Returns:** Candidate ID (integer)

**Permissions:** Any user with funded account

---

#### 3. `approve_candidate(candidate_id: u32)`
Admin approves a candidate application.

**Parameters:**
- `candidate_id`: ID of candidate to approve

**Returns:** Boolean success

**Permissions:** Admin only

---

#### 4. `vote(voter_address: Address, candidate_id: u32)`
Cast a vote for a candidate.

**Parameters:**
- `voter_address`: Address of voter
- `candidate_id`: ID of candidate to vote for

**Returns:** Boolean success

**Permissions:** Any user, voting must be active

**Constraints:**
- Each address can only vote once
- Voting must be active
- Candidate must be approved

---

#### 5. `end_voting()`
Closes the voting period.

**Returns:** Boolean success

**Permissions:** Admin only

---

#### 6. `get_admin() -> Address`
Retrieve admin address.

**Returns:** Current admin address

---

#### 7. `get_candidate(id: u32) -> Candidate`
Get candidate details.

**Parameters:**
- `id`: Candidate ID

**Returns:** Candidate struct with name, major, description, votes, approval status

---

#### 8. `get_candidates() -> Vec<Candidate>`
Retrieve all candidates.

**Returns:** Array of all candidate records

---

#### 9. `has_voted(voter: Address) -> bool`
Check if address has voted.

**Parameters:**
- `voter`: Address to check

**Returns:** Boolean vote status

---

#### 10. `is_voting_active() -> bool`
Check voting period status.

**Returns:** Current voting active state

---

## Frontend API Integration

### Service Layer: `stellarService.ts`

#### Wallet Functions
```typescript
connectWallet(): Promise<string>
getXLMBalance(publicKey: string): Promise<string>
```

#### Contract Interaction Functions
```typescript
initializeContract(contractId: string, adminAddress: string)
applyForScholarship(contractId: string, name: string, major: string, essay: string, amount: number)
approveCandidate(contractId: string, candidateId: number)
voteForCandidate(contractId: string, voterAddress: string, candidateId: number)
endVoting(contractId: string)
```

#### Query Functions
```typescript
getAdmin(contractId: string)
getCandidate(contractId: string, id: number)
getAllCandidates(contractId: string)
hasVoted(contractId: string, voterAddress: string)
isVotingActive(contractId: string)
```

## Network Configuration

**RPC Endpoint:** `https://soroban-testnet.stellar.org`  
**Horizon API:** `https://horizon-testnet.stellar.org`  
**Network Passphrase:** `Test SDF Network ; September 2015`

## Data Flow

### Applying for Scholarship
1. User fills form (name, major, essay, amount)
2. Frontend calls `applyForScholarship()`
3. Transaction constructed and signed with Freighter
4. Sent to Stellar Testnet
5. Soroban host processes contract call
6. Candidate added to contract storage
7. Candidate ID returned to frontend
8. UI updated with success message

### Voting Process
1. User selects candidate
2. Frontend calls `voteForCandidate()`
3. Contract checks:
   - Voting is active
   - User hasn't voted yet
   - Candidate is approved
4. Vote recorded in contract state
5. Vote count incremented
6. Confirmation returned to frontend

## Error Handling

**Application Level:**
- Transaction simulation failures
- Invalid contract address
- Wallet connection errors
- Insufficient XLM balance

**Contract Level:**
- Double voting attempts
- Voting while inactive
- Unapproved candidate selection
- Admin-only action violations

## Performance Characteristics

- Contract initialization: ~5-10 seconds
- Candidate submission: ~8-15 seconds
- Vote submission: ~8-15 seconds
- Query operations: <1 second
- XLM balance check: 2-3 seconds

## Security Considerations

1. **Private Key Security:** Never stored on frontend; handled by Freighter
2. **Transaction Verification:** All txns signed and verified
3. **Double-Voting Prevention:** Enforced at contract level
4. **Admin Verification:** Contract ensures admin authority
5. **State Immutability:** On-chain records cannot be altered retroactively

## Deployment Status

✅ Contract: Deployed on Stellar Testnet  
✅ Frontend: Deployed on Vercel  
✅ All functionality: Tested and operational  
✅ Integration: Fully functional end-to-end
