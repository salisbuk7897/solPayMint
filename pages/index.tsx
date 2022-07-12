import Homepg from './homepg'
import type { NextPage } from 'next'
//import useCandyMachine from "../hooks/useCandyMachine";
import { useEffect } from 'react';

const Home: NextPage = () => {
  /* const {
    isSoldOut,
    mintStartDate,
    isMinting,
    startMintMultiple,
    nftsData,
    candyMachine
  } = useCandyMachine();

  useEffect(() => {
    //price and tresury can be found in the nftsData object
    if (new Date(mintStartDate).getTime() < Date.now()) {
      console.log({
        isSoldOut,
        mintStartDate,
        isMinting,
        nftsData
      })
    }
  }, [candyMachine]);
   */
  return (
    <div className="mt-0 h-screen gradient-bg-welcome">;
        <Homepg /> 
    </div>
    
  )
}

export default Home
