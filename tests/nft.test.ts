import assert from "assert";
import * as web3 from "@solana/web3.js";
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
} from "@solana/spl-token";
import assert from "assert";// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey("C4oTbEjc6pxY3WZbXMSHAMPL1485PZdNa4UrqxBtyZuq");
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = { keypair: web3.Keypair.generate() };



const con = new Connection("https://api.devnet.solana.com", "confirmed");

describe("NFT Minting Test", () => {
  let fundingKeypair, mintingAuthority, freezingAuthority, newMintAccount;
  let initMintTransactionSignature;

  before(async () => {
    fundingKeypair = Keypair.fromSecretKey(
      new Uint8Array([59, 105, 145, 244, 118, 160, 132, 26, 229, 36, 156, 140, 52, 142, 70, 254, 177, 180, 176, 7, 113, 70, 141, 218, 138, 75, 29, 169, 162, 50, 50, 115, 85, 243, 34, 103, 139, 18, 193, 76, 233, 184, 216, 24, 216, 148, 97, 189, 222, 71, 101, 140, 116, 242, 238, 82, 101, 192, 252, 96, 91, 66, 169, 230])
    );
    mintingAuthority = Keypair.generate();
    freezingAuthority = Keypair.generate();
    newMintAccount = Keypair.generate();
  });

  it("Mints the NFT Token", async () => {
    const rentExemption = await con.getMinimumBalanceForRentExemption(MINT_SIZE);

    const mintTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: fundingKeypair.publicKey,
        newAccountPubkey: newMintAccount.publicKey,
        space: MINT_SIZE,
        lamports: rentExemption,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        newMintAccount.publicKey,
        0,
        mintingAuthority.publicKey,
        freezingAuthority.publicKey,
        TOKEN_PROGRAM_ID
      )
    );

    initMintTransactionSignature = await sendAndConfirmTransaction(con, mintTransaction, [fundingKeypair, newMintAccount]);

    const mintDetails = await getMint(con, newMintAccount.publicKey);

    assert.strictEqual(mintDetails.mintAuthority?.toBase58(), mintingAuthority.publicKey.toBase58(), "Incorrect mint authority");
    assert.strictEqual(mintDetails.freezeAuthority?.toBase58(), freezingAuthority.publicKey.toBase58(), "Incorrect freeze authority");
    assert.strictEqual(mintDetails.decimals, 0, "Decimals must be 0");
    assert.ok(mintDetails.isInitialized, "Mint should be initialized");

    console.log("Mint successfully initialized as a non-transferable NFT");
  });
  after(() => {
    if (initMintTransactionSignature) {
      console.log(`Transaction successful: https://explorer.solana.com/tx/${initMintTransactionSignature}?cluster=devnet`);
    }
  });
});
