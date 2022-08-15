/* eslint-disable */

import * as anchor from "@project-serum/anchor";

import { FindReferenceError, findReference, validateTransfer } from "@solana/pay";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TransactionInputData, TransactionOutputData } from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";

import BigNumber from 'bignumber.js';
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
    getCandyMachineState,
} from "../utils";
import {
    getParsedNftAccountsByOwner,
} from "@nfteyez/sol-rayz";
import { useRouter } from "next/router";

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const anchorConnection = new anchor.web3.Connection(rpcHost);

export default function wallet(){

    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    let NFTamount = 0;
    let balanceBeforeTransaction = useState<number>(0);
    let nftNumberBeforeTransaction = useState<number>(0);
    let balanceAfterTransaction = 0
    let shop = "";
    // State to hold API response fields
    const [message, setMessage] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const serializedTransaction = useState<Buffer>();
    const mintPublicKey = useState<Uint8Array>();
    const mintSignature = useState<Uint8Array>(); 
    const verifyMintSignatureResult = useState<boolean | null>(null);
    const wallet = useWallet();

    // Read the URL query (which includes our chosen products)
    const searchParams = new URLSearchParams();

    // Generate the unique reference which will be used for this transaction
    const reference = useMemo(() => Keypair.generate().publicKey, []);
    // Add it to the params we'll pass to the API
    searchParams.append('reference', reference.toString());


    // Use our API to fetch the transaction for the selected items
    async function getTransaction() {
        if (!publicKey) {
            return;
        }
        const body: TransactionInputData = {
            account: publicKey.toString(),
        }
        const anchorWallet = {
            publicKey: wallet.publicKey
        } as anchor.Wallet;
         
        if (!searchParams.toString().includes("amount") ){
            
            const data =
                    await getCandyMachineState(
                        anchorWallet,
                        candyMachineId,
                        anchorConnection
                    );
            const { candyMachine } = data
            const candyprice = candyMachine.state.data.price
            NFTamount= candyprice/LAMPORTS_PER_SOL
            shop= candyMachine.state.wallet
            
            searchParams.toString().includes("amount") ? "" : searchParams.append('amount', NFTamount.toString())
            searchParams.toString().includes("shop") ? "" : searchParams.append('shop', shop.toString())

            const response = await fetch(`/api/transaction?${searchParams.toString()}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            })

            const json: TransactionOutputData = await response.json() as any

            if (response.status !== 200) {
                console.error(json);
                return;
            }

            // Deserialize the transaction from the response
            const deserializedTransaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
            setTransaction(deserializedTransaction);

            setMessage(json.message);
            mintPublicKey[0] = json.mintPublicKey;
            serializedTransaction[0] = Buffer.from(json.transaction, 'base64');
            mintSignature[0] = json.mintSignature;
            verifyMintSignatureResult[0] = json.verifyMintSignatureResult
            
        }
        let bbt = (await connection.getBalance(anchorWallet.publicKey)) / LAMPORTS_PER_SOL
        balanceBeforeTransaction[0] = bbt; 

        const nftArray = await getParsedNftAccountsByOwner({
            publicAddress: publicKey.toString() as string,
            connection: connection
        });
        nftNumberBeforeTransaction[0] = nftArray.length; 
    }

    useEffect(() => {
        if (NFTamount == 0 ){
            getTransaction()
        }
    }, [publicKey])
    
    // Send the fetched transaction to the connected wallet
    async function trySendTransaction() {
        if (!transaction) {
        return;
        }
        try {
            const anchorWallet = {
                publicKey: wallet.publicKey
            } as anchor.Wallet;
            const walletSignature = await sendTransaction(transaction, connection)
            /* let bbt = (await connection.getBalance(anchorWallet.publicKey)) / LAMPORTS_PER_SOL
            balanceBeforeTransaction[0] = bbt; */
        } catch (e) {
            console.error(e)
        }
    }
    
    // Send the transaction once it's fetched
    useEffect(() => {
        trySendTransaction()
    }, [transaction])

    useEffect(() => {
        const interval = setInterval(async () => {
        try {
            // Check if there is any transaction for the reference
            const signatureInfo = await findReference(connection, reference);
            const anchorWallet = {
                publicKey: wallet.publicKey
            } as anchor.Wallet;
            let bat = (await connection.getBalance(anchorWallet.publicKey)) / LAMPORTS_PER_SOL
            balanceAfterTransaction = bat

            let cost = balanceBeforeTransaction[0] - balanceAfterTransaction

            const nftArray2 = await getParsedNftAccountsByOwner({
                publicAddress: publicKey?.toString() as string,
                connection: connection
            });
            let nftNumbersfterTransaction: number = nftArray2.length;

            let numberOfNFTAdded: number = nftNumbersfterTransaction - nftNumberBeforeTransaction[0] 
            const amount: BigNumber = new BigNumber(NFTamount)

            await validateTransfer(
                connection,
                signatureInfo.signature,
                {
                  recipient: new PublicKey(shop),
                  amount
                },
                { commitment: 'confirmed' }
              )

              
            router.push({pathname: '/confirmed',
            query: { from: "Wallet", NFTAdded: `${numberOfNFTAdded}`, token: "SOL" , amount: cost.toFixed(3), sign: `${mintSignature[0]}`, verify: `${verifyMintSignatureResult[0]}` }})
        } catch (e) {
            if (e instanceof FindReferenceError) {
            // No transaction found yet, ignore this error
                return;
            }
            console.error('Unknown error', e)
        } 
        }, 500)
        return () => {
        clearInterval(interval)
        }
    }, [])

    if (!publicKey) {
        return (
          <div className='flex flex-col gap-8 items-center gradient-bg-welcome h-screen'>
            <div className="text-white">Cancel</div>
    
            <WalletMultiButton />
    
            <p className="text-white">You need to connect your wallet to make transactions</p>
          </div>
        )
      }
    
      return (
        <div className='flex flex-col gap-8 items-center gradient-bg-welcome h-screen'>
          <div className="text-white">Cancel</div>
    
          <WalletMultiButton />
    
          {message ?
            <p className="text-white">{message} Please approve the transaction using your wallet</p> :
            <p className="text-white">Creating transaction...</p>
          }
          
        </div>
      )
}