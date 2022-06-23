import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Homepg from './homepg'

const Home: NextPage = () => {
  return (
    <div className="mt-0 h-screen gradient-bg-welcome"> //#58246B;
        <Homepg /> 
    </div>
    
  )
}

export default Home
