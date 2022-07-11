import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { TransactionInputData, TransactionOutputData } from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { findReference, FindReferenceError } from "@solana/pay";

export default function wallet(){
    console.log("in wallet");
    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    //const { publicKey } = useWallet();

    // State to hold API response fields
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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

        const response = await fetch(`/api/transaction?${searchParams.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            //body: JSON.stringify(body),
        })

        const json = await response.json() as TransactionOutputData

        if (response.status !== 200) {
            console.error(json);
            return;
        }

        // Deserialize the transaction from the response
        const transaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
        setTransaction(transaction);
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
        try {
            // Check if there is any transaction for the reference
            const signatureInfo = await findReference(connection, reference);
            //console.log('They paid!!!')
            router.push('/confirmed')
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