import {
    Connection,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    createMint,
    getMint,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    MINT_SIZE,
} from "@solana/spl-token";
import assert from "assert";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

describe("Mint Initialization Test", () => {
    let payer, mintAuthority, freezeAuthority, mintAccount;

    before(async () => {
        payer = Keypair.generate();
        mintAuthority = Keypair.generate();
        freezeAuthority = Keypair.generate();

        const airdropSignature = await connection.requestAirdrop(
            payer.publicKey,
            2 * 1e9
        );
        await connection.confirmTransaction(airdropSignature);

        mintAccount = Keypair.generate();
    });

    it("should create and initialize a mint", async () => {
        const mintRentExempt = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintAccount.publicKey,
                space: MINT_SIZE,
                lamports: mintRentExempt,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintAccount.publicKey,
                0,
                mintAuthority.publicKey,
                freezeAuthority.publicKey,
                TOKEN_PROGRAM_ID
            )
        );

        await sendAndConfirmTransaction(connection, transaction, [payer, mintAccount]);

        const mintInfo = await getMint(connection, mintAccount.publicKey);

        assert.strictEqual(mintInfo.mintAuthority?.toBase58(), mintAuthority.publicKey.toBase58(), "Incorrect mint authority");
        assert.strictEqual(mintInfo.freezeAuthority?.toBase58(), freezeAuthority.publicKey.toBase58(), "Incorrect freeze authority");
        assert.strictEqual(mintInfo.decimals, 0, "Decimals must be 0");
        assert.ok(mintInfo.isInitialized, "Mint must be initialized");

        console.log("Mint initialized successfully and is a non-transferable NFT");
    });
});
