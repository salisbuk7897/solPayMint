import { useRouter } from "next/router";
import { useEffect, useState } from "react"
import { buildStyles, CircularProgressbar } from "react-circular-progressbar"
import 'react-circular-progressbar/dist/styles.css';

export default function Confirmed() {
  const router = useRouter()
  const [percentage, setPercentage] = useState(0)
  const [text, setText] = useState('S')
  const {amount, sign, verify, token} = router.query

  useEffect(() => {
    const t1 = setTimeout(() => setPercentage(100), 100)
    const t2 = setTimeout(() => setText('✅'), 600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div>
      <div className="w-full">
        <CircularProgressbar value={percentage} text={text} styles={
                buildStyles({
                  pathColor: '#00BA00',
                })
        } />
      </div>
      <div className="w-full">
        <ul className="text-left mt-5 text-lg text-white font-light w-full text-base w-full">
          <li> Amount Paid: {amount} {token}</li>
          <li> Mint Signature: {sign}</li>
          <li className="w-full"> Signature Verification: {verify == "true" ? "Successfully Verified" : "Verification Failed"}</li>
        </ul>
      </div>
    </div>
  )
}