import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import base58 from 'bs58'
import { useEffect, useMemo, useRef } from "react";

// This is your token/coupon address
const couponAddress = new PublicKey('5gzkv3N2HR3BhummsV1DB5LYDwyHjaseQpNYQAGTuyRQ')
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
    // We pass the selected items in the query, calculate the expected cost
    const amount = 15 //get amount from candymachine state
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
    const account  = "CteftmQggr8XxKKfDRFLiyW6yVtdiNgqpvHKdwoC1KVD" // const {account} = req.body as TransactionInputData
    if (!account) {
      res.status(40).json({ error: "No account provided" })
      return
    }

    // We get the shop private key from .env - this is the same as in our script
    const shopPrivateKey = "2NgbyLntQ9VicGkjSVxubrXLgmjF9HBncfHJeN97pVJWfUKcaTE1YFhN7dqqeed8MBt55ZHwv4kMMd5FmDABxKM1" //process.env.SHOP_PRIVATE_KEY as string
    if (!shopPrivateKey) {
      res.status(500).json({ error: "Shop private key not available" })
    }
    const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopKeypair.publicKey

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    // Get the buyer and seller coupon token accounts
    // Buyer one may not exist, so we create it (which costs SOL) as the shop account if it doesn't 
    /* const buyerCouponAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      couponAddress, // which token the account is for
      buyerPublicKey, // who the token account belongs to (the buyer)
    ) */

    //const shopCouponAddress = await getAssociatedTokenAddress(couponAddress, shopPublicKey)

    // Get details about the USDC token
    const usdcMint = await getMint(connection, usdcAddress)
    // Get the buyer's USDC token account address
    const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey)
    // Get the shop's USDC token account address
    const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey)

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
      amountToPay * (10 ** usdcMint.decimals), // amount to transfer (in units of the USDC token)
      usdcMint.decimals, // decimals of the USDC token
    )

    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    // Create the instruction to send the NFT from the shop to the buyer
    

    // Add both instructions to the transaction
    transaction.add(transferInstruction)

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