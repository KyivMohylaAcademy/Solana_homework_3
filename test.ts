import {
    Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction,
  } from '@solana/web3.js';
  import {
    TOKEN_PROGRAM_ID, createInitializeMintInstruction, MINT_SIZE, createMintToInstruction,
  } from '@solana/spl-token';
  import { createInitializeNonTransferableMintInstruction } from '@solana/spl-token';
  
  async function main() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const payer = Keypair.generate();
    const mintAuthority = Keypair.generate();
    const mint = Keypair.generate();
  
    // Fund payer with SOL
    await connection.confirmTransaction(await connection.requestAirdrop(payer.publicKey, 2 * 1_000_000_000));
  
    // Create and initialize the mint account
    const mintLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const tx = new Transaction()
      .add(SystemProgram.createAccount({
        fromPubkey: payer.publicKey, newAccountPubkey: mint.publicKey, lamports: mintLamports, space: MINT_SIZE, programId: TOKEN_PROGRAM_ID,
      }))
      .add(createInitializeMintInstruction(mint.publicKey, 0, mintAuthority.publicKey, null))
      .add(createInitializeNonTransferableMintInstruction(mint.publicKey, TOKEN_PROGRAM_ID));
    await sendAndConfirmTransaction(connection, tx, [payer, mint]);
  
    console.log('NFT Mint initialized:', mint.publicKey.toBase58());
  
    // Mint 1 non-transferable NFT to the payer's token account
    const recipientTokenAccount = await createAssociatedTokenAccount(connection, payer, mint.publicKey, payer.publicKey);
    await sendAndConfirmTransaction(connection, new Transaction().add(createMintToInstruction(mint.publicKey, recipientTokenAccount, mintAuthority.publicKey, 1)), [payer, mintAuthority]);
  
    console.log('Minted 1 non-transferable NFT to:', recipientTokenAccount.toBase58());
  }
  
  async function createAssociatedTokenAccount(connection: Connection, payer: Keypair, mint: PublicKey, owner: PublicKey) {
    const ata = Keypair.generate();
    const tx = new Transaction()
      .add(SystemProgram.createAccount({
        fromPubkey: payer.publicKey, newAccountPubkey: ata.publicKey, lamports: await connection.getMinimumBalanceForRentExemption(165), space: 165, programId: TOKEN_PROGRAM_ID,
      }));
    await sendAndConfirmTransaction(connection, tx, [payer, ata]);
    return ata.publicKey;
  }
  
  main().catch(console.error);