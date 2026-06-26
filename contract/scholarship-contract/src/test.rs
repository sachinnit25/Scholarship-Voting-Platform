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
