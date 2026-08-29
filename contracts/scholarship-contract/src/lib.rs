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
const USER_PROFILES: Symbol = symbol_short!("PROFILES");
const CREDITS: Symbol = symbol_short!("CREDITS");
const QV_VOTES: Symbol = symbol_short!("QVVOTES");
const MILESTONES: Symbol = symbol_short!("MILESTN");
const APPEALS: Symbol = symbol_short!("APPEALS");

const DEFAULT_VOTER_CREDITS: u32 = 100;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProfile {
    pub user: Address,
    pub cohort_month: String,
    pub is_new_monthly_user: bool,
    pub onboarded_timestamp: u64,
    pub onboarding_completed: bool,
}

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
    pub effective_qv_score: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GrantMilestone {
    pub id: u32,
    pub candidate_id: u32,
    pub description: String,
    pub percentage: u32,
    pub proof_uri: String,
    pub completed: bool,
    pub disbursed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeAppeal {
    pub id: u32,
    pub candidate_id: u32,
    pub appellant: Address,
    pub reason: String,
    pub appeal_uri: String,
    pub status: String, // "PENDING", "APPROVED", "REJECTED"
    pub votes_for: u32,
    pub votes_against: u32,
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
            effective_qv_score: 0,
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

        // Increment vote count and effective_qv_score
        candidate.vote_count += 1;
        candidate.effective_qv_score += 1;
        candidates.set(candidate_id, candidate);
        env.storage().instance().set(&CANDIDATES, &candidates);

        // Mark voter as voted
        voters.set(voter, true);
        env.storage().instance().set(&VOTERS, &voters);
    }

    // Cast quadratic votes for an approved candidate with N^2 credit cost scaling
    pub fn vote_quadratic(env: Env, voter: Address, candidate_id: u32, vote_units: u32) {
        voter.require_auth();

        if vote_units == 0 {
            panic!("Must vote at least 1 unit");
        }

        let active: bool = env.storage().instance().get(&VOTING_ACTIVE).unwrap_or(false);
        if !active {
            panic!("Voting is closed");
        }

        let mut candidates: Vec<Candidate> =
            env.storage().instance().get(&CANDIDATES).expect("No candidates found");

        if candidate_id >= candidates.len() {
            panic!("Invalid candidate ID");
        }

        let mut candidate = candidates.get(candidate_id).unwrap();
        if !candidate.approved {
            panic!("Candidate is not approved for voting");
        }

        let mut credits_map: Map<Address, u32> =
            env.storage().instance().get(&CREDITS).unwrap_or(Map::new(&env));
        let voter_credits = credits_map.get(voter.clone()).unwrap_or(DEFAULT_VOTER_CREDITS);

        let mut qv_votes_map: Map<Address, Map<u32, u32>> =
            env.storage().instance().get(&QV_VOTES).unwrap_or(Map::new(&env));
        let mut voter_cand_map: Map<u32, u32> =
            qv_votes_map.get(voter.clone()).unwrap_or(Map::new(&env));

        let current_votes = voter_cand_map.get(candidate_id).unwrap_or(0);
        let new_total_votes = current_votes + vote_units;

        let cost_old = current_votes * current_votes;
        let cost_new = new_total_votes * new_total_votes;
        let incremental_cost = cost_new - cost_old;

        if voter_credits < incremental_cost {
            panic!("Insufficient voting credits");
        }

        let new_credits = voter_credits - incremental_cost;
        credits_map.set(voter.clone(), new_credits);
        env.storage().instance().set(&CREDITS, &credits_map);

        voter_cand_map.set(candidate_id, new_total_votes);
        qv_votes_map.set(voter.clone(), voter_cand_map);
        env.storage().instance().set(&QV_VOTES, &qv_votes_map);

        candidate.vote_count += vote_units;
        candidate.effective_qv_score += vote_units;
        candidates.set(candidate_id, candidate);
        env.storage().instance().set(&CANDIDATES, &candidates);

        let mut voters: Map<Address, bool> =
            env.storage().instance().get(&VOTERS).unwrap_or(Map::new(&env));
        voters.set(voter, true);
        env.storage().instance().set(&VOTERS, &voters);
    }

    pub fn get_voter_credits(env: Env, voter: Address) -> u32 {
        let credits_map: Map<Address, u32> =
            env.storage().instance().get(&CREDITS).unwrap_or(Map::new(&env));
        credits_map.get(voter).unwrap_or(DEFAULT_VOTER_CREDITS)
    }

    pub fn get_voter_votes_for_candidate(env: Env, voter: Address, candidate_id: u32) -> u32 {
        let qv_votes_map: Map<Address, Map<u32, u32>> =
            env.storage().instance().get(&QV_VOTES).unwrap_or(Map::new(&env));
        if let Some(voter_cand_map) = qv_votes_map.get(voter) {
            voter_cand_map.get(candidate_id).unwrap_or(0)
        } else {
            0
        }
    }

    // --- Milestone Escrow Module ---

    // Add grant milestone for candidate (admin or student owner)
    pub fn add_grant_milestone(
        env: Env,
        candidate_id: u32,
        description: String,
        percentage: u32,
    ) -> u32 {
        let mut milestone_map: Map<u32, Vec<GrantMilestone>> =
            env.storage().instance().get(&MILESTONES).unwrap_or(Map::new(&env));

        let mut milestones = milestone_map.get(candidate_id).unwrap_or(Vec::new(&env));
        let milestone_id = milestones.len();

        milestones.push_back(GrantMilestone {
            id: milestone_id,
            candidate_id,
            description,
            percentage,
            proof_uri: String::from_str(&env, ""),
            completed: false,
            disbursed: false,
        });

        milestone_map.set(candidate_id, milestones);
        env.storage().instance().set(&MILESTONES, &milestone_map);
        milestone_id
    }

    // Submit milestone completion proof (student)
    pub fn submit_milestone_proof(
        env: Env,
        student: Address,
        candidate_id: u32,
        milestone_id: u32,
        proof_uri: String,
    ) {
        student.require_auth();

        let mut milestone_map: Map<u32, Vec<GrantMilestone>> =
            env.storage().instance().get(&MILESTONES).expect("No milestones configured");
        let mut milestones = milestone_map.get(candidate_id).expect("Candidate milestones not found");

        if milestone_id >= milestones.len() {
            panic!("Invalid milestone ID");
        }

        let mut milestone = milestones.get(milestone_id).unwrap();
        milestone.proof_uri = proof_uri;
        milestone.completed = true;

        milestones.set(milestone_id, milestone);
        milestone_map.set(candidate_id, milestones);
        env.storage().instance().set(&MILESTONES, &milestone_map);
    }

    // Approve & Disburse milestone funds (admin only)
    pub fn approve_and_disburse_milestone(env: Env, candidate_id: u32, milestone_id: u32) {
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Not initialized");
        admin.require_auth();

        let mut milestone_map: Map<u32, Vec<GrantMilestone>> =
            env.storage().instance().get(&MILESTONES).expect("No milestones configured");
        let mut milestones = milestone_map.get(candidate_id).expect("Candidate milestones not found");

        if milestone_id >= milestones.len() {
            panic!("Invalid milestone ID");
        }

        let mut milestone = milestones.get(milestone_id).unwrap();
        if !milestone.completed {
            panic!("Milestone proof not submitted yet");
        }

        milestone.disbursed = true;
        milestones.set(milestone_id, milestone);
        milestone_map.set(candidate_id, milestones);
        env.storage().instance().set(&MILESTONES, &milestone_map);
    }

    pub fn get_candidate_milestones(env: Env, candidate_id: u32) -> Vec<GrantMilestone> {
        let milestone_map: Map<u32, Vec<GrantMilestone>> =
            env.storage().instance().get(&MILESTONES).unwrap_or(Map::new(&env));
        milestone_map.get(candidate_id).unwrap_or(Vec::new(&env))
    }

    // --- Dispute Appeal DAO Module ---

    // Submit dispute appeal for rejected or flagged applications
    pub fn submit_dispute_appeal(
        env: Env,
        appellant: Address,
        candidate_id: u32,
        reason: String,
        appeal_uri: String,
    ) -> u32 {
        appellant.require_auth();

        let mut appeals: Vec<DisputeAppeal> =
            env.storage().instance().get(&APPEALS).unwrap_or(Vec::new(&env));

        let appeal_id = appeals.len();

        appeals.push_back(DisputeAppeal {
            id: appeal_id,
            candidate_id,
            appellant,
            reason,
            appeal_uri,
            status: String::from_str(&env, "PENDING"),
            votes_for: 0,
            votes_against: 0,
        });

        env.storage().instance().set(&APPEALS, &appeals);
        appeal_id
    }

    // Vote on a dispute appeal
    pub fn vote_on_appeal(env: Env, voter: Address, appeal_id: u32, approve: bool) {
        voter.require_auth();

        let mut appeals: Vec<DisputeAppeal> =
            env.storage().instance().get(&APPEALS).expect("No appeals found");

        if appeal_id >= appeals.len() {
            panic!("Invalid appeal ID");
        }

        let mut appeal = appeals.get(appeal_id).unwrap();

        if approve {
            appeal.votes_for += 1;
        } else {
            appeal.votes_against += 1;
        }

        // Auto-approve appeal if votes_for >= 3 threshold
        if appeal.votes_for >= 3 {
            appeal.status = String::from_str(&env, "APPROVED");
            
            // Auto-approve the associated candidate
            let mut candidates: Vec<Candidate> =
                env.storage().instance().get(&CANDIDATES).expect("No candidates found");
            if appeal.candidate_id < candidates.len() {
                let mut candidate = candidates.get(appeal.candidate_id).unwrap();
                candidate.approved = true;
                candidates.set(appeal.candidate_id, candidate);
                env.storage().instance().set(&CANDIDATES, &candidates);
            }
        }

        appeals.set(appeal_id, appeal);
        env.storage().instance().set(&APPEALS, &appeals);
    }

    pub fn get_dispute_appeals(env: Env) -> Vec<DisputeAppeal> {
        env.storage().instance().get(&APPEALS).unwrap_or(Vec::new(&env))
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

    // Register or fetch user onboarding profile with cohort differentiation
    pub fn onboard_user(
        env: Env, 
        user: Address, 
        cohort_month: String, 
        is_new_monthly_user: bool, 
        timestamp: u64
    ) -> UserProfile {
        user.require_auth();

        let mut profiles: Map<Address, UserProfile> = 
            env.storage().instance().get(&USER_PROFILES).unwrap_or(Map::new(&env));

        if let Some(existing) = profiles.get(user.clone()) {
            return existing;
        }

        let profile = UserProfile {
            user: user.clone(),
            cohort_month,
            is_new_monthly_user,
            onboarded_timestamp: timestamp,
            onboarding_completed: !is_new_monthly_user,
        };

        profiles.set(user, profile.clone());
        env.storage().instance().set(&USER_PROFILES, &profiles);
        profile
    }

    // Get user profile if exists
    pub fn get_user_profile(env: Env, user: Address) -> Option<UserProfile> {
        let profiles: Map<Address, UserProfile> = 
            env.storage().instance().get(&USER_PROFILES).unwrap_or(Map::new(&env));
        profiles.get(user)
    }

    // Mark user onboarding step complete
    pub fn complete_onboarding(env: Env, user: Address) {
        user.require_auth();
        let mut profiles: Map<Address, UserProfile> = 
            env.storage().instance().get(&USER_PROFILES).expect("Profiles not initialized");

        if let Some(mut profile) = profiles.get(user.clone()) {
            profile.onboarding_completed = true;
            profiles.set(user, profile);
            env.storage().instance().set(&USER_PROFILES, &profiles);
        }
    }

    // Get voting status
    pub fn is_voting_active(env: Env) -> bool {
        env.storage().instance().get(&VOTING_ACTIVE).unwrap_or(false)
    }
}

mod test;
