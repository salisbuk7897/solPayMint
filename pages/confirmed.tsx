import { useRouter } from 'next/router';
import { useState } from 'react';
import BackLink from '../components/BackLink';
import Confirmed from '../components/Confirmed';
import PageHeading from '../components/PageHeading';

export default function ConfirmedPage() {
  const router = useRouter()
  const [percentage, setPercentage] = useState(0)
  const [text, setText] = useState('S')
  const {amount, sign, verify, token, from, NFTAdded} = router.query
  return (
    <div className='flex flex-col gap-8 items-center gradient-bg-welcome h-screen'>
      <BackLink href='/'>Home</BackLink>

      <PageHeading>Payment Successful. Thank you!</PageHeading>
      { from == "Wallet" ? 
        <div className="mt-0 flex justify-center">
          <div className="flex w-full justify-center items-center">
            <div className="flex mf:flex-row flex-col items-start justify-between md:p-20 py-12 px-4">
              <div className='h-80 w-80'><Confirmed /></div>
            </div>
            <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
              <div className="w-full justify-center">
                <ul className="text-left mt-5 text-lg text-white font-light w-full text-base w-full">
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Amount Paid: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{amount} {token}</span>
                        </p> 
                  </li>
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Paid Using: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{from}</span>
                        </p> 
                  </li>
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Mint Signature Verification: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{verify == "true" ? "Successfully Verified" : "Verification Failed"}</span>
                        </p> 
                  </li>
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Number of NFT Added: </span>
                          {parseInt(NFTAdded as string) == 0 ? <span className='text-2xl font-bold font-sans text-red-500'>{NFTAdded}</span> :<span className='text-2xl font-bold font-sans text-green-500'>{NFTAdded}</span>}
                        </p> 
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div> 
        :
        <div className="mt-0 flex justify-center">
          <div className="flex w-full justify-center items-center">
            <div className="flex mf:flex-row flex-col items-start justify-between md:p-20 py-12 px-4">
              <div className='h-80 w-80'><Confirmed /></div>
            </div>
            <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
              <div className="w-full justify-center">
                <ul className="text-left mt-5 text-lg text-white font-light w-full text-base w-full">
                  <li> <p>
                          <span className='text-2xl italic font-serif'>Paid Using: </span>
                          <span className='text-2xl font-bold font-sans text-green-500'>{from}</span>
                        </p> 
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        }
      
    </div>
  )
}