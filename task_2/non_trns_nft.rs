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
    instruction::{initialize_mint, mint_to,freeze_account},
    state::Mint,
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
            msg!("Init");
            initialize_non_tranferable(program_id, accounts)?;
        }
        1 => {
            msg!("Mint");
            mint_non_tranferable(program_id, accounts, instruction_data)?;
        }
        _ => msg!("Invalid instruction")
    }
    Ok(())
}

fn initialize_non_tranferable(
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
        0)?;
        msg!("Mint initialized for");
    Ok(())
}

fn mint_non_tranferable(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let reciever_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    mint_to(
        program_id,
        mint_acc.key,
        reciever_acc.key,
        mint_authority.key,
        &[],
        1
    )?;

    freeze_account(
        program_id,
        reciever_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[],
    )?;

    msg!("Minted nft");
    Ok(())
}