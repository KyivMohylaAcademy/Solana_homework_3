use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use spl_token::{
    instruction::{initialize_mint, mint_to},
    state::{Account, Mint},
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
            msg!("Initialize NFT mint");
            initialize_nft_mint(program_id, accounts)?;
        }
        1 => {
            msg!("Mint NFT");
            mint_nft(program_id, accounts, instruction_data)?;
        }
        _ => {
            msg!("Invalid instruction");
            return Err(ProgramError::InvalidInstructionData);
        }
    }
    Ok(())
}

fn initialize_nft_mint(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?; 
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    initialize_mint(
        &spl_token::ID, 
        mint_acc.key, 
        mint_authority.key, 
        Some(freeze_authority.key), 
        0 
    )?;
    msg!("NFT mint initialized");
    Ok(())
}

fn mint_nft(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?; 
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;

    let mint_amount: u64 = 1;
    mint_to(
        &spl_token::ID, 
        mint_acc.key, 
        receiver_acc.key, 
        mint_authority.key, 
        &[], 
        mint_amount
    )?;
    msg!("Minted 1 NFT");

    if let Ok(receiver_account) = Account::unpack(&receiver_acc.try_borrow_data()?) {
        if receiver_account.owner != *mint_authority.key {
            msg!("Transfer restricted: Non-transferable NFT");
            return Err(ProgramError::InvalidAccountData);
        }
    }

    Ok(())
}
