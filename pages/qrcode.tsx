import * as anchor from "@project-serum/anchor";

import { createQR, encodeURL, TransactionRequestURLFields } from "@solana/pay";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintMultipleToken,
  candyAnchorWallet,
} from "../utils";
import BigNumber from "bignumber.js";
import {
  FindReferenceError,
  findReference,
  validateTransfer,
} from "@solana/pay";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  TransactionInputData,
  TransactionOutputData,
} from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState, useRef } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { clusterApiUrl, Connection } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useRouter } from "next/router";

const candyMachineId = new anchor.web3.PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const anchorConnection = new anchor.web3.Connection(rpcHost);
const dummy_key_pair = Keypair.generate();
const wallet = dummy_key_pair.publicKey;

export default function Qrcode() {
  console.log("in qr");
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  let NFTamount = 0;
  let shop = "";
  // Read the URL query (which includes our chosen products)
  const searchParams = new URLSearchParams();

  // Generate the unique reference which will be used for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Add it to the params we'll pass to the API
  searchParams.append("reference", reference.toString());
  // Get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);

  
 
  // Show the QR code
  useEffect(() => {
      (async () => {
        const anchorWallet = {
          publicKey: wallet,
        } as anchor.Wallet;
        console.log("wallet")
        const data = await getCandyMachineState(
          anchorWallet,
          candyMachineId,
          anchorConnection
        );
        console.log("data")
        const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } =
        data;
        //console.log("add data")
        const candyprice = candyMachine.state.data.price;
        //console.log("cost")
        NFTamount = candyprice / LAMPORTS_PER_SOL;
        //console.log("price")
        shop = candyMachine.state.wallet;
        //console.log("shop")
        //console.log(`Price: ${NFTprice}, treasury: ${treasury}`)
        searchParams.toString().includes("amount") ? "" : searchParams.append("amount", NFTamount.toString());
        searchParams.toString().includes("shop") ? "" :searchParams.append("shop", shop.toString());
        //console.log(searchParams.toString().includes("amount"))
        // window.location is only available in the browser, so create the URL in here
        const { location } = window;
        const apiUrl = `${location.protocol}//${
          location.host
        }/api/transaction?${searchParams.toString()}`;
        console.log(apiUrl);
        const urlParams: TransactionRequestURLFields = {
          link: new URL(apiUrl),
          label: "SolPay Mint",
          message: "Thanks for your order!",
        };
        const solanaUrl = encodeURL(urlParams);
        const qr = createQR(solanaUrl, 512, "transparent");
        if (qrRef.current && NFTamount > 0) {
          qrRef.current.innerHTML = "";
          qr.append(qrRef.current);
        }
      })()
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(connection, reference);
        const amount: BigNumber = new BigNumber(NFTamount);
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient: new PublicKey(shop),
            amount,
          },
          { commitment: "confirmed" }
        );
        router.push({pathname: '/confirmed',
                        query: { from: "QR CODE" }})
        //router.push("/confirmed");
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        console.error("Unknown error", e);
      }
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-0 h-screen gradient-bg-welcome flex justify-center">
      <div className="flex w-full justify-center items-center">
        <div className="flex mf:flex-row flex-col items-start justify-between md:p-20 py-12 px-4">
          <h1 className="text-white text-3xl">
            {" "}
            Please Scan the QR code to mint NFT
          </h1>
        </div>
        <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
          {/* div added to display the QR code */}
          <div className="bg-white m-10" ref={qrRef} />
        </div>
      </div>
    </div>
  );
}
