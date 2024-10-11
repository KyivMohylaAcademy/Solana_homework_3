import {
    Connection,
    Keypair,
    Transaction,
    LAMPORTS_PER_SOL,
    PublicKey,
  } from '@solana/web3.js';
  import {
    createMint,
    mintTo,
    getOrCreateAssociatedTokenAccount,
    getAccount,
    TOKEN_PROGRAM_ID
  } from '@solana/spl-token';
  import assert from 'assert';
  
  const programId = new PublicKey(TOKEN_PROGRAM_ID); // Змініть на ваш ID програми
  
  describe('MyTokenProgram', () => {
    let connection: Connection;
    let payer: Keypair;
    let mint: PublicKey;
    let receiver: Keypair;
  
    before(async () => {
      connection = new Connection('https://api.devnet.solana.com');
      payer = Keypair.generate();
      receiver = Keypair.generate();
  
      // Заповнення акаунта Payer SOL для тестування
      const airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSignature);
  
      // Створення мінта
      mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        6
      );
    });
  
    it('should mint tokens', async () => {
      // Отримання або створення асоційованого акаунта для отримувача
      const receiverAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        receiver.publicKey
      );
  
      // Випуск токенів
      const mintAmount = 1000;
  
      // Випускаємо токени
      await mintTo(
        connection,
        payer,
        mint,
        receiverAccount.address,
        payer.publicKey,
        mintAmount
      );
  
      // Перевірка балансу
      const accountInfo = await getAccount(connection, receiverAccount.address);
      assert(Number(accountInfo.amount) == (mintAmount));
    });
  });
  