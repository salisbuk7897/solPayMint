import { AnchorProvider, Program, Wallet, web3 } from "@project-serum/anchor";

export interface CandyMachine {
    id: web3.PublicKey;
    connection: web3.Connection;
    program: Program;
}

interface CandyMachineState {
    candyMachine: CandyMachine;
    itemsAvailable: number;
    itemsRedeemed: number;
    itemsRemaining: number;
    goLiveDate: Date;
}


export const CANDY_MACHINE_PROGRAM = new web3.PublicKey(
    "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
);


export const getCandyMachineState = async (
    anchorWallet: Wallet,
    candyMachineId: web3.PublicKey,
    connection: web3.Connection
): Promise<CandyMachineState> => {
    const provider = new AnchorProvider(connection, anchorWallet, {
        preflightCommitment: "processed",
    });

    const idl = await Program.fetchIdl(CANDY_MACHINE_PROGRAM, provider);

    if (idl) {
        const program = new Program(
            idl,
            CANDY_MACHINE_PROGRAM,
            provider
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
    } else {
        throw new Error(
            `Fetching idl returned null: check CANDY_MACHINE_PROGRAM`
        );
    }
};

