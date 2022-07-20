import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintMultipleToken
} from "../utils";
import { FindReferenceError, findReference } from "@solana/pay";
import { Keypair, Transaction } from "@solana/web3.js";
import { TransactionInputData, TransactionOutputData } from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { sendTransactions } from "../utils/candyMachine.helpers";
import { sleep } from "../utils";
import { useRouter } from "next/router";

const MINT_PRICE_SOL = 0;
const txTimeout = 50000;
const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const anchorConnection = new anchor.web3.Connection(rpcHost);


export default function wallet(){
    console.log("in wallet");
    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    // State to hold API response fields
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    //const [signers, setSigners] = useState([]);
    const [message, setMessage] = useState<string | null>(null);
    const wallet = useWallet();
    const [price, setPrice] = useState(0);
    const [treasury, setTreasury] = useState("");
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();
    /* const [mintStartDate, setMintStartDate] = useState(
        new Date(parseInt(process.env.NEXT_PUBLIC_CANDY_START_DATE!, 10))
    );
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();
    const [nftsData, setNftsData] = useState<any>(
        ({} = {
            itemsRemaining: 0,
            itemsRedeemed: 0,
            itemsAvailable: 0,
            price: 0,
            treasury: "",
        } as any)
    ); */
    /* useEffect(() => {
        try{
            (async () => {
                const anchorWallet = {
                    publicKey: wallet.publicKey
                } as anchor.Wallet;
    
                const data =
                    await getCandyMachineState(
                        anchorWallet,
                        candyMachineId,
                        anchorConnection
                    );
                const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } = data
                const price = candyMachine.state.data.price
                const treasury = candyMachine.state.wallet
                setPrice(price/LAMPORTS_PER_SOL);
                setTreasury(treasury);
                //console.log(`Price: ${price/LAMPORTS_PER_SOL}, treasury: ${treasury}`)
            })();
        }catch(e){
            console.log(e)
        }
        
    }, [wallet, candyMachineId, anchorConnection]); */

    // Read the URL query (which includes our chosen products)
    const searchParams = new URLSearchParams();
    /*for (const [key, value] of Object.entries(router.query)) {
        if (value) {
        if (Array.isArray(value)) {
            for (const v of value) {
            searchParams.append(key, v);
            }
        } else {
            searchParams.append(key, value);
        }
        }
    } */


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

        const data =
            await getCandyMachineState(
                anchorWallet,
                candyMachineId,
                anchorConnection
            );
        const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } = data
        const candyprice = candyMachine.state.data.price
        const NFTprice = candyprice
        searchParams.append('amount', NFTprice.toString())
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
        const transaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
        setTransaction(transaction);
        //setSigners(json.signers);
        setMessage(json.message);
        console.log(transaction);
    }

    useEffect(() => {
        getTransaction()
    }, [publicKey])
    
    // Send the fetched transaction to the connected wallet
    async function trySendTransaction() {
        if (!transaction) {
        return;
        }
        try {
            await sendTransaction(transaction, connection)
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
        /* try {
            // Check if there is any transaction for the reference
            const signatureInfo = await findReference(connection, reference);
            const anchorWallet = {
                publicKey: wallet.publicKey,
                signAllTransactions: wallet.signAllTransactions,
                signTransaction: wallet.signTransaction,
            } as anchor.Wallet;
              const { candyMachine, goLiveDate, itemsRemaining } =
                await getCandyMachineState(
                    anchorWallet,
                    candyMachineId,
                    connection
                );
                try {
                    if (wallet.connected && candyMachine?.program && wallet.publicKey) {
                        const oldBalance =
                            (await connection.getBalance(wallet?.publicKey)) /
                            LAMPORTS_PER_SOL;
                        const futureBalance = oldBalance - MINT_PRICE_SOL * 1;
        
                        const signedTransactions: any = await mintMultipleToken(
                            candyMachine,
                            wallet.publicKey,
                            1
                        );
        
                        
                    }
                    console.log("DONE")
                } catch (error: any) {
                    let message = error.message || "Minting failed! Please try again!";
                    if (!error.message) {
                        if (error.message.indexOf("0x138")) {
                        } else if (error.message.indexOf("0x137")) {
                            message = `SOLD OUT!`;
                        } else if (error.message.indexOf("0x135")) {
                            message = `Insufficient funds to mint. Please fund your wallet.`;
                        }
                    } else {
                        if (error.code === 311) {
                            message = `SOLD OUT!`;
                        } else if (error.code === 312) {
                            message = `Minting period hasn't started yet.`;
                        }
                    }
                } finally {
                    
                }
            //console.log('They paid!!!')
            router.push('/confirmed')
        } catch (e) {
            if (e instanceof FindReferenceError) {
            // No transaction found yet, ignore this error
            return;
            }
            console.error('Unknown error', e)
        } */
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