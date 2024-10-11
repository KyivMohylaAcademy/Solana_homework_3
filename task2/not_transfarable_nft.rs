import { Connection, Keypair, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, createMintToInstruction } from '@solana/spl-token';
import * as borsh from 'borsh';
import { Buffer } from 'buffer';

class Assignable {
  constructor(properties: any) {
    Object.assign(this, properties);
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

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const payer = Keypair.generate();
  const mint = Keypair.generate();

  // Airdrop SOL to the payer
  await connection.confirmTransaction(await connection.requestAirdrop(payer.publicKey, 2_000_000_000));

  // Create and initialize the mint
  const mintTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      space: 82,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mint.publicKey, 0, payer.publicKey, null)
  );
  await connection.sendTransaction(mintTx, [payer, mint]);

  // Ensure the mint is non-transferable using Borsh
  const nonTransferableIx = new TransactionInstruction({
    keys: [
      { pubkey: mint.publicKey, isSigner: true, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: new CreateTokenArgs({ token_decimals: 0 }).toBuffer(),
  });
  await connection.sendTransaction(new Transaction().add(nonTransferableIx), [payer, mint]);

  // Mint 1 token (NFT) to the recipient
  const recipient = Keypair.generate();
  const mintToTx = new Transaction().add(
    createMintToInstruction(mint.publicKey, recipient.publicKey, payer.publicKey, 1)
  );
  await connection.sendTransaction(mintToTx, [payer, mint]);

  console.log('Minted 1 non-transferable NFT to:', recipient.publicKey.toBase58());
}

main().catch(console.error);