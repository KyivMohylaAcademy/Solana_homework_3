import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import assert from 'assert';

const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
const payer = web3.Keypair.generate();
const wallet = payer;

let mint: web3.PublicKey;

describe("Custom Mint Test", () => {
  it("initialize custom mint", async () => {
    const DECIMALS = 1;

    const airdropSignature = await connection.requestAirdrop(
      wallet.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);

    mint = await splToken.createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      DECIMALS
    );

    console.log(`Mint Address: ${mint.toBase58()}`);

    const mintAccount = await connection.getAccountInfo(mint);

    assert(mintAccount !== null, "Mint account should exist");
    assert.equal(mintAccount.owner.toBase58(), splToken.TOKEN_PROGRAM_ID.toBase58());
    console.log("Custom mint initialized successfully");
  });

  it("mint custom USDC tokens", async () => {
    if (!mint) {
      throw new Error("Mint was not initialized in the previous test.");
    }

    const receiverTokenAccount = await splToken.createAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log(`Receiver Token Account: ${receiverTokenAccount.toBase58()}`);

    const mintAmount = 2;
    await splToken.mintTo(
      connection,
      wallet,
      mint,
      receiverTokenAccount,
      wallet.publicKey,
      mintAmount
    );

    console.log(`Minted ${mintAmount} tokens to receiver's account`);

    const tokenAccountInfo = await splToken.getAccount(connection, receiverTokenAccount);

    assert.equal(tokenAccountInfo.amount, BigInt(mintAmount), "Receiver account balance should match the minted amount");
    console.log("Token minting and verification successful");
  });
});