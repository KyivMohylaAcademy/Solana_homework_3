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
    "6yMpiU4jtKFRs53JSBiNQkhNSh25BaKQ5pSJmPLKq1xT"
  );

  const PAYER_SECRET_KEY = Uint8Array.from([
   31,  21,  37, 220, 115, 163, 163, 227,  71, 166, 201,
    1,  89, 187,  46, 162, 172, 208,  48, 124, 254,  93,
    8,  55, 127, 197, 151, 230,  23, 229, 199,  63, 159,
  121, 244, 118,  14, 104,  12,  14, 124,  49, 205,  26,
   40,  41,  74, 213, 202,  56,  93, 168, 245,  64, 164,
  208, 177, 202, 160, 199, 141, 156, 190, 145
  ]);

  const connection = new Connection(`https://api.devnet.solana.com`, "confirmed");

  describe("Custom USDC test", async () => {
    const payer = Keypair.fromSecretKey(PAYER_SECRET_KEY);
    const mintKeypair = Keypair.generate();
    const freezeAuthorityKeypair = Keypair.generate();
    const recipientKeypair = Keypair.generate();

    before(async () => {
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
        mint_amount: 1525,
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
      console.log("Transaction signature: ", signature);
    });
  });
