import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import assert from 'assert';

// Set up Solana connection and wallet
const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
const payer = web3.Keypair.generate();
const wallet = payer;

// Declare the mint as a global variable
let mint: web3.PublicKey;

describe("Custom Mint Test", () => {
  it("initialize custom mint", async () => {
    // Define constants
    const MINT_DECIMALS = 1;

    // Airdrop some SOL to the wallet to cover transaction fees
    const airdropSignature = await connection.requestAirdrop(
      wallet.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);

    // Create a new mint account
    mint = await splToken.createMint(
      connection,
      wallet, // The payer of the transaction
      wallet.publicKey, // Mint authority
      wallet.publicKey, // Freeze authority (optional)
      MINT_DECIMALS // Number of decimals
    );

    console.log(`Mint Address: ${mint.toBase58()}`);

    // Fetch and verify the mint account
    const mintAccount = await connection.getAccountInfo(mint);

    // Assertions to verify that the mint account is initialized
    assert(mintAccount !== null, "Mint account should exist");
    assert.equal(mintAccount.owner.toBase58(), splToken.TOKEN_PROGRAM_ID.toBase58());
    console.log("Custom mint initialized successfully");
  });

  it("mint custom USDC tokens", async () => {
    if (!mint) {
      throw new Error("Mint was not initialized in the previous test.");
    }

    // Create a new token account for the receiver to hold the USDC
    const receiverTokenAccount = await splToken.createAccount(
      connection,
      wallet, // Payer of the transaction
      mint, // Mint address
      wallet.publicKey // Owner of the token account
    );

    console.log(`Receiver Token Account: ${receiverTokenAccount.toBase58()}`);

    // Mint tokens to the receiver's token account
    const mintAmount = 2; // Mint 2 tokens (USDC)
    await splToken.mintTo(
      connection,
      wallet,
      mint,
      receiverTokenAccount,
      wallet.publicKey,
      mintAmount
    );

    console.log(`Minted ${mintAmount} tokens successfully to receiver's account`);

    const tokenAccountInfo = await splToken.getAccount(connection, receiverTokenAccount);

    assert.equal(tokenAccountInfo.amount, BigInt(mintAmount), "Receiver account balance should match the minted amount");
    console.log("Token minting and verification successful");
  });
});