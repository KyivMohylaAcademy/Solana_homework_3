import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import assert from 'assert';

const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
const payer = web3.Keypair.generate();
const wallet = payer;

let mint;

describe("Custom Mint Test Suite", () => {
  it("should initialize the custom mint", async () => {
    const decimals = 1;

    const airdropTx = await connection.requestAirdrop(wallet.publicKey, web3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropTx);

    mint = await splToken.createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      decimals
    );

    console.log(`Mint Address: ${mint.toBase58()}`);

    const mintAccount = await connection.getAccountInfo(mint);

    assert(mintAccount !== null);
    assert.equal(mintAccount.owner.toBase58(), splToken.TOKEN_PROGRAM_ID.toBase58());
    console.log("Mint initialized successfully");
  });

  it("should mint custom tokens", async () => {
    if (!mint) {
      throw new Error("Mint not initialized in the previous test.");
    }

    const receiverAccount = await splToken.createAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log(`Receiver Token Account: ${receiverAccount.toBase58()}`);

    const mintAmount = 2;
    await splToken.mintTo(
      connection,
      wallet,
      mint,
      receiverAccount,
      wallet.publicKey,
      mintAmount
    );

    console.log(`Minted ${mintAmount} tokens to receiver's account`);

    const accountInfo = await splToken.getAccount(connection, receiverAccount);
    assert.equal(accountInfo.amount, BigInt(mintAmount));
    console.log("Token minting verification successful");
  });
});
