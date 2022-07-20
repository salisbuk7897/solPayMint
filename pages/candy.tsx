import * as anchor from "@project-serum/anchor";

import {
    CandyMachine,
    getCandyMachineState
} from "../utils";
import { useEffect, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { sleep } from "../utils";
import { useWallet } from "@solana/wallet-adapter-react";

const candyMachineId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

export default function candy(){
    const wallet = useWallet();
    const [isMinting, setIsMinting] = useState(false); 
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [price, setPrice] = useState(0);
    const [treasury, setTreasury] = useState("");
    const [mintStartDate, setMintStartDate] = useState(
        new Date(parseInt(process.env.NEXT_PUBLIC_CANDY_START_DATE!, 10))
    );
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();
    const [nftsData, setNftsData] = useState<any>(
        ({} = {
            itemsRemaining: 0,
            itemsRedeemed: 0,
            itemsAvailable: 0,
            price: 0,
            treasury: "",
        } as any)
    );

    //console.log(`Price: ${parseInt(data.price)/LAMPORTS_PER_SOL}, treasury: ${treasury}`)
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
                const { itemsRemaining, itemsRedeemed, itemsAvailable, candyMachine } = data
                const price = candyMachine.state.data.price
                const treasury = candyMachine.state.wallet
                setPrice(price/LAMPORTS_PER_SOL);
                setTreasury(treasury);
                //console.log(`Price: ${price/LAMPORTS_PER_SOL}, treasury: ${treasury}`)
            })();
        }catch(e){ 
            console.log(e)
        }
        
    }, [wallet, candyMachineId, connection, isMinting]); 

  return (
    <div className="mt-0 h-screen">;
        <p>{price }</p>
    </div>
    
  )
}
