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
    instruction::{initialize_mint, mint_to, transfer},
    state::Account as TokenAccount,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, 
    accounts: &[AccountInfo], 
    instruction_data: &[u8], 
) -> ProgramResult {
    let instruction = instruction_data[0];
    match instruction {
        0 => {
            msg!("Init");
            initialize_custom_mint(program_id, accounts)?;
        }
        1 => {
            msg!("Mint");
            mint_custom_nft(program_id, accounts, instruction_data)?;
        }
        2 => {
            msg!("Attempting Transfer");
            transfer_nft(program_id, accounts)?;
        }
        _ => msg!("Invalid instruction"),
    }
    Ok(())
}

// Function to initialize the NFT mint
fn initialize_custom_mint(
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
        0,  // 0 decimal places since NFTs are non-fungible
    )?;
    
    msg!("NFT mint initialized");
    Ok(())
}

// Function to mint the custom non-transferable NFT
fn mint_custom_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;

    // Mint exactly 1 NFT
    let mint_amount: u64 = 1;

    mint_to(
        program_id, 
        mint_acc.key, 
        receiver_acc.key, 
        mint_authority.key, 
        &[], 
        mint_amount,
    )?;

    msg!("1 NFT minted to account {:?}", receiver_acc.key);
    Ok(())
}

// Function to prevent NFT transfers, ensuring non-transferability
fn transfer_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let _source_acc = next_account_info(accounts_iter)?;
    let _destination_acc = next_account_info(accounts_iter)?;
    let _authority_acc = next_account_info(accounts_iter)?;

    // Since this is a non-transferable NFT, we return an error when trying to transfer
    msg!("Transfers are disabled for this NFT");
    Err(ProgramError::Custom(1))  // Return custom error code indicating transfer not allowed
}

