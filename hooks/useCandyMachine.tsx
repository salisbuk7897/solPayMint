import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
} from "../utils";
import { useEffect, useState } from "react";

import { sleep } from "../utils";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletBalance from "./useWalletBalance";

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

export default function useCandyMachine() {
    const [, setCandyMachine] = useState<CandyMachine>();
    const wallet = useWallet();
    const [, setIsSoldOut] = useState(false);
    const [, setMintStartDate] = useState(
        new Date(parseInt(process.env.NEXT_PUBLIC_CANDY_START_DATE!, 10))
    );

    useEffect(() => {
        (async () => {
            if (
                !wallet ||
                !wallet.publicKey ||
                !wallet.signAllTransactions ||
                !wallet.signTransaction
            ) {
                return;
            }

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

            setIsSoldOut(itemsRemaining === 0);
            setMintStartDate(goLiveDate);
            setCandyMachine(candyMachine);
        })();
    }, [wallet, candyMachineId, connection]);
}