import {
    Keypair,
    PublicKey,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
    Connection,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  
  import * as borsh from "borsh";
  
  class Assignable {
    constructor(properties) {
      for (const [key, value] of Object.entries(properties)) {
        this[key] = value;
      }
    }
  }
  
  class CreateTokenArgs extends Assignable {
    toBuffer() {
      return Buffer.from(borsh.serialize(CreateTokenArgsSchema, this));
    }
  }
  
  const CreateTokenArgsSchema = new Map([
    [
      CreateTokenArgs,
      {
        kind: "struct",
        fields: [
          ["instruction", "u8"],  
          ["mint_amount", "u64"],   
        ],
      },
    ],
  ]);
  
  const PROGRAM_ID = new PublicKey(
    "3G4495jCW3D95eDcJwp687jACvHRzptrw7tavKm4Q9bP"
  );
  
  // Since I couldn't solve the problems with airdrop, I couldn't mock payer.
  // So I provided a key with a little sol on it to pay the transaction fee.
  const PAYER_SECRET_KEY = Uint8Array.from([
    146, 35, 168, 40, 22, 198, 70, 190, 28, 128, 75, 99, 173, 55, 188, 115, 228,
    231, 70, 182, 110, 70, 240, 180, 48, 157, 58, 23, 64, 60, 21, 70, 56, 35, 240,
    155, 255, 190, 193, 234, 141, 131, 206, 70, 84, 85, 140, 8, 189, 65, 221, 172,
    82, 67, 226, 100, 147, 59, 254, 157, 48, 128, 39, 27,
  ]);
  
  const connection = new Connection(`https://api.devnet.solana.com`, "confirmed");
  
  describe("Custom USDC test", async () => {
    const payer = Keypair.fromSecretKey(PAYER_SECRET_KEY);
    const mintKeypair = Keypair.generate();
    const freezeAuthorityKeypair = Keypair.generate();
    const recipientKeypair = Keypair.generate();
  
    before(async () => {
      // Check if payer has Sol
      const payerBalance = await connection.getBalance(payer.publicKey);
      if (payerBalance === 0) {
        throw new Error("Payer has no SOL. Cannot proceed with transactions.");
      }
    });
  
    it("test_initialize_custom_mint", async () => {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const instructionData = new CreateTokenArgs({
        instruction: 0,
        mint_amount: 0,
      });
  
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: payer.publicKey, isSigner: true, isWritable: false },
          {
            pubkey: freezeAuthorityKeypair.publicKey,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data: instructionData.toBuffer(),
      });
  
      const tx = new Transaction().add(ix);
      tx.recentBlockhash = blockhash;
      tx.feePayer = payer.publicKey;
      tx.sign(payer, mintKeypair);
  
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer, mintKeypair],
        {
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        }
      );
  
      console.log("Custom Mint Initialized. Mint Address:", mintKeypair.publicKey.toBase58());
      console.log("Transaction signature: ", signature);
    });
  
    it("test_mint_custom_usdc", async () => {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
  
      const instructionData = new CreateTokenArgs({
        instruction: 1,
        mint_amount: 1337,
      });
  
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
          {
            pubkey: recipientKeypair.publicKey,
            isSigner: false,
            isWritable: true,
          },
          { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: instructionData.toBuffer(),
      });
  
      const tx = new Transaction().add(ix);
      tx.recentBlockhash = blockhash;
      tx.feePayer = payer.publicKey;
      tx.sign(payer);
  
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer],
        {
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        }
      );
  
      console.log("Successfully minted to recipient:", recipientKeypair.publicKey.toBase58());
      console.log("Transaction signature: ", signature)
    });
  });
  