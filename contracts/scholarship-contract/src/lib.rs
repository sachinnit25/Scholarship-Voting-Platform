#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    symbol_short, Env, Symbol, Vec, Map, Address, String
};

// Storage keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const CANDIDATES: Symbol = symbol_short!("CAND");
const VOTERS: Symbol = symbol_short!("VOTER");
const VOTING_ACTIVE: Symbol = symbol_short!("ACTIVE");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Candidate {
    pub id: u32,
    pub owner: Address,
    pub name: String,
    pub major: String,
    pub description: String,
    pub requested_amount: u32,
    pub vote_count: u32,
    pub approved: bool,
}

#[contract]
pub struct DecentralizedScholarshipVoting;

#[contractimpl]
impl DecentralizedScholarshipVoting {

    // Initialize contract
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&VOTING_ACTIVE, &true);
    }

    // Apply for scholarship (anyone can apply, starts as unapproved)
    pub fn apply_scholarship(
        env: Env,
        student: Address,
        name: String,
        major: String,
        description: String,
        requested_amount: u32,
    ) -> u32 {
        student.require_auth();

        let mut candidates: Vec<Candidate> =
            env.storage().instance().get(&CANDIDATES).unwrap_or(Vec::new(&env));

        let candidate_id = candidates.len();

        candidates.push_back(Candidate {
            id: candidate_id,
            owner: student,
            name,
            major,
            description,
            requested_amount,
            vote_count: 0,
            approved: false, // Must be approved by admin
        });

        env.storage().instance().set(&CANDIDATES, &candidates);
        candidate_id
    }

    // Approve candidate (admin only)
    pub fn approve_candidate(env: Env, candidate_id: u32) {
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Not initialized");
        admin.require_auth();

        let mut candidates: Vec<Candidate> =
            env.storage().instance().get(&CANDIDATES).expect("No candidates found");

        if candidate_id >= candidates.len() {
            panic!("Invalid candidate ID");
        }

        let mut candidate = candidates.get(candidate_id).unwrap();
        candidate.approved = true;

        candidates.set(candidate_id, candidate);
        env.storage().instance().set(&CANDIDATES, &candidates);
    }

    // Cast a vote for an approved candidate (each voter can vote only once, and voting must be active)
    pub fn vote(env: Env, voter: Address, candidate_id: u32) {
        voter.require_auth();

        // Check if voting is active
        let active: bool = env.storage().instance().get(&VOTING_ACTIVE).unwrap_or(false);
        if !active {
            panic!("Voting is closed");
        }

        // Check if voter has already voted
        let mut voters: Map<Address, bool> =
            env.storage().instance().get(&VOTERS).unwrap_or(Map::new(&env));

        if voters.get(voter.clone()).unwrap_or(false) {
            panic!("Already voted");
        }

        // Fetch candidates list
        let mut candidates: Vec<Candidate> =
            env.storage().instance().get(&CANDIDATES).expect("No candidates found");

        if candidate_id >= candidates.len() {
            panic!("Invalid candidate ID");
        }

        let mut candidate = candidates.get(candidate_id).unwrap();
        if !candidate.approved {
            panic!("Candidate is not approved for voting");
        }

        // Increment vote count
        candidate.vote_count += 1;
        candidates.set(candidate_id, candidate);
        env.storage().instance().set(&CANDIDATES, &candidates);

        // Mark voter as voted
        voters.set(voter, true);
        env.storage().instance().set(&VOTERS, &voters);
    }

    // Close voting (admin only)
    pub fn end_voting(env: Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Not initialized");
        admin.require_auth();

        env.storage().instance().set(&VOTING_ACTIVE, &false);
    }

    // Get all candidates
    pub fn get_candidates(env: Env) -> Vec<Candidate> {
        env.storage()
            .instance()
            .get(&CANDIDATES)
            .unwrap_or(Vec::new(&env))
    }

    // Get specific candidate details
    pub fn get_candidate(env: Env, candidate_id: u32) -> Candidate {
        let candidates: Vec<Candidate> =
            env.storage().instance().get(&CANDIDATES).expect("No candidates found");

        if candidate_id >= candidates.len() {
            panic!("Invalid candidate ID");
        }

        candidates.get(candidate_id).unwrap()
    }

    // Check if voter has voted
    pub fn has_voted(env: Env, voter: Address) -> bool {
        let voters: Map<Address, bool> =
            env.storage().instance().get(&VOTERS).unwrap_or(Map::new(&env));

        voters.get(voter).unwrap_or(false)
    }

    // Get admin
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).expect("Not initialized")
    }

    // Get voting status
    pub fn is_voting_active(env: Env) -> bool {
        env.storage().instance().get(&VOTING_ACTIVE).unwrap_or(false)
    }
}

mod test;
