//import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint, getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
//import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import base58 from 'bs58'
import { useEffect, useMemo, useRef } from "react";
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { NATIVE_MINT, createTransferCheckedInstruction, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
//import { TEN } from '@solana/pay';
import * as anchor from "@project-serum/anchor";
import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createInitializeMintInstruction, createMintToInstruction } from "@solana/spl-token";

import { CandyMachineState } from "../../utils/candyMachine.model"
import { sendTransactions } from "../../utils/candyMachine.helpers";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintMultipleToken,
    mintToken
} from "../../utils";


import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

// This is your token/coupon address
const usdcAddress = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')

export type TransactionInputData = {
  account: string,
}

type TransactionGetResponse = {
  label: string,
  icon: string,
}

export type TransactionOutputData = {
  transaction: string,
  message: string,
}

type ErrorOutput = {
  error: string
}

const candyMachineId = new anchor.web3.PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

function get(res: NextApiResponse<TransactionGetResponse>) {
  res.status(200).json({
    label: "Solpay Mint",
    icon: "https://freesvg.org/img/1370962427.png", //change icon
  })
}

async function post(
  req: NextApiRequest,
  res: any
  //res: NextApiResponse<TransactionOutputData | ErrorOutput>
) {
  try {
    
    console.log("in transaction")
    console.log(req.query.amount)
    // We pass the selected items in the query, calculate the expected cost
    let amount = parseFloat(req.query.amount as string)/10//Object.entries(req.query)
    //const { amount } = new BigNumber(req.query as string);//15 //get amount from candymachine state
    if (amount <= 0) {
      res.status(400).json({ error: "Can't mint with charge of 0" })
      return
    }

    // We pass the reference to use in the query
    // Unique address that we can listen for payments to
    //const reference = Keypair.generate().publicKey
    const { reference } = req.query
    if (!reference) {
      res.status(400).json({ error: "No reference provided" })
      return
    }

    // We pass the buyer's public key in JSON body
    const {account} = req.body as TransactionInputData
    if (!account) {
      res.status(40).json({ error: "No account provided" })
      return
    }
    //console.log(`wallet: ${account}, price: ${amount}`);

    // We get the shop private key from .env - this is the same as in our script
    
    const shopPrivateKey = process.env.NEXT_PUBLIC_SHOP_PRIVATE_KEY as string
    if (!shopPrivateKey) {
      res.status(500).json({ error: "Shop private key not available" })
    }
    const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopKeypair.publicKey

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)
    const senderInfo = await connection.getAccountInfo(buyerPublicKey);
    if (!senderInfo) throw new Error('sender not found');
    // Get the buyer and seller coupon token accounts
    // Buyer one may not exist, so we create it (which costs SOL) as the shop account if it doesn't 
    /* const buyerCouponAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      couponAddress, // which token the account is for
      buyerPublicKey, // who the token account belongs to (the buyer)
    ) */

    //const shopCouponAddress = await getAssociatedTokenAddress(couponAddress, shopPublicKey)


    // Get the buyer's USDC token account address
    const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey)
    const senderAccount = await getAccount(connection, buyerUsdcAddress);

    // Get the merchant's ATA and check that the account exists and can receive tokens
    const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey);
    const merchantAccount = await getAccount(connection, shopUsdcAddress);
    if (!merchantAccount.isInitialized) throw new Error('merchant not initialized');
    if (merchantAccount.isFrozen) throw new Error('merchant frozen');
    // Get the shop's USDC token account address
    //const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey)
    // Get details about the USDC token
    const usdcMint = await getMint(connection, usdcAddress)
    if (!usdcMint.isInitialized) throw new Error('mint not initialized');
    //amount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);
    // Check that the sender has enough tokens
    const tokens = BigInt(String(amount));
    if (tokens > senderAccount.amount) throw new Error('insufficient funds');
    // Get a recent blockhash to include in the transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    })

    // If the buyer has the coupon discount, divide the amount in USDC by 2
    const amountToPay = amount //buyerGetsCouponDiscount ? amount.dividedBy(2) : amount

    // Create the instruction to send USDC from the buyer to the shop
    const transferInstruction = createTransferCheckedInstruction(
      buyerUsdcAddress, // source
      usdcAddress, // mint (token address)
      shopUsdcAddress, // destination
      buyerPublicKey, // owner of source address
      amountToPay, // amount to transfer (in units of the USDC token)
      usdcMint.decimals, // decimals of the USDC token
    )

    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    // Minting code
    const walet = new PublicKey(account)
    const anchorWallet = {
      publicKey: walet
    } as anchor.Wallet;
    const { candyMachine, goLiveDate, itemsRemaining } =
      await getCandyMachineState(
          anchorWallet,
          candyMachineId,
          connection
      );
      const mintInstructions = await mintToken(candyMachine, walet);
    //* /console.log(mintInstructions);
    const instructions: any = mintInstructions?.instructionsMatrix;
    const signers: any = mintInstructions?.signersMatrix;
    // Create the instruction to send the NFT from the shop to the buyer
    const unsignedTxns: Transaction[] = []; 
    // Add both instructions to the transaction
    transaction.add(transferInstruction)
    //console.log(mintInstructions[0][0]);
    instructions[0].forEach((instruction: any) => transaction.add(instruction));//console.log(instruction))//
    

    /* unsignedTxns.push(transaction);
    const signedTxns = await anchorWallet.signAllTransactions(unsignedTxns); */
    // Sign the transaction as the shop, which is required to transfer the coupon
    // We must partial sign because the transfer instruction still requires the user
    //transaction.partialSign(shopKeypair)

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false
    })
    const base64 = serializedTransaction.toString('base64')

    // Insert into database: reference, amount

    const message = "Thanks for your order!"

    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message,
    }) 
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: 'error creating transaction', })
    return
  }
}

export default async function handler(
  req: NextApiRequest,
  res: any
  //res: NextApiResponse<TransactionGetResponse | TransactionOutputData | ErrorOutput>
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}