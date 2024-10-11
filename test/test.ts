import { Buffer } from 'node:buffer';
import { describe, test } from 'node:test';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { assert } from 'chai';
import { start } from 'solana-bankrun';

class Assignable {
  constructor(properties) {
    for (const [key, value] of Object.entries(properties)) {
      this[key] = value;
    }
  }
}

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
