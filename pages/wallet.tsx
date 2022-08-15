/* eslint-disable */

import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintMultipleToken
} from "../utils";
import BigNumber from 'bignumber.js';
import { FindReferenceError, findReference, validateTransfer } from "@solana/pay"; 
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TransactionInputData, TransactionOutputData } from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { sendTransactions } from "../utils/candyMachine.helpers";
import { sleep } from "../utils";
import { useRouter } from "next/router";
import * as nacl from "tweetnacl";
//import { getParsedNftAccountsByOwner,isValidSolanaAddress, createConnectionConfig} from "@nfteyez/sol-rayz";
import {
    resolveToWalletAddress,
    getParsedNftAccountsByOwner,
  } from "@nfteyez/sol-rayz";

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const anchorConnection = new anchor.web3.Connection(rpcHost);

const NFTOwner ="CteftmQggr8XxKKfDRFLiyW6yVtdiNgqpvHKdwoC1KVD"//"CvWEiBstU7Nc5FM9W8nTC6C5xawm9Y8UMP2rHWZD2bnA" //"2uYfuk12qZchgdCvSfv5ar9XH9TZ3qUDnqJzX6pQuMPt"


export default function wallet(){
    console.log("in wallet");
    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    //const [NFTamount, setNFTamount] = useState<number>(0);
    //const [shop, setShop] = useState<string>("");
    let NFTamount = 0;
    //const [balanceBeforeTransaction, setbalanceBeforeTransaction] = useState<number>(0);
    //const [balanceAfterTransaction, setbalanceAfterTransaction] = useState<number>(0);
    let balanceBeforeTransaction = useState<number>(0);
    let nftNumberBeforeTransaction = useState<number>(0);
    let balanceAfterTransaction = 0
    let nftNumbersfterTransaction : number = 0
    let shop = "";
    // State to hold API response fields
    const [message, setMessage] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    /* const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [serializedTransaction, setSerializedTransaction] = useState<any | null>(null);
    const [mintPublicKey, setMintPublic] = useState<any | null>(null);
    const [mintSignature, setMintSignature] = useState<Uint8Array>();  */
    //const transaction = useState<Transaction | null>(null);
    //const message = useState<string | null>(null);
    const serializedTransaction = useState<Buffer>();
    const mintPublicKey = useState<Uint8Array>();
    const mintSignature = useState<Uint8Array>(); 
    const verifyMintSignatureResult = useState<boolean | null>(null);
    const wallet = useWallet();
    //console.log(`amount: ${NFTamount}, message: ${message}, bbt: ${balanceBeforeTransaction}, bat: ${balanceAfterTransaction}, `)

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
            const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } = data
            const candyprice = candyMachine.state.data.price
            NFTamount= candyprice/LAMPORTS_PER_SOL
            shop= candyMachine.state.wallet
            //console.log(`Price: ${NFTprice}, treasury: ${treasury}`)
            searchParams.toString().includes("amount") ? "" : searchParams.append('amount', NFTamount.toString())
            searchParams.toString().includes("shop") ? "" : searchParams.append('shop', shop.toString())

            const response = await fetch(`/api/transaction?${searchParams.toString()}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            })

            const json = await response.json() as TransactionOutputData

            if (response.status !== 200) {
                console.error(json);
                return;
            }

            // Deserialize the transaction from the response
            const deserializedTransaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
            setTransaction(deserializedTransaction);
            //setSigners(json.signers);
            setMessage(json.message);
            mintPublicKey[0] = json.mintPublicKey;
            serializedTransaction[0] = Buffer.from(json.transaction, 'base64');
            mintSignature[0] = json.mintSignature;
            verifyMintSignatureResult[0] = json.verifyMintSignatureResult
            
        }
        let bbt = (await connection.getBalance(anchorWallet.publicKey)) / LAMPORTS_PER_SOL
        balanceBeforeTransaction[0] = bbt; 
        //console.log(transaction);
        const nftArray = await getParsedNftAccountsByOwner({
            publicAddress: NFTOwner,
            connection: connection
        });
        console.log(nftArray)
        nftNumberBeforeTransaction[0] = nftArray.length; 
        console.log(`NFT number before Transaction : ${nftArray.length}`);
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
            //console.log(` Before: ${balanceBeforeTransaction}, mpk: ${mintPublicKey}, sign: ${mintSignature}`);
            //console.log(` After: ${balanceAfterTransaction}`);
            let cost = balanceBeforeTransaction[0] - balanceAfterTransaction
            console.log(` Amount Paid: ${cost}`);
            const nftArray2 = await getParsedNftAccountsByOwner({
                publicAddress: NFTOwner,
                connection: connection
            });
            let nftNumbersfterTransaction: number = nftArray2.length;
            console.log(`NFT After Transaction: ${nftNumbersfterTransaction}`);
            let numberOfNFTAdded: number = nftNumbersfterTransaction - nftNumberBeforeTransaction[0] 
            const amount: BigNumber = new BigNumber(NFTamount)
            console.log(` Number of NFT Added: ${numberOfNFTAdded}`);
            await validateTransfer(
                connection,
                signatureInfo.signature,
                {
                  recipient: new PublicKey(shop),
                  amount
                },
                { commitment: 'confirmed' }
              )
            //console.log(`verify Mint Account signature: ${verifyMintSignatureResult[0]}`);
            router.push({pathname: '/confirmed',
                        query: { from: "Wallet", NFTAdded: `${numberOfNFTAdded}`, token: "SOL" , amount: cost.toFixed(3), sign: `${mintSignature[0]}`, verify: `${verifyMintSignatureResult[0]}` }})
            //router.push('/confirmed')
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