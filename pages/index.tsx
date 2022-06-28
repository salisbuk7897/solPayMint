import Head from 'next/head'
import Homepg from './homepg'
import type { NextPage } from 'next'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className="mt-0 h-screen gradient-bg-welcome">;
        <Homepg /> 
    </div>
    
  )
}

export default Home
