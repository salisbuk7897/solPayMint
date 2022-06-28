import { Program, Wallet, web3 } from "@project-serum/anchor";

export interface CandyMachine {
    id: web3.PublicKey;
    connection: web3.Connection;
    program: Program;
}

export interface CandyMachineState {
    candyMachine: CandyMachine;
    itemsAvailable: number;
    itemsRedeemed: number;
    itemsRemaining: number;
    goLiveDate: Date;
}