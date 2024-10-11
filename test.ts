import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram,
} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
} from '@solana/spl-token';
import { Buffer } from 'buffer';

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const payer = Keypair.generate();
const mintAuthority = Keypair.generate();
const freezeAuthority = Keypair.generate();
const receiver = Keypair.generate();
const PROGRAM_ID = new PublicKey("A5SwSxiUaBEPWEM5woV7yjzpJ8XB4uHSaUZJYBnnyi3R");

const initializeMint = async () => {
    const mint = Keypair.generate();
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MINT_SIZE,
            lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mint.publicKey,
            6,
            mintAuthority.publicKey,
            freezeAuthority.publicKey
        )
    );
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mint]
    );

    console.log(`Mint initialized. Transaction signature: ${signature}`);
    return mint;
};

const mintCustomToken = async (mint: PublicKey, amount: number) => {
    const receiverTokenAccount = await getAssociatedTokenAddress(
        mint,
        receiver.publicKey
    );
    const transaction = new Transaction().add(
        createMintToInstruction(
            mint,
            receiverTokenAccount,
            mintAuthority.publicKey,
            amount
        )
    );
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintAuthority]
    );
    console.log(`Minted ${amount} tokens. Transaction signature: ${signature}`);
};

const main = async () => {
    await connection.requestAirdrop(payer.publicKey, 1e9);

    const mint = await initializeMint();
    await mintCustomToken(mint.publicKey, 1000000);
};

main().catch(console.error);

class InitializeMintArgs extends Assignable {
    toBuffer() {
        return Buffer.from(borsh.serialize(InitializeMintSchema, this));
    }
}

const InitializeMintSchema = new Map([
    [
        InitializeMintArgs,
        {
            kind: 'struct',
            fields: [],
        },
    ],
]);

class MintToArgs extends Assignable {
    toBuffer() {
        return Buffer.from(borsh.serialize(MintToSchema, this));
    }
}

const MintToSchema = new Map([
    [
        MintToArgs,
        {
            kind: 'struct',
            fields: [['mint_amount', 'u64']],
        },
    ],
]);




describe('Custom Token Tests', async () => {
    const PROGRAM_ID = "3Rq2ZUgqZNvPghWD4QDXQq5cc8kBHAen8c1EYgN3LU9B2KM4rBtKUwe17Py6FUU4HfzqrcVzUtDJHJoHLHWLVAGi"
    const context = await start([{ name: 'custom_token_program', programId: PROGRAM_ID }], []);
    const client = context.banksClient;
    const payer = context.payer;
    test('Initialize Mint', async () => {
        const blockhash = context.lastBlockhash;
        const mintKeypair: Keypair = Keypair.generate();
        const instructionData = new InitializeMintArgs({});
        const ix = new TransactionInstruction({
            keys: [
                { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },
                { pubkey: payer.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PROGRAM_ID,

            data: instructionData.toBuffer(),
        });
        const tx = new Transaction();
        tx.recentBlockhash = blockhash;
        tx.add(ix).sign(payer, mintKeypair);
        const transaction = await client.processTransaction(tx);
        assert(transaction.logMessages[0].startsWith(`Program ${PROGRAM_ID}`));
        console.log('Mint Account Initialized: ', mintKeypair.publicKey.toBase58());
    });

    test('Mint Tokens', async () => {
        const blockhash = context.lastBlockhash;
        const mintKeypair: Keypair = Keypair.generate();
        const receiverKeypair: Keypair = Keypair.generate();
        const mintAmount = 1000;

        const instructionData = new MintToArgs({
            mint_amount: BigInt(mintAmount),
        });

        const ix = new TransactionInstruction({
            keys: [
                { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: receiverKeypair.publicKey, isSigner: false, isWritable: true },
                { pubkey: payer.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: instructionData.toBuffer(),
        });
        const tx = new Transaction();
        tx.recentBlockhash = blockhash;
        tx.add(ix).sign(payer, mintKeypair);
        const transaction = await client.processTransaction(tx);
        assert(transaction.logMessages[0].startsWith(`Program ${PROGRAM_ID}`));
        console.log('Minted Tokens: ', mintAmount);
    });
});