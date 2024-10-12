import { Connection, Keypair, Transaction, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import assert from "assert";

const programId = new PublicKey("6Tccmqqh8sGxG2RNwU6GYEdy9oZBXFU3uBMFVgXXKbBd");
const receiverPublicKey = new PublicKey(
  "Bwiox5FXU8FBFKGA4HjG4rj1zqmL9KCgtiuMdMWY5JTK"
);

describe("MyTokenProgram: mint_custom_usdc", () => {
  let connection: Connection;
  let payer: Keypair;
  let mint: PublicKey;

  before(async () => {
    connection = new Connection("https://api.devnet.solana.com");
    const secretKey = Uint8Array.from([
      196, 189, 33, 157, 216, 158, 188, 126, 148, 61, 63, 80, 220, 209, 164,
      157, 26, 163, 176, 111, 235, 2, 50, 223, 132, 190, 179, 38, 22, 135, 93,
      48, 71, 22, 193, 250, 52, 25, 201, 171, 30, 213, 47, 170, 118, 162, 63,
      214, 147, 120, 247, 172, 80, 199, 16, 29, 99, 177, 37, 119, 198, 170, 228,
      148,
    ]);
    payer = Keypair.fromSecretKey(secretKey);
    mint = await createMint(connection, payer, payer.publicKey, null, 6);
  });

  it("should mint tokens using mint_custom_usdc", async () => {
    const receiverAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      receiverPublicKey
    );

    const initialAccountInfo = await getAccount(
      connection,
      receiverAccount.address
    );
    const initialBalance = Number(initialAccountInfo.amount);

    const mintAmount = 500 * Math.pow(10, 6);
    const mintCustomIx = new web3.TransactionInstruction({
      keys: [
        { pubkey: mint, isSigner: false, isWritable: true }, // Mint acc
        { pubkey: receiverAccount.address, isSigner: false, isWritable: true }, // receiver
        { pubkey: payer.publicKey, isSigner: true, isWritable: false }, // authority
      ],
      programId,
      data: Buffer.concat([
        Buffer.from([1]),
        Buffer.from(new BN(mintAmount).toArray("le", 8)),
      ]),
    });

    console.log("Creating transaction...");
    const tx = new Transaction().add(mintCustomIx);
    console.log("Sending transaction...");
    await web3.sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("Transaction sent.");

    const finalAccountInfo = await getAccount(
      connection,
      receiverAccount.address
    );
    const finalBalance = Number(finalAccountInfo.amount);

    assert.equal(
      finalBalance,
      initialBalance + mintAmount,
      "Mint amount mismatch finalBalance and mintAmount"
    );
  }),
    60000;
});
