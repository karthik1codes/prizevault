#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub struct WinnerPayout {
    pub winner: Address,
    pub amount: i128,
}

#[contracttype]
pub enum DataKey {
    Sponsor,
    Organizer,
    Token,
    Initialized,
}

#[contract]
pub struct StellarEscrow;

#[contractimpl]
impl StellarEscrow {
    pub fn init(env: Env, sponsor: Address, organizer: Address, token_addr: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("already initialized");
        }
        sponsor.require_auth();
        organizer.require_auth();
        env.storage().instance().set(&DataKey::Sponsor, &sponsor);
        env.storage().instance().set(&DataKey::Organizer, &organizer);
        env.storage().instance().set(&DataKey::Token, &token_addr);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn release(env: Env, payouts: Vec<WinnerPayout>) {
        let sponsor: Address = env
            .storage()
            .instance()
            .get(&DataKey::Sponsor)
            .expect("sponsor not configured");
        let organizer: Address = env
            .storage()
            .instance()
            .get(&DataKey::Organizer)
            .expect("organizer not configured");
        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("token not configured");

        sponsor.require_auth();
        organizer.require_auth();

        let token_client = token::Client::new(&env, &token_addr);
        let contract = env.current_contract_address();

        for payout in payouts.iter() {
            if payout.amount > 0 {
                token_client.transfer(&contract, &payout.winner, &payout.amount);
            }
        }
    }
}

#[cfg(test)]
mod test;
