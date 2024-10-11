use solana_program::{
    account_info::{next_account_info, AccountInfo}, 
    entrypoint, 
    entrypoint::ProgramResult,
    msg,                   
    pubkey::Pubkey,              
    sysvar::{rent::Rent, Sysvar}, 
};
use spl_token_2022::{
    instruction::{initialize_mint, mint_to, initialize_non_transferable_mint},
    state::Mint,
    extension::ExtensionType
};

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,      
    accounts: &[AccountInfo], 
    instruction_data: &[u8], 
) -> ProgramResult {
    let instruction = instruction_data[0];
    msg!("Initialize non-transferable nft");
    initialize_non_transferable_nft(program_id, accounts)?;
    Ok(())
}

fn initialize_non_transferable_nft(
    program_id: &Pubkey, 
    accounts: &[AccountInfo]
    )-> ProgramResult {

    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

   
    initialize_mint(
        program_id,
        mint_acc.key,
        mint_authority.key,
        Some(freeze_authority.key),
        0,
    )?;
    initialize_non_transferable_mint(
        token_program.key,    
        mint_acc.key, 
    )?;

    msg!("Non-transferable token initialized");
    Ok(())
}