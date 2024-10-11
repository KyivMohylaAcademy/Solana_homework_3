use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar}
};
use spl_token::{
    instruction::{initialize_mint, mint_to, freeze_account},
    state::Mint,};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8], 
) -> ProgramResult {
    let instruction = instruction_data[0];
    match instruction {
        0 => {
            msg!("Initialize non-transferable NFT");
            initialize_non_transferrable_nft(program_id, accounts)?;
        }
        1 => {
            msg!("Mint non-transferable NFT");
            mint_nft(program_id, accounts, instruction_data)?;
        }
        _ => msg!("Invalid instruction"),
    }
    Ok(())
}

fn initialize_non_transferrable_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
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
        0
    )?;
    msg!("Non-transferrable NFT initialized");
    Ok(())
}

fn mint_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?; 
    let receiver_acc = next_account_info(accounts_iter)?; 
    let mint_authority = next_account_info(accounts_iter)?; 

    mint_to(
        program_id, 
        mint_acc.key, 
        receiver_acc.key, 
        mint_authority.key, 
        &[], 
        1
    )?;

    freeze_account(
        program_id,
        receiver_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[]
    )?;

    msg!("1 NFT minted and frozen (non-transferrable)");
    Ok(())
}
