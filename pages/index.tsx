import { useEffect, useState } from 'react';

import Homepg from './homepg'
import type { NextPage } from 'next'
import useCandyMachine from "../hooks/useCandyMachine";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletBalance from "../hooks/useWalletBalance";

const Home: NextPage = () => {
  const [balance, setBalance] = useWalletBalance();
  const {
    isSoldOut,
    mintStartDate,
    isMinting,
    startMintMultiple,
    nftsData,
    candyMachine
  } = useCandyMachine();

  const wallet = useWallet();
  

  useEffect(() => {
    if (new Date(mintStartDate).getTime() < Date.now()) {
      console.log({
        isSoldOut,
        mintStartDate,
        isMinting,
        nftsData
      })
    }
    startMintMultiple(2);
  }, [candyMachine]);
  
  return (
    <div className="mt-0 h-screen gradient-bg-welcome">;
        <Homepg /> 
    </div>
    
  )
}

export default Home
