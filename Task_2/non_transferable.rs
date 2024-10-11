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
            msg!("Init Non-transferable NFT");
            initialize_custom_nft(program_id, accounts)?;
        }
        1 => {
            mint_custom_nft(program_id, accounts)?;
        }
        _ => {
            msg!("Invalid instruction!");
            return Err(ProgramError::InvalidInstructionData);
        }
    }
    Ok(())
}

fn initialize_custom_nft(
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
        mint_authority.key,
        Some(freeze_authority.key),
        0, 
    )?;
    msg!("Mint initialized with 0 decimals for NFT");

    Ok(())
}

fn mint_custom_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;

    let mint_amount: u64 = 1;

    mint_to(
        program_id,
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        mint_amount,
    )?;
    msg!("Minted 1 non-transferable NFT");

    Ok(())
}
