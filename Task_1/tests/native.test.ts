import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";

// Constants
const PROGRAM_ID = pg.PROGRAM_ID;
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Helper function to send transactions (with pg.wallet signing)
async function sendTransaction(instructions: TransactionInstruction[]) {
  const blockhashInfo = await pg.connection.getLatestBlockhash();

  const tx = new web3.Transaction().add(...instructions);
  tx.recentBlockhash = blockhashInfo.blockhash;
  tx.feePayer = pg.wallet.publicKey;

  try {
    const signature = await sendAndConfirmTransaction(
      pg.connection,
      tx,
      [pg.wallet.keypair],
      { commitment: "confirmed" }
    );
    console.log("Transaction confirmed:", signature);
    return signature;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
}

// Helper to wait for balance change in the receiver's account due to timing mismatch
async function waitForTokenBalance(
  accountAddress: PublicKey,
  expectedBalance: number,
  retries = 5
) {
  for (let i = 0; i < retries; i++) {
    const accountInfo = await connection.getParsedAccountInfo(accountAddress);

    if (accountInfo.value !== null) {
      const tokenAmount =
        accountInfo.value.data["parsed"].info.tokenAmount.uiAmount;

      if (tokenAmount === expectedBalance) {
        return tokenAmount;
      }
    }
  }
  throw new Error("Token balance did not update within expected time");
}

describe("Test Deployed Mint Program", () => {
  let mintAccount: Keypair;
  let receiverAccount: Keypair;
  let freezeAuthority: Keypair;

  // Step 1: Test the initialize_custom_mint function
  it("Initialize Mint Account", async () => {
    try {
      mintAccount = Keypair.generate();
      freezeAuthority = Keypair.generate();

      const rentExemption = await connection.getMinimumBalanceForRentExemption(
        82
      ); 
      console.log(`Rent exemption required: ${rentExemption}`);
      console.log(`Program: ${pg.PROGRAM_ID}`);

      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: pg.wallet.publicKey, // Connected wallet funds the mint creation
        newAccountPubkey: mintAccount.publicKey, // New mint account
        lamports: rentExemption,
        space: 82, // Mint account space
        programId: TOKEN_PROGRAM_ID, // SPL Token program ID
      });
      console.log("1");

      const initMintIx = new TransactionInstruction({
        keys: [
          { pubkey: mintAccount.publicKey, isSigner: false, isWritable: true }, // Mint account
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          }, // System program
          { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: false }, // Mint authority (pg.wallet as signer)
          {
            pubkey: freezeAuthority.publicKey,
            isSigner: false,
            isWritable: false,
          }, // Freeze authority
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([0]), // Instruction data to initialize the mint
      });
      console.log("2");

      const signature = await sendTransaction([
        createMintAccountIx,
        initMintIx,
      ]);
      console.log(`Initialize mint transaction signature: ${signature}`);

      const mintInfo = await connection.getParsedAccountInfo(
        mintAccount.publicKey
      );
      if (!mintInfo.value) {
        throw new Error("Mint account not initialized");
      }

      console.log("Mint initialized successfully.");
    } catch (err) {
      console.error("Error initializing mint account:", err);
      throw err;
    }
  });

  // Step 2: Test mint_custom_usdc function
  it("Mint tokens to receiver", async () => {
    try {
      receiverAccount = Keypair.generate();

      const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        pg.wallet.keypair,
        mintAccount.publicKey,
        receiverAccount.publicKey
      );

      // Amount to mint: 1000 tokens (6 decimal places)
      const mintAmount = 1000 * 10 ** 6;

      const mintData = Buffer.concat([
        Buffer.from([1]), // Instruction to mint tokens
        new BN(mintAmount).toArrayLike(Buffer, "le", 8),
      ]);

      const mintToIx = new TransactionInstruction({
        keys: [
          { pubkey: mintAccount.publicKey, isSigner: false, isWritable: true },
          {
            pubkey: receiverTokenAccount.address,
            isSigner: false,
            isWritable: true,
          },
          { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: mintData,
      });

      const signature = await sendTransaction([mintToIx]);
      console.log(`Mint transaction signature: ${signature}`);

      const tokenAmount = await waitForTokenBalance(
        receiverTokenAccount.address,
        1000,
        10
      );
      if (tokenAmount !== 1000) {
        throw new Error(
          `Minted amount mismatch: expected 1000, got ${tokenAmount}`
        );
      }

      console.log("Tokens minted successfully.");
    } catch (err) {
      console.error("Error minting tokens:", err);
      throw err;
    }
  });
});
