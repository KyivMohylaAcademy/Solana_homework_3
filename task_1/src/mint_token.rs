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
    state::{Account, Mint},
    ID as TOKEN_PROGRAM_ID,
};
use spl_token_extensions::non_transferable::instruction::set_non_transferable;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = instruction_data[0];
    match instruction {
        0 => {
            msg!("Init N-t NFT");
            init_non_t_mint(program_id, accounts)?;
        }
        1 => {
            msg!("Mint N-t NFT");
            mint_non_t_nft(program_id, accounts, instruction_data)?;
        }
        _ => {
            msg!("Invalid");
            return Err(ProgramError::InvalidInstructionData);
        }
    }
    Ok(())
}

fn init_non_t_mint(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    initialize_mint(
        &TOKEN_PROGRAM_ID,
        mint_acc.key,
        mint_authority.key,
        Some(freeze_authority.key),
        0,
    )?;

    set_non_transferable(mint_acc.key)?;

    msg!("Non-transferable Mint initialized");
    Ok(())
}

fn mint_non_t_nft(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let mint_amount = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());

    mint_to(
        &TOKEN_PROGRAM_ID,
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        mint_amount,
    )?;

    freeze_account(
        &TOKEN_PROGRAM_ID,
        receiver_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[],
    )?;

    msg!("Minted and blocked for transfering {} NFT", mint_amount);
    Ok(())
}