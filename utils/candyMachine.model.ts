import { Program, web3 } from "@project-serum/anchor";

export interface CandyMachine {
    id: web3.PublicKey;
    connection: web3.Connection;
    program: Program;
    state: any
}

export interface CandyMachineState {
    /**Candy machine object containing the candy machine information */
    candyMachine: CandyMachine;
    /**nfts available to mint */
    itemsAvailable: number;
    /**nfts that have been minted */
    itemsRedeemed: number;
    /**nfts that haven't been minted  */
    itemsRemaining: number;
    /**Date minting should start */
    goLiveDate: Date;
}

export enum SequenceType {
    Sequential,
    Parallel,
    StopOnFailure,
}