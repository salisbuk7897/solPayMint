/* eslint-disable react-hooks/rules-of-hooks */

import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    getCandyMachineState
} from "../utils";
import { useEffect, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
var envConfig;
try{
    envConfig = require("../config/conf.json")
}catch(e){
    envConfig = null;
}

import { useWallet } from "@solana/wallet-adapter-react";

let candyMachineId: any;
try{
    candyMachineId = new anchor.web3.PublicKey(
        process.env.NEXT_PUBLIC_CANDY_MACHINE_ID! || envConfig.candyMachineID
    );
}catch(e){
    candyMachineId = ""
}

let rpcHost: any;
let connection: any;
try{
    rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST! || envConfig.rpcHost;
    connection = new anchor.web3.Connection(rpcHost);
}catch(e){
    rpcHost = null;
    connection = null;
}


export default function NtfData():any {
    const wallet = useWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine|null>();
    const [itemsRedeemed,setItemsRedeemed]= useState(0);
    const [goLiveDate,setGoLiveDate]= useState<Date>();
    const [itemsAvailable,setItemsAvailable]= useState(0);
    const [price, setPrice]= useState(0);
    const [show, setShow]= useState("No");

    
    
    useEffect(() => {
        try{
            (async () => {
                if(candyMachineId == ""){

                }else{
                    const anchorWallet = {
                        publicKey: wallet.publicKey
                    } as anchor.Wallet;
        
                    const data =
                        await getCandyMachineState(
                            anchorWallet,
                            candyMachineId,
                            connection
                        );
                    console.log(data)
                    const { candyMachine, itemsRedeemed, itemsAvailable, goLiveDate } = data
                    const { state } = candyMachine
                    const price = state.data.price
                    setCandyMachine(candyMachine);
                    setPrice(price);
                    setItemsRedeemed(itemsRedeemed);
                    setGoLiveDate(goLiveDate);
                    setItemsAvailable(itemsAvailable);
                    setShow("Yes")
                }
            })();
        }catch(e){ 
            console.log(e)
        }
        
    }, [wallet, candyMachineId, connection]); 

  return ( candyMachine? 
  <div className="machine-container">
   <p className="text-1.5xl text-white text-gradient py-1">{`Drop Date: ${goLiveDate}`}</p>
   <p className="text-1.5xl text-white text-gradient py-1">{`Items Minted: ${itemsRedeemed} / ${itemsAvailable}`}</p>
   <p className="text-1.5xl text-white text-gradient py-1">{`Nft Price: ${price/LAMPORTS_PER_SOL} SOL`}</p>
  </div> : 
  <div className="items- center text-white font-serif text-green-500 text-2xl">
    <p>Cannot retrieve Candy Machine Data.</p>
    <p>Please Ensure Data is correct in the Config file</p>
    <p>If app has not been configured yet,</p>
    <p>Use <span className="text-red-500">/config</span> Endpoint to add data</p>
  </div>
  )
}
