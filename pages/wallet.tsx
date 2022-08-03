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
    let NFTamount = 0;
    let shop = "";
    // State to hold API response fields
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    //const [signers, setSigners] = useState([]);
    const [message, setMessage] = useState<string | null>(null);
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

        const data =
            await getCandyMachineState(
                anchorWallet,
                candyMachineId,
                anchorConnection
            );
        const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } = data
        const candyprice = candyMachine.state.data.price
        NFTamount = candyprice/LAMPORTS_PER_SOL
        shop = candyMachine.state.wallet
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
            const walletSignature = await sendTransaction(transaction, connection)
            //const signatureStatus = await connection.getSignatureStatus(walletSignature)
            //console.log(signatureStatus)
            //console.log(signatureStatus?.value)
            //let buyerSignature = nacl.sign.detached(transaction.serialize(), wallet.);
            /* let verifybuyerSignatureResult = nacl.sign.detached.verify(
                transaction.serialize(),
                walletSignature,
                publicKey
              );
              console.log(`verify Wallet Account signature: ${verifybuyerSignatureResult}`); */
            //console.log(`Wallet: ${walletSignature}`)
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