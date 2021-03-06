import * as anchor from "@project-serum/anchor";

import { ReactNode, createContext, useEffect, useState } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

const BalanceContext = createContext(null);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;

const connection = new anchor.web3.Connection(rpcHost);

export default function useWalletBalance() {
  const [balance, setBalance]: any = useState(0);
  const wallet = useWallet();

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        console.log({publicKey: wallet.publicKey, balance})
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, connection]);
  
  return [balance, setBalance];
}

export const WalletBalanceProvider: React.FC<{children:ReactNode}> = ({ children }) => {
  const wallet = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, connection]);

  return (
    <BalanceContext.Provider value={[balance, setBalance] as any}>
      {children}
    </BalanceContext.Provider>
  );
};
