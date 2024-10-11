use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
use spl_token::{
    instruction::{freeze_account, initialize_mint, mint_to},
    state::Mint,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    match instruction_data.get(0) {
        Some(0) => {
            msg!("Init");
            initialize_non_transferable(program_id, accounts)
        }
        Some(1) => {
            msg!("Mint");
            mint_nft(program_id, accounts)
        }
        _ => msg!("Invalid instruction")
    }
}

fn initialize_non_transferable(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    initialize_mint(
        program_id,
        mint_acc.key,
        rent_acc.key,
        Some(freeze_authority.key),
        0, // 0 decimals for NFT
    )?;

    msg!("Initialized");
    Ok(())
}

fn mint_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;

    // Mint 1 NFT
    mint_to(
        program_id,
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        1, // Only 1 token as it's an NFT
    )?;

    // Freeze the account, making the NFT non-transferable
    freeze_account(
        program_id,
        receiver_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[],
    )?;

    msg!("1 NFT minted");
    Ok(())
}
