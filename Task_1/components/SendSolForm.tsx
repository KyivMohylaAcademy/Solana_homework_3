import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { FC, useState } from 'react';
import styles from '../styles/Home.module.css';

export const SendSolForm: FC = () => {
    const [txSig, setTxSig] = useState('');
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    
    const link = () => {
        return txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : '';
    };

    const sendSol = async (event) => {
        event.preventDefault();
        
        if (!connection || !publicKey) { return; }
    
        const transaction = new web3.Transaction();
        const mintAccount = new web3.PublicKey('8UJYuep6fdtzaqtvs7BeiTtz9Ho1jD6b1Vh6juNm72Hf');
        const receiverAccount = publicKey;
        const mintAuthority = publicKey; 
    
        const instructionData = Buffer.alloc(9);
        instructionData[0] = 1;
        const mintAmount = 1; 
        instructionData.writeBigUInt64LE(BigInt(mintAmount), 1);
    
        transaction.add(
            new web3.TransactionInstruction({
                keys: [
                    { pubkey: mintAccount, isSigner: false, isWritable: true },
                    { pubkey: receiverAccount, isSigner: true, isWritable: true },
                    { pubkey: mintAuthority, isSigner: true, isWritable: false },
                ],
                programId: new web3.PublicKey('ijduw28J31zTnJhZUeKHvbsnFy8DdmHUNxwy1J2XcTf'), 
                data: instructionData,
            })
        );
    
        try {
            const sig = await sendTransaction(transaction, connection);
            setTxSig(sig);
        } catch (error) {
            console.error("Transaction error:", error);
        }
    };
    
    
    return (
        <div>
            {publicKey ? (
                <form onSubmit={sendSol} className={styles.form}>
                    <button type="submit" className={styles.formButton}>Send</button>
                </form>
            ) : (
                <span>Connect Your Wallet</span>
            )}
            {txSig && (
                <div>
                    <p>View your transaction on </p>
                    <a href={link()}>Solana Explorer</a>
                </div>
            )}
        </div>
    );
};
