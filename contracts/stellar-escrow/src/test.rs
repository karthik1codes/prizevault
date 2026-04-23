#![cfg(test)]

use super::{StellarEscrow, StellarEscrowClient, WinnerPayout};
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    vec, Address, Env,
};

fn create_token<'a>(env: &Env, admin: &Address) -> (Address, TokenClient<'a>, StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        addr.clone(),
        TokenClient::new(env, &addr),
        StellarAssetClient::new(env, &addr),
    )
}

#[test]
fn propose_approve_execute_transfers_to_winners() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let organizer = Address::generate(&env);
    let winner_a = Address::generate(&env);
    let winner_b = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_addr, token, token_admin_client) = create_token(&env, &token_admin);

    let contract_id = env.register(StellarEscrow, ());
    let client = StellarEscrowClient::new(&env, &contract_id);

    client.init(&sponsor, &organizer, &token_addr);

    token_admin_client.mint(&contract_id, &1_000_i128);

    let payouts = vec![
        &env,
        WinnerPayout { winner: winner_a.clone(), amount: 600 },
        WinnerPayout { winner: winner_b.clone(), amount: 400 },
    ];

    client.propose_release(&1_u64, &payouts);
    let proposed = client.get_proposal(&1_u64);
    assert!(proposed.organizer_approved);
    assert!(!proposed.sponsor_approved);
    assert!(!proposed.executed);

    client.approve_release(&1_u64);
    client.execute_release(&1_u64);

    assert_eq!(token.balance(&winner_a), 600);
    assert_eq!(token.balance(&winner_b), 400);
    assert_eq!(token.balance(&contract_id), 0);

    let executed = client.get_proposal(&1_u64);
    assert!(executed.organizer_approved);
    assert!(executed.sponsor_approved);
    assert!(executed.executed);
}

#[test]
#[should_panic(expected = "already initialized")]
fn init_twice_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let organizer = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, _token, _admin) = create_token(&env, &token_admin);

    let contract_id = env.register(StellarEscrow, ());
    let client = StellarEscrowClient::new(&env, &contract_id);

    client.init(&sponsor, &organizer, &token_addr);
    client.init(&sponsor, &organizer, &token_addr);
}

#[test]
#[should_panic(expected = "both approvals required")]
fn execute_without_sponsor_approval_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let organizer = Address::generate(&env);
    let winner = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, _token, _token_admin_client) = create_token(&env, &token_admin);

    let contract_id = env.register(StellarEscrow, ());
    let client = StellarEscrowClient::new(&env, &contract_id);

    client.init(&sponsor, &organizer, &token_addr);

    let payouts = vec![
        &env,
        WinnerPayout { winner, amount: 10 },
    ];
    client.propose_release(&77_u64, &payouts);
    client.execute_release(&77_u64);
}

#[test]
fn zero_amount_payout_is_skipped_after_approval() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let organizer = Address::generate(&env);
    let winner = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_addr, token, token_admin_client) = create_token(&env, &token_admin);

    let contract_id = env.register(StellarEscrow, ());
    let client = StellarEscrowClient::new(&env, &contract_id);

    client.init(&sponsor, &organizer, &token_addr);
    token_admin_client.mint(&contract_id, &100_i128);

    let payouts = vec![
        &env,
        WinnerPayout { winner: winner.clone(), amount: 0 },
    ];

    client.propose_release(&5_u64, &payouts);
    client.approve_release(&5_u64);
    client.execute_release(&5_u64);

    assert_eq!(token.balance(&winner), 0);
    assert_eq!(token.balance(&contract_id), 100);
}
