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
    instruction::{initialize_mint, mint_to, freeze_account},
    state::Mint,
};

entrypoint!(main_handler);

pub fn main_handler(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input_data: &[u8],
) -> ProgramResult {
    let command = input_data
        .get(0)
        .ok_or(ProgramError::InvalidInstructionData)?;

    match command {
        0 => {
            msg!("Setting up Non-Transferable NFT");
            setup_non_transferable_nft(program_id, accounts)?;
        }
        1 => {
            msg!("Creating and Freezing NFT");
            create_and_freeze_nft(program_id, accounts, input_data)?;
        }
        _ => {
            msg!("Unknown command received");
            return Err(ProgramError::InvalidInstructionData);
        }
    }

    Ok(())
}

fn setup_non_transferable_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let nft_mint = next_account_info(account_iter)?;
    let rent_sysvar = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let freeze_authority = next_account_info(account_iter)?;

    initialize_mint(
        program_id,
        nft_mint.key,
        mint_authority.key,
        Some(freeze_authority.key),
        0,
    )?;

    msg!("NFT mint account initialized with freeze authority.");
    Ok(())
}

fn create_and_freeze_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _input_data: &[u8],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let nft_mint = next_account_info(account_iter)?;
    let recipient_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;

    mint_to(
        program_id,
        nft_mint.key,
        recipient_account.key,
        mint_authority.key,
        &[],
        1,
    )?;

    freeze_account(
        program_id,
        recipient_account.key,
        nft_mint.key,
        mint_authority.key,
        &[],
    )?;

    msg!("NFT minted and frozen to ensure it's non-transferable.");
    Ok(())
}
