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

use spl_token_extensions::non_transferable::{initialize_non_transferable_nft, NonTransferable};

const INITIALIZE_NFT: u8 = 0;
const MINT_NFT: u8 = 1;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction = instruction_data[0];
    match instruction {
        INITIALIZE_NFT => {
            msg!("Initialize non-transferable NFT.");
            init_nt_nft(program_id, accounts)?;
        }
        MINT_NFT => {
            msg!("Mint non-transferable NFT.");
            mint_nt_nft(program_id, accounts, instruction_data)?;
        }
        _ => {
            msg!("Invalid instruction.");

            return Err(ProgramError::InvalidInstructionData);
        }
    }

    Ok(())
}

fn init_nt_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    // Ensure accounts are initialized properly
    if !mint_acc.is_writable {
        return Err(ProgramError::InvalidAccountData);
    }

    initialize_non_transferable_nft(
        program_id,
        mint_acc.key,
        rent_acc.key,
        Some(freeze_authority.key),
        2,
    )?;

    msg!("Non-transferable NFT initialized.");
    Ok(())
}

fn mint_nt_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let mint_amount = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());

    // Ensure that the receiver account is writable
    if !receiver_acc.is_writable {
        return Err(ProgramError::InvalidAccountData);
    }

    mint_to(
        program_id,
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        mint_amount,
    )?;

    // You can also additionally freeze the account with minted nfts to enforce non-transferability (but we've already used initialize_non_transferable_nft)
    // freeze_account(
    //     program_id,
    //     receiver_acc.key,
    //     mint_acc.key,
    //     mint_authority.key,
    //     &[]
    // )?;

    msg!("{} Non-Transferable NFT Minted.", mint_amount);
    Ok(())
}
