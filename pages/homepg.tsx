import * as anchor from "@project-serum/anchor";

import { CandyMachine, getCandyMachineState } from "../utils";
import React, {useEffect, useState} from "react";

import Modal from "../components/modal";
import NtfData  from "./nft"
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from "@solana/wallet-adapter-react";

const candyMachineId = new anchor.web3.PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
);

export default function Homepg() {
  const [showpo, setShowpo] = useState(false);
  const wallet = useWallet();
  const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
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
        const { candyMachine } = data
        setCandyMachine(candyMachine)
        console.log({candyMachine})
            })
    }catch(err){
      console.log(err)
    }
  },[wallet, candyMachineId, connection,])

  return (
    <div className="flex w-full justify-center items-center">
      <div className="flex mf:flex-row flex-col items-start justify-between md:p-20 py-12 px-4">
        <div className="flex flex-1 justify-start items-start flex-col mf:mr-10">
          <h1 className="text-3xl sm:text-5xl text-white text-gradient py-1">
            SolPay Mint
          </h1>
          <p className="text-left mt-5 text-white font-light w-full text-base">
            Mint and Validate NFTs using Solana Pay! 
          </p>
        </div>
      </div>
      {<NtfData/>}
      <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="basis-1/4">
            <WalletMultiButton className='!bg-gray-500 hover:scale-105' />
          </div>
          <button onClick={()=> setShowpo(true)} className="solana-pay-btn solana-pay-btn-light solana-pay-btn-medium solana-pay-btn-radius-medium">
            Buy with <svg width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M53.7996 15.3534L50.3357 7.78491H47.4607L52.4091 17.997L52.32 18.3045C52.1961 18.7132 51.9345 19.0662 51.5798 19.3032C51.2252 19.5402 50.7995 19.6465 50.3753 19.6039C49.8788 19.5993 49.3917 19.4679 48.9601 19.222L48.4999 21.4093C49.164 21.6836 49.8747 21.8267 50.5931 21.8308C52.5724 21.8308 53.7699 21.1017 54.7596 18.9542L60 7.78491H57.2239L53.7996 15.3534Z" fill="black"></path><path d="M29.3187 4.1792H21.0153V18.0912H23.7369V12.9777H29.3187C32.3521 12.9777 34.3463 11.4452 34.3463 8.57847C34.3463 5.71175 32.3521 4.1792 29.3187 4.1792ZM29.1702 10.5425H23.727V6.57474H29.1702C30.7438 6.57474 31.6445 7.2939 31.6445 8.55863C31.6445 9.82336 30.7438 10.5425 29.1702 10.5425Z" fill="black"></path><path d="M45.7249 15.4527V11.2617C45.7249 8.78188 43.9484 7.49731 40.9002 7.49731C38.426 7.49731 36.2586 8.65293 35.6499 10.4285L37.8866 11.2221C38.2182 10.3343 39.3712 9.67959 40.8062 9.67959C42.5084 9.67959 43.226 10.3739 43.226 11.2221V11.4948L39.1782 11.9412C36.8475 12.1892 35.3134 13.2357 35.3134 15.1055C35.3134 17.1539 37.0701 18.2549 39.4008 18.2549C40.9031 18.3019 42.3661 17.7693 43.4882 16.767C43.894 17.759 44.3097 18.4236 47.0758 18.0714V15.9983C45.9674 16.2661 45.7249 15.9983 45.7249 15.4527ZM43.2507 14.1235C43.2507 15.4725 41.3654 16.1867 39.7868 16.1867C38.5844 16.1867 37.8619 15.7999 37.8619 15.0311C37.8619 14.2624 38.4557 13.9846 39.6037 13.8507L43.2606 13.4242L43.2507 14.1235Z" fill="black"></path><path d="M15.8678 14.8277C15.8871 14.8856 15.8871 14.9483 15.8678 15.0062C15.8566 15.064 15.8292 15.1174 15.7886 15.16L13.1709 17.9126C13.1132 17.9721 13.0442 18.0193 12.968 18.0515C12.8916 18.0851 12.809 18.102 12.7256 18.1011H0.309983C0.252484 18.1016 0.195969 18.0862 0.146685 18.0565C0.0974336 18.0229 0.0581183 17.9766 0.0328714 17.9226C0.015435 17.8677 0.015435 17.8088 0.0328714 17.7539C0.0431328 17.6968 0.0688042 17.6437 0.107097 17.6002L2.72976 14.8475C2.78744 14.7881 2.85643 14.7409 2.93264 14.7087C3.00891 14.6747 3.09166 14.6577 3.17512 14.6591H15.5709C15.6307 14.6579 15.6895 14.6752 15.7391 14.7087C15.7948 14.7317 15.8405 14.7739 15.8678 14.8277ZM13.1759 9.60015C13.1169 9.54228 13.0482 9.49527 12.973 9.46128C12.8958 9.43008 12.8137 9.41328 12.7305 9.41168H0.309983C0.251765 9.41254 0.194951 9.42972 0.145975 9.46127C0.0969987 9.49283 0.057818 9.5375 0.0328714 9.59023C0.0157557 9.64513 0.0157557 9.70396 0.0328714 9.75886C0.0412052 9.81656 0.0671307 9.87026 0.107097 9.91261L2.72976 12.6702C2.78873 12.7281 2.8574 12.7751 2.93264 12.8091C3.00965 12.8407 3.0919 12.8575 3.17512 12.8587H15.5709C15.6307 12.8598 15.6895 12.8425 15.7391 12.8091C15.7891 12.7799 15.8275 12.7344 15.848 12.6801C15.8734 12.6274 15.8818 12.568 15.872 12.5103C15.8623 12.4525 15.8349 12.3992 15.7936 12.3578L13.1759 9.60015ZM0.146685 7.56667C0.195969 7.59636 0.252484 7.6118 0.309983 7.6113H12.7305C12.8139 7.61217 12.8966 7.59527 12.973 7.56171C13.0492 7.52948 13.1182 7.48226 13.1759 7.42284L15.7936 4.67019C15.8341 4.6276 15.8616 4.57423 15.8728 4.51644C15.8899 4.46154 15.8899 4.40271 15.8728 4.34781C15.8523 4.29359 15.8139 4.24807 15.7639 4.21886C15.7142 4.18544 15.6555 4.16812 15.5956 4.16926H3.15532C3.07186 4.16793 2.98912 4.18485 2.91285 4.21886C2.83664 4.25109 2.76765 4.29831 2.70997 4.35773L0.0922528 7.12029C0.0507444 7.16218 0.0231013 7.21586 0.0130773 7.27404C-0.00435908 7.3289 -0.00435908 7.38782 0.0130773 7.44267C0.0451946 7.49569 0.0914761 7.53864 0.146685 7.56667Z" fill="url(#paint0_linear_302_823)"></path><defs><linearGradient id="paint0_linear_302_823" x1="1.34093" y1="18.4332" x2="14.0922" y2="3.77438" gradientUnits="userSpaceOnUse"><stop offset="0.08" stopColor="#9945FF"></stop><stop offset="0.3" stopColor="#8752F3"></stop><stop offset="0.5" stopColor="#5497D5"></stop><stop offset="0.6" stopColor="#43B4CA"></stop><stop offset="0.72" stopColor="#28E0B9"></stop><stop offset="0.97" stopColor="#19FB9B"></stop></linearGradient></defs></svg>
          </button>
        </div>
        <Modal showpo={showpo} />
      </div>
    </div>
  );
};