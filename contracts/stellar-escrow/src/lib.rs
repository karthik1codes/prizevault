#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub struct WinnerPayout {
    pub winner: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct ReleaseProposal {
    pub payouts: Vec<WinnerPayout>,
    pub organizer_approved: bool,
    pub sponsor_approved: bool,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Sponsor,
    Organizer,
    Token,
    Initialized,
    Proposal(u64),
}

#[contract]
pub struct StellarEscrow;

#[contractimpl]
impl StellarEscrow {
    pub fn init(env: Env, sponsor: Address, organizer: Address, token_addr: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("already initialized");
        }
        // Sponsor authorizes initial configuration (organizer and token).
        sponsor.require_auth();
        env.storage().instance().set(&DataKey::Sponsor, &sponsor);
        env.storage().instance().set(&DataKey::Organizer, &organizer);
        env.storage().instance().set(&DataKey::Token, &token_addr);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn propose_release(env: Env, proposal_id: u64, payouts: Vec<WinnerPayout>) {
        ensure_initialized(&env);
        if payouts.is_empty() {
            panic!("payouts cannot be empty");
        }

        let organizer = get_organizer(&env);
        organizer.require_auth();

        let key = DataKey::Proposal(proposal_id);
        if env.storage().instance().has(&key) {
            panic!("proposal already exists");
        }

        let proposal = ReleaseProposal {
            payouts,
            organizer_approved: true,
            sponsor_approved: false,
            executed: false,
        };

        env.storage().instance().set(&key, &proposal);
    }

    pub fn approve_release(env: Env, proposal_id: u64) {
        ensure_initialized(&env);

        let sponsor = get_sponsor(&env);
        sponsor.require_auth();

        let key = DataKey::Proposal(proposal_id);
        let mut proposal: ReleaseProposal = env
            .storage()
            .instance()
            .get(&key)
            .expect("proposal not found");

        if proposal.executed {
            panic!("proposal already executed");
        }

        proposal.sponsor_approved = true;
        env.storage().instance().set(&key, &proposal);
    }

    pub fn execute_release(env: Env, proposal_id: u64) {
        ensure_initialized(&env);

        let organizer = get_organizer(&env);
        organizer.require_auth();

        let key = DataKey::Proposal(proposal_id);
        let mut proposal: ReleaseProposal = env
            .storage()
            .instance()
            .get(&key)
            .expect("proposal not found");

        if proposal.executed {
            panic!("proposal already executed");
        }
        if !proposal.organizer_approved || !proposal.sponsor_approved {
            panic!("both approvals required");
        }

        let token_addr = get_token(&env);
        let token_client = token::Client::new(&env, &token_addr);
        let contract = env.current_contract_address();

        for payout in proposal.payouts.iter() {
            if payout.amount > 0 {
                token_client.transfer(&contract, &payout.winner, &payout.amount);
            }
        }

        proposal.executed = true;
        env.storage().instance().set(&key, &proposal);
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> ReleaseProposal {
        let key = DataKey::Proposal(proposal_id);
        env.storage()
            .instance()
            .get(&key)
            .expect("proposal not found")
    }
}

fn ensure_initialized(env: &Env) {
    if !env.storage().instance().has(&DataKey::Initialized) {
        panic!("contract not initialized");
    }
}

fn get_sponsor(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Sponsor)
        .expect("sponsor not configured")
}

fn get_organizer(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Organizer)
        .expect("organizer not configured")
}

fn get_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .expect("token not configured")
}

#[cfg(test)]
mod test;
