import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    createMint,
    getMint,
    mintTo,
    getAccount,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import assert from "assert";
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  (async () => {
    const payer = Keypair.generate();
    const mintAuthority = Keypair.generate();
    const freezeAuthority = Keypair.generate();
    const receiver = Keypair.generate(); 
    const PROGRAM_ID = new PublicKey("2D1wiJg6rQ7or2jntCQxEokafCBdRJTK943YbA3BNUKb");

    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      2e9
    ); 
    await connection.confirmTransaction(airdropSignature);
  
    const mint = await createMint(
      connection,
      payer, 
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      6 
    );
    
    const mintInfo = await getMint(connection, mint);
    assert.strictEqual(
      mintInfo.mintAuthority?.toBase58(),
      mintAuthority.publicKey.toBase58(),
      "Error: mint authority is incorrect"
    );
    assert.strictEqual(
      mintInfo.freezeAuthority?.toBase58(),
      freezeAuthority.publicKey.toBase58(),
      "Error: mint freeze authority is incorrect"
    );
    assert.strictEqual(mintInfo.decimals, 6, "Decimals should be 6");
  
    console.log("Mint initialized successfully!");
  
    const mintAmount = 1e6; 
    const receiverAccount = await mintTo(
      connection,
      payer,
      mint,
      receiver.publicKey, 
      mintAuthority.publicKey, 
      mintAmount,
      PROGRAM_ID
    );
    
    const receiverAccountInfo = await getAccount(connection, new PublicKey(receiverAccount));
    assert.strictEqual(
      Number(receiverAccountInfo.amount),
      mintAmount,
      "Amount is incorrect"
    );
  
    console.log("Minted tokens successfully.");
  })();