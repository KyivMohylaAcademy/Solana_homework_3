// No imports needed: web3, borsh, pg and more are globally available
class MintAcc {
  decimals = 0;
  constructor(fields: { decimals: number } | undefined = undefined) {
    if (fields) {
      this.decimals = fields.decimals;
    }
  }
}

// Borsh schema
const MintSchema = new Map([
  [MintAcc, { kind: "struct", fields: [["decimals", "u8"]] }],
]);

const MINT_SIZE = borsh.serialize(MintSchema, new MintAcc()).length;
describe("Tests:", () => {
  it("init custom mint", async () => {
    const mintAccountKp = new web3.Keypair();

    const rentExemptionLamports =
      await pg.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    //console.log(Rent lamports: ${rentExemptionLamports}); 897840

    const createMintAccountIx = web3.SystemProgram.createAccount({
      fromPubkey: pg.wallet.publicKey,
      lamports: rentExemptionLamports,
      newAccountPubkey: mintAccountKp.publicKey,
      programId: pg.PROGRAM_ID,
      space: MINT_SIZE,
    });

    const initMintIx = new web3.TransactionInstruction({
      keys: [
        { pubkey: mintAccountKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: pg.wallet.publicKey, isSigner: false, isWritable: false },
      ],
      programId: pg.PROGRAM_ID,
      data: Buffer.from([0, 6]),
    });

    const tx = new web3.Transaction().add(createMintAccountIx, initMintIx);

    try {
      const txHash = await web3.sendAndConfirmTransaction(pg.connection, tx, [
        pg.wallet.keypair,
        mintAccountKp,
      ]);

      console.log(`Transaction confirmed: ${txHash}`);
      console.log(`Use solana confirm -v ${txHash} to see the logs`);
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }

    const mintAccount = await pg.connection.getAccountInfo(
      mintAccountKp.publicKey
    );

    if (!mintAccount) {
      throw new Error("Mint account does not exist.");
    }

    const deserializedMintData = borsh.deserialize(
      MintSchema,
      MintAcc,
      mintAccount.data
    );

    assert(
      mintAccount.owner.equals(pg.PROGRAM_ID),
      "Mint account owner doesn't match"
    );
    assert(mintAccount.lamports > 0);
    assert.equal(
      deserializedMintData.decimals,
      0,
      "Mint account decimals are not 0"
    );
  });
});
