use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};
use spl_token::{
    instruction::{initialize_mint, mint_to, freeze_account},
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = instruction_data[0];
    match instruction {
        0 => {
            msg!("Init NFT Mint");
            initialize_non_transferable_nft(program_id, accounts)?;
        }
        1 => {
            msg!("Mint NFT");
            mint_nft(program_id, accounts, instruction_data)?;
        }
        _ => msg!("Invalid instruction"),
    }
    Ok(())
}

fn initialize_non_transferable_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    initialize_mint(
        program_id, 
        mint_acc.key, 
        mint_authority.key, 
        Some(freeze_authority.key),
        0,
    )?;

    msg!("Non-transferable NFT mint initialized");
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

    let mint_amount = 1;

    mint_to(
        program_id, 
        mint_acc.key, 
        receiver_acc.key, 
        mint_authority.key, 
        &[], 
        mint_amount,
    )?;

    freeze_account(
        program_id,
        receiver_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[],
    )?;

    msg!("Minted {} NFT", mint_amount);
    Ok(())
}
