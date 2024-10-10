import assert from "assert";
import * as web3 from "@solana/web3.js";
import {
  Keypair,
  Transaction,
  SystemProgram,
  ParsedAccountData,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MintLayout,
  createInitializeMintInstruction,
  createMintToInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey("zaZvVNGdWhSMykZxPdzfwuRvdLj6kLBezuJwnQhHg8q");
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = { keypair: web3.Keypair.generate() };


async function waitForTokenBalance(
  accountAddress,
  expectedBalance,
  retries = 5
) {
  for (let i = 0; i < retries; i++) {
    const accountInfo = await connection.getParsedAccountInfo(
      accountAddress
    );

    if (accountInfo.value !== null) {
      const tokenAmount =
        accountInfo.value.data.parsed.info.tokenAmount.uiAmount;

      if (tokenAmount === expectedBalance) {
        return tokenAmount;
      }
    }
  }
  throw new Error("Token balance did not update within expected time");
}

describe("Mint Program", () => {
  let mintAccount: Keypair;
  let receiverTokenAccount: Keypair;
  let mintAuthority: Keypair;
  let freezeAuthority: Keypair;

  // Step 1: Test initialize_custom_mint function
  it("Initialize Mint Account", async () => {
    try {
      mintAccount = Keypair.generate();
      mintAuthority = Keypair.generate();
      freezeAuthority = Keypair.generate();

      const rentExemption =
        await connection.getMinimumBalanceForRentExemption(MintLayout.span);
      console.log(`Rent exemption required: ${rentExemption}`);

      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.keypair.publicKey,
        newAccountPubkey: mintAccount.publicKey,
        lamports: rentExemption,
        space: MintLayout.span, 
        programId: TOKEN_PROGRAM_ID,
      });

      const initMintIx = createInitializeMintInstruction(
        mintAccount.publicKey,
        6,
        mintAuthority.publicKey,
        freezeAuthority.publicKey,
        TOKEN_PROGRAM_ID
      );

      const tx = new Transaction().add(createMintAccountIx, initMintIx);
      const signature = await connection.sendTransaction(tx, [
        wallet.keypair,
        mintAccount,
      ]);
      console.log(`Transaction Signature: ${signature}`);

      await connection.confirmTransaction(signature);

      const mintInfo = await connection.getParsedAccountInfo(
        mintAccount.publicKey
      );
      //console.log("mintInfo: ", mintInfo);
      //console.log("mintAccount publicKey: ", mintAccount.publicKey);

      assert(mintInfo.value !== null, "Mint account not initialized");

      assert.equal(
        mintInfo.value.owner.toString(),
        TOKEN_PROGRAM_ID.toString(),
        "Mint account is not owned by the Token Program"
      );

      console.log("Mint initialized successfully.");
    } catch (err) {
      console.error("Error initializing mint account:", err);
      throw err;
    }
  });

  // Step 2: Test mint_custom_usdc function
  it("Mint tokens to receiver", async () => {
    const receiverAccount = Keypair.generate();
    const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.keypair,
      mintAccount.publicKey,
      receiverAccount.publicKey,
      false // Allow owner off curve (must be true only for PDA accounts)
    );

    // Mint 1000 units of token
    const mintAmount = 1000 * 10 ** 6;

    const mintToIx = createMintToInstruction(
      mintAccount.publicKey, 
      receiverTokenAccount.address,
      mintAuthority.publicKey,
      mintAmount,
      []
    );

    const tx = new Transaction().add(mintToIx);
    await connection.sendTransaction(tx, [wallet.keypair, mintAuthority]);

    const receiverTokenAccountInfo = await connection.getParsedAccountInfo(
      receiverTokenAccount.address
    );

    assert(
      receiverTokenAccountInfo.value !== null,
      "Receiver account not initialized"
    );

    //const tokenAmount =
    //  receiverTokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
    const tokenAmount = await waitForTokenBalance(
      receiverTokenAccount.address,
      1000,
      10
    );

    // console.log(
    //   "Receiver token account:",
    //   receiverTokenAccount.address.toBase58()
    // );
    // console.log(
    //   "\n\nparsed data: ",
    //   (receiverTokenAccountInfo.value.data as ParsedAccountData).parsed
    // );
    //console.log("\nreciver: ", receiverTokenAccountInfo);
    //console.log("\ntoken Amount: ", tokenAmount);

    assert.equal(tokenAmount, 1000, "Minted amount does not match");

    console.log("Tokens minted successfully.");
  });
});
