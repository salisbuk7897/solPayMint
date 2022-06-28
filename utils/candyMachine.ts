import * as anchor from "@project-serum/anchor";

import { CandyMachine, CandyMachineState } from "./candyMachine.model"
import { Connection, PublicKey } from '@solana/web3.js';

export const CANDY_MACHINE_PROGRAM = new PublicKey(
    "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
);

export const getCandyMachineState = async (
    anchorWallet: anchor.Wallet,
    candyMachineId: anchor.web3.PublicKey,
    connection: anchor.web3.Connection
): Promise<CandyMachineState> => {
    const anchorProvider = new anchor.AnchorProvider(connection, anchorWallet, {
        preflightCommitment: "recent",
    });

    const idl = await anchor.Program.fetchIdl(CANDY_MACHINE_PROGRAM, anchorProvider) as anchor.Idl;


    const program = new anchor.Program(
        idl,
        CANDY_MACHINE_PROGRAM,
        anchorProvider
    );

    const candyMachine = {
        id: candyMachineId,
        connection,
        program,
    };

    const state: any = await program.account.candyMachine.fetch(
        candyMachineId
    );

    const itemsAvailable = state.data.itemsAvailable.toNumber();
    const itemsRedeemed = state.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;

    let goLiveDate = state.data.goLiveDate.toNumber();
    goLiveDate = new Date(goLiveDate * 1000);

    return {
        candyMachine,
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveDate,
    };
};

export const awaitTransactionSignatureConfirmation = async (
    txid: anchor.web3.TransactionSignature,
    timeout: number,
    connection: anchor.web3.Connection,
    commitment: anchor.web3.Commitment = "recent",
    queryStatus = false
): Promise<anchor.web3.SignatureStatus | null | void> => {
    let done = false;
    let status: anchor.web3.SignatureStatus | null | void = {
        slot: 0,
        confirmations: 0,
        err: null,
    };
    let subId = 0;
    status = await new Promise(async (resolve, reject) => {
        setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            console.log("Rejecting for timeout...");
            reject({ timeout: true });
        }, timeout);
        try {
            subId = connection.onSignature(
                txid,
                (result: any, context: any) => {
                    done = true;
                    status = {
                        err: result.err,
                        slot: context.slot,
                        confirmations: 0,
                    };
                    if (result.err) {
                        console.log("Rejected via websocket", result.err);
                        reject(status);
                    } else {
                        console.log("Resolved via websocket", result);
                        resolve(status);
                    }
                },
                commitment
            );
        } catch (e) {
            done = true;
            console.error("WS error in setup", txid, e);
        }
        while (!done && queryStatus) {
            (async () => {
                try {
                    const signatureStatuses =
                        await connection.getSignatureStatuses([txid]);
                    status = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (!status) {
                            console.log("REST null result for", txid, status);
                        } else if (status.err) {
                            console.log("REST error for", txid, status);
                            done = true;
                            reject(status.err);
                        } else if (!status.confirmations) {
                            console.log(
                                "REST no confirmations for",
                                txid,
                                status
                            );
                        } else {
                            console.log("REST confirmation for", txid, status);
                            done = true;
                            resolve(status);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        console.log("REST connection error: txid", txid, e);
                    }
                }
            })();
            await sleep(2000);
        }
    });

    //@ts-ignore
    if (connection._signatureSubscriptions[subId]) {
        connection.removeSignatureListener(subId);
    }
    done = true;
    console.log("Returning status", status);
    return status;
};

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}