import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
  import { createAccount } from "@solana/spl-token";
  import assert from "assert";
  import { Buffer } from 'buffer';

  
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const PROGRAM_ID = new PublicKey("62saTsozaGixYGRzxzuf63X6y6KDVzmXCi2GgKoZG6VB");
  

  async function runTest() {
    const payer = Keypair.generate();
    const mintAuthority = Keypair.generate();
    const freezeAuthority = Keypair.generate();
    const receiver = Keypair.generate();
  
    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      2 * 10 ** 9
    );
    await connection.confirmTransaction(airdropSignature);
  
    const mintKeypair = Keypair.generate();
    const rent = await connection.getMinimumBalanceForRentExemption(82);
  
    const initMintIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: false },
        { pubkey: freezeAuthority.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.from([0]),
    });
  
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(initMintIx),
      [payer, mintKeypair]
    );

    console.log("Token successfully initialized!");
  
    const mintAmount = 1000;
    const mintIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: receiver.publicKey, isSigner: false, isWritable: true },
        { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.concat([
        Buffer.from([1]),
        Buffer.from(new Uint8Array(new BigUint64Array([mintAmount]).buffer)),
      ]),
    });
  

    const receiverTokenAccount = await createAccount(
      connection,
      payer,
      mintKeypair.publicKey,
      receiver.publicKey
    );
  
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(mintIx),
      [payer, mintAuthority]
    );
  
    console.log(`Minted ${mintAmount} tokens!`);
  
    const token = new Token(
      connection,
      mintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      payer
    );
  
    const accountInfo = await token.getAccountInfo(receiverTokenAccount);
    assert.equal(accountInfo.amount.toNumber(), mintAmount);
  
    console.log("Receiver's balance is correctly updated!");
  }
  
  runTest().catch((err) => {
    console.error("Test failed with error:", err);
  });
  