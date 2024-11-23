import { Buffer } from 'node:buffer';
import { describe, it } from 'node:test';
import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { assert } from 'chai';
import * as borsh from 'borsh';
import { start } from 'solana-bankrun';

class BaseStructure {
  constructor(fields) {
    Object.assign(this, fields);
  }
}

class InitMintArgs extends BaseStructure {
  serialize() {
    return Buffer.from(borsh.serialize(InitMintSchema, this));
  }
}
const InitMintSchema = new Map([
  [
    InitMintArgs,
    {
      kind: 'struct',
      fields: [],
    },
  ],
]);

class MintTokensArgs extends BaseStructure {
  serialize() {
    return Buffer.from(borsh.serialize(MintTokensSchema, this));
  }
}
const MintTokensSchema = new Map([
  [
    MintTokensArgs,
    {
      kind: 'struct',
      fields: [['amount', 'u64']],
    },
  ],
]);

describe('Token Operations Suite', async () => {
  const PROGRAM_ID = "3Rq2ZUgqZNvPghWD4QDXQq5cc8kBHAen8c1EYgN3LU9B2KM4rBtKUwe17Py6FUU4HfzqrcVzUtDJHJoHLHWLVAGi";
  const environment = await start([{ name: 'token_program', programId: PROGRAM_ID }], []);
  const client = environment.banksClient;
  const signer = environment.payer;

  it('should initialize a new mint account', async () => {
    const mintAccount = Keypair.generate();
    const recentBlockhash = environment.lastBlockhash;

    const data = new InitMintArgs({});
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: mintAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: signer.publicKey, isSigner: true, isWritable: true },
        { pubkey: signer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: data.serialize(),
    });

    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = recentBlockhash;
    transaction.sign(signer, mintAccount);

    const result = await client.processTransaction(transaction);
    assert(result.logMessages[0].includes(`Program ${PROGRAM_ID}`));

    console.log('Initialized Mint Account:', mintAccount.publicKey.toBase58());
  });

  it('should mint tokens to an account', async () => {
    const mintAccount = Keypair.generate();
    const recipientAccount = Keypair.generate();
    const recentBlockhash = environment.lastBlockhash;
    const amount = 1000;

    const data = new MintTokensArgs({ amount: BigInt(amount) });
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: mintAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: recipientAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: signer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: data.serialize(),
    });

    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = recentBlockhash;
    transaction.sign(signer, mintAccount);

    const result = await client.processTransaction(transaction);
    assert(result.logMessages[0].includes(`Program ${PROGRAM_ID}`));

    console.log('Successfully minted tokens:', amount);
  });
});
