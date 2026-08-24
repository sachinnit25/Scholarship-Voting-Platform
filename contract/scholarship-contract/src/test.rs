#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec};

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
    assert!(client.is_voting_active());
}

#[test]
fn test_apply_scholarship() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "John Doe");
    let major = String::from_str(&env, "Computer Science");
    let description = String::from_str(&env, "Aspiring blockchain developer");
    let requested_amount = 5000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    assert_eq!(candidate_id, 0);

    let candidates = client.get_candidates();
    assert_eq!(candidates.len(), 1);

    let candidate = candidates.get(0).unwrap();
    assert_eq!(candidate.id, 0);
    assert_eq!(candidate.owner, student);
    assert_eq!(candidate.name, name);
    assert_eq!(candidate.major, major);
    assert_eq!(candidate.description, description);
    assert_eq!(candidate.requested_amount, requested_amount);
    assert_eq!(candidate.vote_count, 0);
    assert!(!candidate.approved);
}

#[test]
fn test_approve_candidate() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "Alice");
    let major = String::from_str(&env, "Mathematics");
    let description = String::from_str(&env, "Researcher");
    let requested_amount = 3000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    // Initial state: not approved
    assert!(!client.get_candidate(&candidate_id).approved);

    // Approve applicant
    client.approve_candidate(&candidate_id);
    assert!(client.get_candidate(&candidate_id).approved);
}

#[test]
fn test_vote_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "Bob");
    let major = String::from_str(&env, "Physics");
    let description = String::from_str(&env, "Lab work");
    let requested_amount = 4000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    // Approve the candidate
    client.approve_candidate(&candidate_id);

    let voter = Address::generate(&env);
    assert!(!client.has_voted(&voter));

    // Cast vote
    client.vote(&voter, &candidate_id);

    assert!(client.has_voted(&voter));
    let candidate = client.get_candidate(&candidate_id);
    assert_eq!(candidate.vote_count, 1);
}

#[test]
#[should_panic(expected = "Already voted")]
fn test_vote_double_voting_panic() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "Bob");
    let major = String::from_str(&env, "Physics");
    let description = String::from_str(&env, "Lab work");
    let requested_amount = 4000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    client.approve_candidate(&candidate_id);

    let voter = Address::generate(&env);
    client.vote(&voter, &candidate_id);
    
    // Vote again (should panic)
    client.vote(&voter, &candidate_id);
}

#[test]
#[should_panic(expected = "Candidate is not approved for voting")]
fn test_vote_not_approved_panic() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "Bob");
    let major = String::from_str(&env, "Physics");
    let description = String::from_str(&env, "Lab work");
    let requested_amount = 4000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    // Vote on candidate before admin approval (should panic)
    let voter = Address::generate(&env);
    client.vote(&voter, &candidate_id);
}

#[test]
#[should_panic(expected = "Voting is closed")]
fn test_vote_closed_panic() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let name = String::from_str(&env, "Bob");
    let major = String::from_str(&env, "Physics");
    let description = String::from_str(&env, "Lab work");
    let requested_amount = 4000;

    let candidate_id = client.apply_scholarship(
        &student,
        &name,
        &major,
        &description,
        &requested_amount,
    );

    client.approve_candidate(&candidate_id);
    client.end_voting();

    let voter = Address::generate(&env);
    client.vote(&voter, &candidate_id);
}

#[test]
fn test_onboard_user_monthly_cohort() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let month = String::from_str(&env, "August 2026");

    let profile = client.onboard_user(&user, &month, &true, &1700000000);
    assert_eq!(profile.user, user);
    assert_eq!(profile.cohort_month, month);
    assert!(profile.is_new_monthly_user);
    assert!(!profile.onboarding_completed);

    let fetched = client.get_user_profile(&user).unwrap();
    assert_eq!(fetched, profile);

    client.complete_onboarding(&user);
    let completed_profile = client.get_user_profile(&user).unwrap();
    assert!(completed_profile.onboarding_completed);
}

#[test]
fn test_quadratic_voting_cost_deduction() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let candidate_id = client.apply_scholarship(
        &student,
        &String::from_str(&env, "Alice"),
        &String::from_str(&env, "Engineering"),
        &String::from_str(&env, "Clean Water Tech"),
        &5000,
    );
    client.approve_candidate(&candidate_id);

    let voter = Address::generate(&env);
    assert_eq!(client.get_voter_credits(&voter), 100);

    // Vote 3 units (cost = 3^2 = 9 credits)
    client.vote_quadratic(&voter, &candidate_id, &3);
    assert_eq!(client.get_voter_credits(&voter), 91);
    assert_eq!(client.get_voter_votes_for_candidate(&voter, &candidate_id), 3);

    // Vote 2 more units (total = 5 units, total cost = 25, incremental cost = 25 - 9 = 16)
    client.vote_quadratic(&voter, &candidate_id, &2);
    assert_eq!(client.get_voter_credits(&voter), 75);
    assert_eq!(client.get_voter_votes_for_candidate(&voter, &candidate_id), 5);

    let candidate = client.get_candidate(&candidate_id);
    assert_eq!(candidate.effective_qv_score, 5);
}

#[test]
#[should_panic(expected = "Insufficient voting credits")]
fn test_quadratic_voting_insufficient_credits_panic() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DecentralizedScholarshipVoting);
    let client = DecentralizedScholarshipVotingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let student = Address::generate(&env);
    let candidate_id = client.apply_scholarship(
        &student,
        &String::from_str(&env, "Bob"),
        &String::from_str(&env, "Biotech"),
        &String::from_str(&env, "Genomics Research"),
        &7000,
    );
    client.approve_candidate(&candidate_id);

    let voter = Address::generate(&env);
    // 11 votes costs 11^2 = 121 > 100 available credits
    client.vote_quadratic(&voter, &candidate_id, &11);
}
