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

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let operation_code = instruction_data.first().ok_or(ProgramError::InvalidInstructionData)?;
    
    match operation_code {
        0 => {
            msg!("Starting NFT mint setup");
            setup_non_transferable_nft(program_id, accounts)?;
        }
        1 => {
            msg!("Minting the NFT and applying restrictions");
            mint_and_freeze_nft(program_id, accounts, instruction_data)?;
        }
        _ => msg!("Unrecognized instruction received"),
    }
    Ok(())
}

fn setup_non_transferable_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let mint_account = next_account_info(account_iter)?;
    let rent_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let freeze_authority = next_account_info(account_iter)?;

    initialize_mint(
        program_id,
        mint_account.key,
        mint_authority.key,
        Some(freeze_authority.key),
        0,
    )?;

    msg!("Successfully set up non-transferable NFT mint");
    Ok(())
}

fn mint_and_freeze_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let mint_account = next_account_info(account_iter)?;
    let destination_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;

    mint_to(
        program_id,
        mint_account.key,
        destination_account.key,
        mint_authority.key,
        &[],
        1, 
    )?;

    freeze_account(
        program_id,
        destination_account.key,
        mint_account.key,
        mint_authority.key,
        &[],
    )?;

    msg!("NFT minted and frozen, transfer restricted");
    Ok(())
}
