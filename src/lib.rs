
mod non_transferable_nft;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use spl_token::instruction::{initialize_mint, mint_to};


// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the program was loaded into
    accounts: &[AccountInfo], // The accounts involved in the instruction
    instruction_data: &[u8], // Instruction data
) -> ProgramResult {
    let instruction = instruction_data
        .get(0)
        .ok_or(ProgramError::InvalidInstructionData)?;
    match instruction {
        0 => {
            msg!("Init");
            initialize_custom_mint(program_id, accounts)?;
        }
        1 => {
            msg!("Mint");
            mint_custom_usdc(program_id, accounts, instruction_data)?;
        }
        _ => {
            msg!("Invalid instruction");
            return Err(ProgramError::InvalidInstructionData);
        }
    }
    Ok(())
}

fn initialize_custom_mint(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let rent_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;
    let freeze_authority = next_account_info(accounts_iter)?;


    let ix = initialize_mint(
        &spl_token::id(),
        mint_acc.key,
        mint_authority.key,
        Some(freeze_authority.key),
        6,
    )?;

    invoke(
        &ix,
        &[
            mint_acc.clone(),
            rent_acc.clone(),
        ],
    )?;

    msg!("Mint initialized");
    Ok(())
}

fn mint_custom_usdc(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let mint_acc = next_account_info(accounts_iter)?;
    let receiver_acc = next_account_info(accounts_iter)?;
    let mint_authority = next_account_info(accounts_iter)?;

    // Check that the instruction data is long enough
    if instruction_data.len() < 9 {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Parse the mint amount (8 bytes starting from index 1)
    let mint_amount = u64::from_le_bytes(
        instruction_data[1..9]
            .try_into()
            .map_err(|_| ProgramError::InvalidInstructionData)?,
    );

    // Construct the instruction to mint tokens
    let ix = mint_to(
        &spl_token::id(),
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        mint_amount,
    )?;

    // Invoke the SPL Token program
    invoke(
        &ix,
        &[
            mint_acc.clone(),
            receiver_acc.clone(),
            mint_authority.clone(),
        ],
    )?;

    msg!("Minted {}", mint_amount);
    Ok(())
}