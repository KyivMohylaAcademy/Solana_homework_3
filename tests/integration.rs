#[cfg(test)]
mod tests {
    use solana_program::instruction::{AccountMeta, Instruction};
    use solana_program::program_pack::Pack;
    use solana_program::pubkey::Pubkey;
    use solana_program::rent::Rent;
    use solana_program::sysvar;
    use solana_program_test::processor;
    use solana_sdk::{
        account::Account,
        signature::Keypair,
        signer::Signer,
        transaction::Transaction,
    };
    use spl_token::state::{Account as TokenAccount, Mint};
    use my_solana_program::process_instruction;

    #[tokio::test]
    async fn test_initialize_mint_and_mint_token() {
        let program_id = Pubkey::new_unique();

        let mut program_test = solana_program_test::ProgramTest::new(
            "my_solana_program",
            program_id,
            processor!(process_instruction),
        );


        // Set up accounts
        let mint_keypair = Keypair::new();
        let mint_authority = Keypair::new();
        let freeze_authority = Keypair::new();
        let receiver_keypair = Keypair::new();
        let receiver_token_account = Keypair::new(); // New keypair for the receiver's token account
        let rent = Rent::default();

        // Add the mint account
        program_test.add_account(
            mint_keypair.pubkey(),
            Account {
                lamports: rent.minimum_balance(Mint::LEN),
                data: vec![0u8; Mint::LEN],
                owner: spl_token::id(),
                ..Account::default()
            },
        );

        // Add the receiver's token account
        program_test.add_account(
            receiver_token_account.pubkey(),
            Account {
                lamports: rent.minimum_balance(TokenAccount::LEN),
                data: vec![0u8; TokenAccount::LEN],
                owner: spl_token::id(),
                ..Account::default()
            },
        );

        // Start the test client
        let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

        // 1. Initialize Mint
        let mut transaction = Transaction::new_with_payer(
            &[Instruction::new_with_bincode(
                program_id,
                &[0], // 0 is the instruction for initialization
                vec![
                    AccountMeta::new(mint_keypair.pubkey(), false),
                    AccountMeta::new_readonly(sysvar::rent::id(), false),
                    AccountMeta::new_readonly(mint_authority.pubkey(), true),
                    AccountMeta::new_readonly(freeze_authority.pubkey(), false),
                ],
            )],
            Some(&payer.pubkey()),
        );

        transaction.sign(&[&payer, &mint_authority], recent_blockhash);
        banks_client.process_transaction(transaction).await.unwrap();

        // 2. Initialize the token account for the receiver
        let transaction = Transaction::new_signed_with_payer(
            &[spl_token::instruction::initialize_account(
                &spl_token::id(),
                &receiver_token_account.pubkey(),
                &mint_keypair.pubkey(),
                &receiver_keypair.pubkey(),
            )
                .unwrap()],
            Some(&payer.pubkey()),
            &[&payer, &receiver_token_account],
            recent_blockhash,
        );
        banks_client.process_transaction(transaction).await.unwrap();

        // 3. Mint tokens
        let amount: u64 = 1000;
        let mut instruction_data = vec![1]; // First byte is instruction for mint
        instruction_data.extend_from_slice(&amount.to_le_bytes()); // Next 8 bytes for the amount

        let mut transaction = Transaction::new_with_payer(
            &[Instruction::new_with_bincode(
                program_id,
                &instruction_data, // Pass the correctly formatted instruction_data
                vec![
                    AccountMeta::new(mint_keypair.pubkey(), false),
                    AccountMeta::new(receiver_token_account.pubkey(), false),
                    AccountMeta::new_readonly(mint_authority.pubkey(), true),
                ],
            )],
            Some(&payer.pubkey()),
        );

        transaction.sign(&[&payer, &mint_authority], recent_blockhash);
        banks_client.process_transaction(transaction).await.unwrap();

        // Check the receiver's token account balance
        let receiver_account = banks_client
            .get_account(receiver_token_account.pubkey())
            .await
            .unwrap()
            .unwrap();

        // Unpack the token account data to verify the balance
        let receiver_token_account_data = TokenAccount::unpack(&receiver_account.data).unwrap();

        assert_eq!(receiver_token_account_data.amount, amount);
    }
}