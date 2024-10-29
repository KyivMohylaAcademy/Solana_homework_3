import assert from "assert";
import * as web3 from "@solana/web3.js";
import {
  Connection,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import assert from "assert";
// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey("C4oTbEjc6pxY3WZbXMSHAMPL1485PZdNa4UrqxBtyZuq");
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = { keypair: web3.Keypair.generate() };


const network = "https://api.devnet.solana.com";

describe("Token Minting Test", () => {
  let con;
  let user;
  let mintToken;
  let recipient;
  let mintTransactionSignature;

  before(async () => {
    con = new Connection(network);
    user = Keypair.fromSecretKey(
      new Uint8Array([59, 105, 145, 244, 118, 160, 132, 26, 229, 36, 156, 140, 52, 142, 70, 254, 177, 180, 176, 7, 113, 70, 141, 218, 138, 75, 29, 169, 162, 50, 50, 115, 85, 243, 34, 103, 139, 18, 193, 76, 233, 184, 216, 24, 216, 148, 97, 189, 222, 71, 101, 140, 116, 242, 238, 82, 101, 192, 252, 96, 91, 66, 169, 230])
    );
    recipient = Keypair.generate();
    mintToken = await createMint(con, user, user.publicKey, null, 6);
  });

  it("Mints the specified token amount", async () => {
    const recipientAccount = await getOrCreateAssociatedTokenAccount(
      con,
      user,
      mintToken,
      recipient.publicKey
    );
    const amount = 12345;

    mintTransactionSignature = await mintTo(
      con,
      user,
      mintToken,
      recipientAccount.address,
      user.publicKey,
      amount
    );

    const finalAccountInfo = await getAccount(con, recipientAccount.address);
    assert.strictEqual(Number(finalAccountInfo.amount), amount);
  });
  after(() => {
    if (mintTransactionSignature) {
      console.log(`Transaction successful: https://explorer.solana.com/tx/${mintTransactionSignature}?cluster=devnet`);
    }
  });
});
