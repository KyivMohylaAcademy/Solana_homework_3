import * as borsh from "borsh";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, createMint } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as borsh from "borsh";
// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey("J7CZbU6j8WxY3pRpYHo2JEZ7rqU4y3hd1fd9PXsVMuuD");
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = { keypair: web3.Keypair.generate() };


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
      fields: [["token_decimals", "u8"]],
    },
  ],
]);

describe("Create Token", async () => {
  const PROGRAM_ID = PROGRAM_ID;
  const connection = connection; // Solana connection object
  const payer = wallet.keypair;
  it("Create a Token-22 SPL-Token !", async () => {
    const blockhashInfo = await connection.getLatestBlockhash();

    const instructionData = new CreateTokenArgs({
      token_decimals: 9,
    });

    const mintAccount = await createMint(
      connection, // Connection
      payer, // Payer for transaction fees
      payer.publicKey, // Mint authority
      null, // Freeze authority (none in this case)
      9 // Token decimals
    );

    console.log(`Mint account created: ${mintAccount}`);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: mintAccount, isSigner: true, isWritable: true }, // Mint account
        { pubkey: payer.publicKey, isSigner: false, isWritable: true }, // Mint authority account
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // Transaction Payer
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // Rent account
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System program
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
      ],
      programId: PROGRAM_ID,
      data: instructionData.toBuffer(),
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhashInfo.blockhash;
    tx.feePayer = payer.publicKey;
    tx.add(ix);

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer], // Only the payer needs to sign since the mint account is already created
        {
          commitment: "confirmed",
        }
      );
      console.log("Transaction confirmed with signature:", signature);
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }

    console.log("Token Mint Address:", mintAccount.toBase58());

    const confirmedTransaction = await connection.getParsedTransaction(
      mintAccount.toBase58(),
      "confirmed"
    );

    assert(
      confirmedTransaction?.meta?.logMessages[0].startsWith(
        `Program ${PROGRAM_ID}`
      )
    );
    console.log("Non-transferable Token successfully minted!");
  });
});
