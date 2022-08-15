import * as anchor from "@project-serum/anchor";
import * as nacl from "tweetnacl";

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from "next"
import {
  getCandyMachineState,
  mintToken
} from "../../utils";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"

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
  mintSignature: Uint8Array,
  mintPublicKey: Uint8Array,
  verifyMintSignatureResult: boolean
}

export type ErrorOutput = {
  error: string
}

export const candyMachineId = new anchor.web3.PublicKey(
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
  res: NextApiResponse<TransactionOutputData | ErrorOutput>
) {
  try {

    console.log("in transaction")
    console.log(req.query.amount)

    let amount = parseFloat(req.query.amount as string)//Object.entries(req.query)
    if (amount <= 0) {
      res.status(400).json({ error: "Can't mint with charge of 0" })
      return
    }

    const { shop } = req.query
    if (!shop) {
      res.status(400).json({ error: "No shop public key provided" })
      return
    }

    //console.log(`Price: ${amount}, shop: ${shop}`)

    // We pass the reference to use in the query
    // Unique address that we can listen for payments to
    //const reference = Keypair.generate().publicKey
    const { reference } = req.query
    if (!reference) {
      res.status(400).json({ error: "No reference provided" })
      return
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body as TransactionInputData
    if (!account) {
      res.status(400).json({ error: "No account provided" })
      return
    }

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    // Minting code
    const buyerPublicKey = new PublicKey(account)
    const dummy_key_pair = new anchor.web3.Keypair();
    const walletWrapper = new anchor.Wallet(dummy_key_pair);
    const { candyMachine, itemsRemaining } =
      await getCandyMachineState(
        walletWrapper,
        candyMachineId,
        connection
      );
    if (itemsRemaining === 0) {
      return res.status(400).json({ error: "Insufficient Nfts to mint" });
    }


    //Get minting instructions and signers
    const mintInstructions = await mintToken(candyMachine, buyerPublicKey, reference as string);

    //minting instructions
    const instructions: any = mintInstructions?.instructions;

    //transaction signers
    const signers: any = mintInstructions?.signers;

    // @ts-ignore
    //transfer request
    const transferIx = SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      toPubkey: new anchor.web3.PublicKey(shop), //wallet that receives the payment
      lamports: amount * anchor.web3.LAMPORTS_PER_SOL, //transfer amount
    })

    transferIx.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    })

    //console.log("INX", instructions);

    transaction.add(transferIx) // Payment Instructions
    transaction.add(...instructions);//console.log(instruction))//


    //const pkey = 
    const mintPublicKey = signers[0]["_keypair"]["publicKey"]
    const mintSecretKey = signers[0]["_keypair"]["secretKey"]

    transaction.partialSign(...signers);

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false
    })
    console.log({ serializedTransaction })

    const mintSignature = nacl.sign.detached(serializedTransaction, mintSecretKey);
    const verifyMintSignatureResult = nacl.sign.detached.verify(
      serializedTransaction,
      mintSignature,
      mintPublicKey // you should use the raw pubkey (32 bytes) to verify
    );

    const base64 = serializedTransaction.toString('base64')

    // Insert into database: reference, amount

    const message = "Thanks for your order!"

    // Return the serialized transaction
    return res.status(200).json({
      transaction: base64,
      message,
      mintSignature,
      mintPublicKey,
      verifyMintSignatureResult
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