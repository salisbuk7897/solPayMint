import { createQR, encodeURL, TransactionRequestURLFields } from "@solana/pay";
import React, { useEffect, useRef } from "react";

export default function Qrcode(){
    const qrRef = useRef<HTMLDivElement>(null)
    // Show the QR code
    useEffect(() => {
        // window.location is only available in the browser, so create the URL in here
        const { location } = window
        const apiUrl = `${location.protocol}//${location.host}/api/transaction` //remember to add transaction reference and buyer account as query params
        const urlParams: TransactionRequestURLFields = {
            link: new URL(apiUrl),
            label: "SolPay Mint",
            message: "Thanks for your order!",
        }
        const solanaUrl = encodeURL(urlParams)
        const qr = createQR(solanaUrl, 512, 'transparent')
        if (qrRef.current) {
            qrRef.current.innerHTML = ''
            qr.append(qrRef.current)
        }
    })

    return(
        <div className="mt-0 h-screen gradient-bg-welcome flex justify-center">
            <div className="flex w-full justify-center items-center">
                <div className="flex mf:flex-row flex-col items-start justify-between md:p-20 py-12 px-4">
                    <h1 className="text-white text-3xl"> Please Scan the QR code to mint NFT</h1>
                </div>
                <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
                    {/* div added to display the QR code */}
                    <div className="bg-white m-10" ref={qrRef} />
                </div>
            </div>
        </div>
    )
}