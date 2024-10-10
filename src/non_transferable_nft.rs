use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use solana_program::program_pack::Pack;
use spl_token::state::Account as TokenAccount;

// Головна функція програми
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    // Отримуємо токен рахунки відправника і отримувача
    let sender_account = next_account_info(account_info_iter)?;
    let recipient_account = next_account_info(account_info_iter)?;

    // Отримуємо інформацію про токен рахунки
    let sender_token_account = TokenAccount::unpack(&sender_account.try_borrow_data()?)?;
    let recipient_token_account = TokenAccount::unpack(&recipient_account.try_borrow_data()?)?;

    // Перевіряємо, чи є токен non-transferable
    if sender_token_account.mint != recipient_token_account.mint {
        return Err(ProgramError::InvalidArgument);
    }

    // Якщо це non-transferable NFT, то забороняємо операцію
    if sender_token_account.is_frozen() {
        return Err(ProgramError::Custom(0)); // Власний код помилки для non-transferable токену
    }

    Ok(())
}