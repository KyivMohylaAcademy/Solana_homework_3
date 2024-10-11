import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';

const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
const payer = web3.Keypair.generate();
const wallet = payer;

let mint: web3.PublicKey;
let programId: web3.PublicKey;

function bigIntToBuffer(value: bigint): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(value);
    return buf;
}

describe("custom mint test", () => {
    beforeAll(async () => {
        console.log("requesting airdrop");
        const startTime = Date.now();

        const airdropSignature = await connection.requestAirdrop(
            wallet.publicKey,
            web3.LAMPORTS_PER_SOL
        );

        await connection.confirmTransaction(airdropSignature);
        const endTime = Date.now();
        console.log(`airdrop done in ${endTime - startTime} ms`);
        programId = new web3.PublicKey('4YL8joPpTi9s2ybEtPFRmQfQmwFgHZ4rBtHHeQXrsqVd');
    });

    it("initialize custom mint", async () => {
        const MINT_DECIMALS = 6;
        mint = await splToken.createMint(
            connection,
            wallet,
            wallet.publicKey,
            wallet.publicKey,
            MINT_DECIMALS
        );

        console.log(`mint address: ${mint.toBase58()}`);

        const transaction = new web3.Transaction().add(
            new web3.TransactionInstruction({
                keys: [
                    {pubkey: mint, isSigner: false, isWritable: true},
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: false},
                    {
                        pubkey: await splToken.getAssociatedTokenAddress(mint, wallet.publicKey),
                        isSigner: false,
                        isWritable: false
                    },
                    {pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false}
                ],
                programId: programId,
                data: Buffer.from([0])
            })
        );

        const signature = await web3.sendAndConfirmTransaction(connection, transaction, [wallet]);
        console.log(`transaction signature: ${signature}`);
    });

    it("mint custom tokens", async () => {

        const receiverTokenAccount = await splToken.createAccount(
            connection,
            wallet,
            mint,
            wallet.publicKey
        );

        console.log(`receiver acc: ${receiverTokenAccount.toBase58()}`);

        const mintAmount = BigInt(1);
        const mintInstruction = new web3.TransactionInstruction({
            keys: [
                {pubkey: mint, isSigner: false, isWritable: true},
                {pubkey: receiverTokenAccount, isSigner: false, isWritable: true},
                {pubkey: wallet.publicKey, isSigner: true, isWritable: false}
            ],
            programId: programId,
            data: Buffer.concat([Buffer.from([1]), bigIntToBuffer(mintAmount)])
        });

        const transaction = new web3.Transaction().add(mintInstruction);
        const signature = await web3.sendAndConfirmTransaction(connection, transaction, [wallet]);

        console.log(`signature of mint transaction: ${signature}`);
    });
});
