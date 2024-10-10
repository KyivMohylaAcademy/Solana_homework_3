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
    instruction::{initialize_mint, mint_to},
    state::Mint,
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
            mint_custom_usdc(program_id, accounts, instruction_data)?;
        }
        _ => msg!("Invalid instruction"),
    }
    Ok(())
}

fn initialize_custom_mint(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    // Accounts passed in by the client
    let mint_acc = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;

    // Ensure the mint account has enough rent to be rent-exempt
    let rent = &Rent::from_account_info(rent_acc)?;
    initialize_mint(
        program_id,
        mint_acc.key,
        mint_authority.key,
        Some(freeze_authority.key),
        6,
    )?;
    msg!("Mint initialized");
    Ok(())
}

fn mint_custom_usdc(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    // Get the accounts passed in by the client
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority_acc = next_account_info(accounts_iter)?;

    // Parse the mint amount from instruction_data (bytes 1..9)
    let mint_amount = u64::from_le_bytes(
        instruction_data[1..9]
            .try_into()
            .map_err(|_| ProgramError::InvalidInstructionData)?,
    );

    mint_to(
        program_id,
        mint_acc.key,
        receiver_acc.key,
        mint_authority_acc.key,
        &[],
        mint_amount,
    )?;

    msg!(
        "Successfully minted {} tokens to {}",
        mint_amount,
        receiver_acc.key
    );
    Ok(())
}
