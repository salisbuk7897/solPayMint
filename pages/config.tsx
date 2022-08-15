import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { sign, SignOptions } from 'jsonwebtoken';

export default function Config() {
  const { publicKey } = useWallet();
  const [hasConfig, setHasConfig] = useState('');
  const [owner, setOwner] = useState('');
  const [claimed, setClaim] = useState('');
  const [view, setView] = useState('No');
  const [accessToken, setAccessToken] = useState('');
  const [cmi, setCMI] = useState('');
  const [rpc, setRPC] = useState('');
  const [net, setNET] = useState('');
  const [cmiRead, setCMIRead] = useState('');
  const [rpcRead, setRPCRead] = useState('');
  const [netRead, setNETRead] = useState('');

  useEffect(() => {
    (async() => {
      const body = {
        action: "getconfig" 
      }
      const response = await fetch(`/api/config`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
    })

    const json = await response.json()
    if(json.message != undefined){
      setHasConfig("Yes")
      
      const config = JSON.parse(json.message)
      //console.log();
      setOwner(`${config["owner"]}`)
      setAccessToken(`${config["accesstoken"]}`)
      setCMIRead(`${config["candyMachineID"]}`)
      setNETRead(`${config["network"]}`)
      setRPCRead(`${config["rpcHost"]}`)
    }else{
      setHasConfig("No")
      //console.log("No Config")
    }
    })()
    
  })

  /* useEffect(() => {
    (async() => {
      if(accessToken != ''){
        const jwt = await generateToken()
        console.log(jwt)
      }
      
    })()
    
  }) */

  const View = async () => {
    setView("Yes");
  }

  const Edit = async () => {
    setView("No");
  }

  const onChangeCMI = (event: { target: { value: any; }; }) => {
    setCMI(event.target.value);
  };

  const onChangeRPC = (event: { target: { value: any; }; }) => {
    setRPC(event.target.value);
  };

  const onChangeNET = (event: { target: { value: any; }; }) => {
    setNET(event.target.value);
  };

  const onSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault(); // Prevent default submission
    try{
      const jwt = await generateToken()
      const body = {
        action: "updateconfig",
        cmi: cmi,
        net: net,
        rpc: rpc
      }
      const response = await fetch(`/api/config`, { 
        method: 'POST',
        headers: new Headers({
          'Authorization': `Basic ${jwt}`,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body),
      })
  
      const json = await response.json()
  
      if(json.message == "Successful"){
        alert(`Configuration Saved Successfully!`);
      }else{
        alert(`Saving Config Failed! ${json.message}`)
      }
    }catch(e){

    }
  }

  /* const onSubmitLogin = async (event: { preventDefault: () => void; }) => {
    event.preventDefault(); // Prevent default submission
    try {
      
    } catch (e) {
    }
  } */

  const onSubmitOwnership = async (event: { preventDefault: () => void; }) => {
    event.preventDefault(); // Prevent default submission
    try {
      if(!publicKey){
        alert('please Select Wallet');
      }else{
        const req = await createConfig();
        if(req.res == "Success"){
          alert(`Success. ${publicKey} is now the only wallet that can be used to login`);
          setClaim("Yes")
        }else{
          alert(`Claiming Ownership Failed!`);
        }
      }
    } catch (e) {
      alert(`Claiming Ownership Failed! ${e}`);
    }
  }

  async function createConfig(){

    const token = anchor.web3.Keypair.generate()
    const body = {
      action: "createconfig",
      owner: publicKey?.toString(),
      accesstoken: token.publicKey.toString()
    }
    const response = await fetch(`/api/config`, { 
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    })

    const json = await response.json()

    if(json.message == "Successful"){
      return{res:"Success"}
    }else{
      return{res: "failed"}
    }
    
    //console.log(`cmi: ${cmi}, rpc: ${rpc}, net: ${net}`)
  }

  async function generateToken() {
    // information to be encoded in the JWT
    const payload = {
      owner: owner
    };
    // read private key value
    const privateKey = accessToken;
  
    //console.log(`${privateKey}, ${payload}`)
  
    // generate JWT
    return sign(payload, privateKey, {expiresIn: "5m"});
  }


  return (
    <div className="mt-0 h-screen gradient-bg-welcome flex justify-center">
      <div className="flex w-full justify-center items-center">
        <div className="flex mf:flex-row flex-col items-center justify-between w-3/6 md:p-20 py-12 px-4">
          <h1 className="text-white text-3xl">
            <p>Please Connect Your Wallet</p>
          </h1>
          <div className="items-center m-4">
            <WalletMultiButton />
          </div>
          { hasConfig == "No" ? 
          <div className="items-center">
            <p className="text-white items-center">Please Select The Wallet that will be used for Login and Click Claim Ownership button to set up login credentials</p>
            </div> : 
           ""}
          {hasConfig == "No" && publicKey?<div className="items-center m-2">
            <form onSubmit={onSubmitOwnership}>
                <div className="flex items-center justify-center">
                  <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                      Claim Ownership
                  </button>
                </div>
            </form>
          </div> : <p className="text-white">Powered by Solana Pay</p>}
        </div>
        <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
          { view == "No" ? 
          <div className=" w-9/12">
            <div className="flex items-end text-white justify-end">
              <button onClick={View} className="font-bold font-sans">View Config</button>
            </div>
            <br />
            <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full" onSubmit={onSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cmi">
                      Candy Machine ID
                  </label>
                  <input onChange={onChangeCMI} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="cmi" type="text" placeholder="Candy Machine ID"></input>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rpc">
                      RPC Host
                  </label>
                  <input  onChange={onChangeRPC} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="rpc" type="text" placeholder="RPC Host"></input>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="net">
                      Network
                  </label>
                  <select onChange={onChangeNET} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="net" placeholder="Network">
                    <option value=''>Select Network</option>
                    <option value="devnet">Devnet</option>
                    <option value="testnet">Testnet</option>
                    <option value="mainnet">Mainnet Beta</option>
                  </select>
                </div>
                <div className="flex items-center justify-center">
                  <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                      Save
                  </button>
                </div>
            </form>
          </div> : <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
              <div className="w-full justify-center">
                <ul className="text-left mt-5 text-lg text-white font-light w-full text-base w-full">
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Candy Machine ID: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{cmiRead}</span>
                        </p> 
                  </li>
                  <li> <p>
                          <span className='text-2xl italic font-serif'>RPC Host: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{rpcRead}</span>
                        </p> 
                  </li>
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Network: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{netRead}</span>
                        </p> 
                  </li>
                </ul>
              </div>
              <div className="flex items-end text-white justify-end">
                <button onClick={Edit} className="font-bold font-sans">Edit Config</button>
              </div>
            </div>}
        </div>
      </div>
    </div>
  );
}
