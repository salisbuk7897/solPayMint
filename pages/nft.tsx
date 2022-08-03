/* eslint-disable react-hooks/rules-of-hooks */

import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    getCandyMachineState
} from "../utils";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

export default function NtfData():any {
    const wallet = useWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine|null>();
    const [itemsRedeemed,setItemsRedeemed]= useState(0);
    const [goLiveDate,setGoLiveDate]= useState<Date>();
    const [itemsAvailable,setItemsAvailable]= useState(0);
    const [price, setPrice]= useState(0);
    
    
    useEffect(() => {
        try{
            (async () => {
                const anchorWallet = {
                    publicKey: wallet.publicKey
                } as anchor.Wallet;
    
                const data =
                    await getCandyMachineState(
                        anchorWallet,
                        candyMachineId,
                        connection
                    );
                const { candyMachine, itemsRedeemed, itemsAvailable, goLiveDate } = data
                const { state } = candyMachine
                const price = state.data.price
                setCandyMachine(candyMachine);
                setPrice(price);
                setItemsRedeemed(itemsRedeemed);
                setGoLiveDate(goLiveDate);
                setItemsAvailable(itemsAvailable);
            })();
        }catch(e){ 
            console.log(e)
        }
        
    }, [wallet, candyMachineId, connection]); 

  return ( candyMachine && 
  <div className="machine-container">
   <p className="text-1.5xl text-white text-gradient py-1">{`Drop Date: ${goLiveDate}`}</p>
   <p className="text-1.5xl text-white text-gradient py-1">{`Items Minted: ${itemsRedeemed} / ${itemsAvailable}`}</p>
   <p className="text-1.5xl text-white text-gradient py-1">{`Nft Price: ${price/LAMPORTS_PER_SOL} SOL`}</p>
  </div>
  )
}
