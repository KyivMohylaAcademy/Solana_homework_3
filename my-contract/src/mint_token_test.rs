#[cfg(test)]
mod mint_token_test {
    use super::*;
    use solana_program::{
        instruction::{AccountMeta, Instruction},
        sysvar::{rent::Rent, SysvarId},
    };
    use solana_program_test::*;
    use solana_sdk::{
        signature::Keypair,
        signer::Signer,
        transaction::Transaction,
    };
    use crate::{process_instruction, id};

    #[tokio::test]
    async fn test_initialize_mint() {
        let mut program_test = ProgramTest::new(
            "my_contract",
            id(),
            processor!(process_instruction),
        );

        let mint = Keypair::new();
        let mint_authority = Keypair::new();
        let payer = Keypair::new();

        let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

        let init_mint_ix = Instruction::new_with_borsh(
            id(),
            &0u8,
            vec![
                AccountMeta::new(mint.pubkey(), true),
                AccountMeta::new_readonly(mint_authority.pubkey(), false),
                AccountMeta::new_readonly(spl_token::id(), false),
                AccountMeta::new_readonly(Rent::id(), false),
            ],
        );

        println!("Executing Mint Initialization Transaction");

        let mut transaction = Transaction::new_with_payer(
            &[init_mint_ix],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer, &mint], recent_blockhash);

        let result = banks_client.process_transaction(transaction).await;

        match result {
            Ok(_) => println!("Mint successfully initialized"),
            Err(e) => panic!("Transaction failed with error: {:?}", e),
        };
    }
}
