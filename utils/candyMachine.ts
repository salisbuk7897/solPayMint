import * as anchor from "@project-serum/anchor";

import { CandyMachine, CandyMachineState } from "./candyMachine.model"

import next from "next";

export const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
    "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
);

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new anchor.web3.PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// const rpcHost = "https://explorer-api.devnet.solana.com";
// export const connection = new anchor.web3.Connection(rpcHost);
// export const candyMachineId: anchor.web3.PublicKey = "GbezJRdDXJzknoZipBQZsJqBvauqD3xNS7bPn75ivPbD" as any

export const getCandyMachineState = async (
    anchorWallet: anchor.Wallet,
    candyMachineId: anchor.web3.PublicKey,
    connection: anchor.web3.Connection
): Promise<CandyMachineState | undefined> => {
    try {
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
            "GbezJRdDXJzknoZipBQZsJqBvauqD3xNS7bPn75ivPbD"
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

    } catch (err) {
        console.log(err)
    }


};