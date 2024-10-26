import {
  Connection,
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import assert from "assert";

const programId = new PublicKey(TOKEN_PROGRAM_ID);

describe("MyTokenTest", () => {
  let connection: Connection;
  let payer: Keypair;
  let mint: PublicKey;
  let receiver: Keypair;

  before(async () => {
    connection = new Connection("https://api.devnet.solana.com");
    payer = Keypair.generate();
    receiver = Keypair.generate();

    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);

    mint = await createMint(connection, payer, payer.publicKey, null, 6);
  });

  it("should mint tokens", async () => {
    const receiverAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      receiver.publicKey
    );

    const mintAmount = 1000;

    await mintTo(
      connection,
      payer,
      mint,
      receiverAccount.address,
      payer.publicKey,
      mintAmount
    );

    const accountInfo = await getAccount(connection, receiverAccount.address);
    assert(Number(accountInfo.amount) == mintAmount);
  });
});
