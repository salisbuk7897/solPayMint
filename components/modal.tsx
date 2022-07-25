import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { TransactionInputData, TransactionOutputData } from "../pages/api/transaction";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { findReference, FindReferenceError } from "@solana/pay";

export default function Modal({showpo}: any){
    const router = useRouter()
    if(!showpo){
        return null;
    }
    return(
        <div className="flex flex-col items-center justify-end mt-5 eth-card w-2/5 border-solid border-2 border-indigo-600 rounded-lg">
            <div className="underline decoration-double text-xl font-bold">
                <h3>Select Payment Method</h3>
            </div>
            <div className="w-full flex justify-center items-center m-2">
                <button onClick={()=> router.push('/wallet')} className="solana-pay-btn-light items-center rounded-lg w-3/5 font-bold">
                    Wallet
                </button>
            </div>
            <div>
                <p className="font-bold">OR</p>
            </div>
            <div className="w-full flex justify-center items-center m-2">
                <button onClick={()=> router.push('/qrcode')} className="solana-pay-btn-light items-center rounded-lg w-3/5 font-bold">
                    QR Code
                </button>
            </div>
        </div>
    );
}