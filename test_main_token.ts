import "mocha";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as splToken from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Connection,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as borsh from "borsh";


describe("Token Tests", () => {
  const connection = new Connection("https://api.devnet.solana.com");

  const payer = Keypair.generate();
  connection.requestAirdrop(payer.publicKey, 2 * 1e9);
  // airdrop didn't work so i had to use the real secret key

  const programId = pg.PROGRAM_ID;

  it("Initialize Mint Test", async () => {
    const mintKeypair: Keypair = Keypair.generate(); // Generate a new keypair for the mint account

    const instructionData = Buffer.from(new Uint8Array([0])); // 0 for Initialize Mint
    console.log(instructionData[0]);

    // Create the transaction instruction for initializing the mint
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: programId,
      data: instructionData,
    });

    // Create and sign the transaction
    const tx = new Transaction();
    const recentBlocklash = await connection.getLatestBlockhash();
    tx.recentBlockhash = recentBlocklash.blockhash; // Assign mock blockhash
    tx.add(ix).sign(payer, mintKeypair);

    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        payer,
        mintKeypair,
      ]);
      console.log(`Transaction signature is ${signature}!`);
      console.log(
        "Mint Account Initialized: ",
        mintKeypair.publicKey.toBase58()
      );
    } catch (error) {
      console.error("Transaction failed: ", error);
    }

    
  });

  it("Mint Custom USDC Test", async () => {
    const mintKeypair: Keypair = Keypair.generate(); // Generate a new keypair for the mint account
    const receiverKeypair: Keypair = Keypair.generate(); // Generate a new keypair for the receiver account
    const mintAmount = 10; // Amount to mint


    const instructionData = Buffer.from(new Uint8Array([1]));


    // Create the transaction instruction for minting tokens
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        {
          pubkey: receiverKeypair.publicKey,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: programId,
      data: instructionData, // Use the serialized data for the instruction
    });

    // Create and sign the transaction
    const tx = new Transaction();
    const recentBlocklash = await connection.getLatestBlockhash();
    tx.recentBlockhash = recentBlocklash.blockhash;
    tx.add(ix).sign(payer, mintKeypair);

    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        payer,
        mintKeypair,
      ]);

      console.log(`Transaction signature is ${signature}!`);
      console.log(
        "Mint Account Initialized: ",
        mintKeypair.publicKey.toBase58()
      );

      if (signature) {
        console.log("Transaction was successful.");
        console.log(
          `View the transaction on Solana Explorer at \nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
        );

        console.log("Minted Tokens: ", mintAmount);
      } else {
        console.error("Transaction was not successful: No signature returned.");
      }

    } catch (error) {
      console.error("Transaction failed: ", error);
    }
  });
});
