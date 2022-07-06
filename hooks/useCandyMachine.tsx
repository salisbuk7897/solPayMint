import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintMultipleToken
} from "../utils";
import { useEffect, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { sleep } from "../utils";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletBalance from "./useWalletBalance";

const txTimeout = 50000;
const MINT_PRICE_SOL = 1;

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

export default function useCandyMachine() {
    const wallet = useWallet();
    const [isMinting, setIsMinting] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [mintStartDate, setMintStartDate] = useState(
        new Date(parseInt(process.env.NEXT_PUBLIC_CANDY_START_DATE!, 10))
    );
    const [, setBalance] = useWalletBalance();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();
    const [nftsData, setNftsData] = useState<any>(
        ({} = {
            itemsRemaining: 0,
            itemsRedeemed: 0,
            itemsAvailable: 0,
        } as any)
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
            console.log({itemsRemaining})
            setIsSoldOut(itemsRemaining === 0);
            setMintStartDate(goLiveDate);
            setCandyMachine(candyMachine);
        })();
    }, [wallet, candyMachineId, connection]);


    useEffect(() => {
        (async () => {
            if (!isMinting) {
                const anchorWallet = {
                    publicKey: wallet.publicKey,
                    signAllTransactions: wallet.signAllTransactions,
                    signTransaction: wallet.signTransaction,
                } as anchor.Wallet;

                const { itemsRemaining, itemsRedeemed, itemsAvailable } =
                    await getCandyMachineState(
                        anchorWallet,
                        candyMachineId,
                        connection
                    );

                setNftsData({ itemsRemaining, itemsRedeemed, itemsAvailable });
            }
        })();
    }, [wallet, candyMachineId, connection, isMinting]);


    const startMintMultiple = async (quantity: number) => {
        try {
            setIsMinting(true);
            if (wallet.connected && candyMachine?.program && wallet.publicKey) {
                const oldBalance =
                    (await connection.getBalance(wallet?.publicKey)) /
                    LAMPORTS_PER_SOL;
                const futureBalance = oldBalance - MINT_PRICE_SOL * quantity;

                const signedTransactions: any = await mintMultipleToken(
                    candyMachine,
                    wallet.publicKey,
                    quantity
                );

                const promiseArray = [];

                for (
                    let index = 0;
                    index < signedTransactions.length;
                    index++
                ) {
                    const tx = signedTransactions[index];
                    promiseArray.push(
                        awaitTransactionSignatureConfirmation(
                            tx,
                            txTimeout,
                            connection,
                            "singleGossip",
                            true
                        )
                    );
                }

                const allTransactionsResult = await Promise.all(promiseArray);
                let totalSuccess = 0;
                let totalFailure = 0;

                for (
                    let index = 0;
                    index < allTransactionsResult.length;
                    index++
                ) {
                    const transactionStatus = allTransactionsResult[index];
                    if (!transactionStatus?.err) {
                        totalSuccess += 1;
                    } else {
                        totalFailure += 1;
                    }
                }

                let newBalance =
                    (await connection.getBalance(wallet?.publicKey)) /
                    LAMPORTS_PER_SOL;

                while (newBalance > futureBalance) {
                    await sleep(1000);
                    newBalance =
                        (await connection.getBalance(wallet?.publicKey)) /
                        LAMPORTS_PER_SOL;
                }

                if (totalSuccess) {
                    toast.success(
                        `Congratulations! ${totalSuccess} mints succeeded! Your NFT's should appear in your wallet soon :)`,
                        { duration: 6000, position: "bottom-center" }
                    );
                }

                if (totalFailure) {
                    toast.error(
                        `Some mints failed! ${totalFailure} mints failed! Check your wallet :(`,
                        { duration: 6000, position: "bottom-center" }
                    );
                }
            }
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
                    setIsSoldOut(true);
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }
            toast.error(message);
        } finally {
            if (wallet?.publicKey) {
                const balance = await connection.getBalance(wallet?.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
            setIsMinting(false);
        }
    };

    return {
        isSoldOut,
        mintStartDate,
        isMinting,
        nftsData,
        startMintMultiple,
        candyMachine
    };
}