import * as anchor from "@project-serum/anchor";

import { CandyMachine, CandyMachineState } from "./candyMachine.model"
import { Connection, PublicKey } from '@solana/web3.js';

export const CANDY_MACHINE_PROGRAM = new PublicKey(
    "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;;
export const connection = new Connection(rpcHost)
export const candyMachineId = process.env.NEXT_CANDY_MACHINE_ID

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
