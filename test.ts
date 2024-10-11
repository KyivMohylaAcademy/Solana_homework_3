import { Buffer } from 'node:buffer';
import { describe, test } from 'node:test';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { assert } from 'chai';
import { start } from 'solana-bankrun';

class Assignable {
  constructor(properties: any) {
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
      kind: 'struct',
      fields: [['token_decimals', 'u8']],
    },
  ],
]);

describe('Non-transferable NFT', async () => {
  const PROGRAM_ID = PublicKey.unique();
  const context = await start([{ name: 'nft_program', programId: PROGRAM_ID }], []);
  const client = context.banksClient;
  const payer = context.payer;

  test('Create a Non-transferable NFT', async () => {
    const blockhash = context.lastBlockhash;
    const mintKeypair: Keypair = Keypair.generate();

    const instructionData = new CreateTokenArgs({
      token_decimals: 0, // For NFT, decimals = 0
    });

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true }, // Mint account
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // Mint authority
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // Payer
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // Rent account
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
      ],
      programId: PROGRAM_ID,
      data: instructionData.toBuffer(),
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, mintKeypair);

    const transaction = await client.processTransaction(tx);

    // Assert to check log messages or expected behaviors
    assert(transaction.logMessages[0].startsWith(`Program ${PROGRAM_ID}`));
    console.log('Mint Address: ', mintKeypair.publicKey.toBase58());

    // Test Non-transferability (this can be done by trying to transfer and expecting failure)
    // Implement a transfer attempt and check the log for failure due to non-transferability
  });
});
