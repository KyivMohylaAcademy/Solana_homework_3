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
            initialize_non_transferable(program_id, accounts)
        }
        1 => {
            msg!("Mint");
            mint_nft(program_id, accounts)
        }
        _ => msg!("Invalid instruction"),
    }
}

fn initialize_non_transferable(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let mut acc_iter = accs.iter();
    let mint_acc = next_account_info(&mut acc_iter)?;
    let rent_acc = next_account_info(&mut acc_iter)?;
    let mint_auth = next_account_info(&mut acc_iter)?;
    let freeze_auth = next_account_info(&mut acc_iter)?;

    initialize_mint(
        program_id,
        mint_acc.key,
        rent_acc.key,
        Some(freeze_authority.key),
        0,
    )?;

    msg!("Mint Initialized as Non-Transferable");
    Ok(())
}

fn mint_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let mut acc_iter = accs.iter();
    let mint_acc = next_account_info(&mut acc_iter)?;
    let receiver_acc = next_account_info(&mut acc_iter)?;
    let mint_auth = next_account_info(&mut acc_iter)?;

    mint_to(
        program_id,
        mint_acc.key,
        receiver_acc.key,
        mint_authority.key,
        &[],
        1,
    )?;

    freeze_account(
        program_id,
        receiver_acc.key,
        mint_acc.key,
        mint_authority.key,
        &[],
    )?;

    msg!("1 NFT Successfully Minted!");
    Ok(())
}
