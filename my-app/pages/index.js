import {Contract, providers, utils} from "ethers"
import React, {useEffect, useState, useRef} from "react"
import Web3Modal from "web3modal"
import {abi, NFT_CONTRACT_ADDRESS} from "../../constants"
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { ethers } from "ethers"

export default function Home() {
    const [walletConnected, setWalletConnected] = useState(false);
    const [presaleStarted, setPresaleStarted] = useState(false);
    const [presaleEnded, setPresaleEnded] = useState(false);
    const [loading, setloading] = useState(false);
    const [isOwner, setisOwner] = useState(false);
    const [tokenIdsMinted, settokenIdsMinted] = useState("0");
    const web3modalRef = useRef();

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3modalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);
        const {chainId } = await web3Provider.getNetwork();
        if(chainId != 4){
          window.alert("change the network to rinkeby");
          throw new Error("change the network to rinkeby");
        } 
        if(needSigner){
          const signer = web3Provider.getSigner();
          return signer;
        }
         return web3Provider;
      
    }

    const presaleMint = async () => {
      try{

        const signer = getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.presaleMint({value: utils.parseEther("0.01")});
      setloading(true);
      
      await tx.wait();
      setloading(false);
      window.alert("You successfully minted a cryptoDev");
    } catch(err){
      console.error(err);
    }
    }

    const publicMint = async () => {
      try{

        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.mint({value: utils.parseEther("0.01")});
      setloading(true);
      
      await tx.wait();
      setloading(false);
      window.alert("You successfully minted a cryptoDev");
    } catch(err){
      console.error(err);
    }}

    const connectWallet = async () => {
      try{
        await getProviderOrSigner();
        setWalletConnected(true);
      }
      catch(err){
        console.error(err);
      }
    }

    const startPresale = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
        const tx = await nftContract.startPresale();
        setloading(true);
        await tx.wait();
        setloading(false);
        await checkIfPresaleStarted();
      } catch(err) {
        console.error(err);
      }
    }

    const checkIfPresaleStarted = async () =>{
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        const _presaleStarted = await nftContract.presaleStarted();
        if(!_presaleStarted){
          await getOwner();
        }
        setPresaleStarted(_presaleStarted);
        return _presaleStarted;
      } catch(err){
        console.error(err);
        return false;
      }
    }

    const checkIfPresaleEnded = async () => {
      try{
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        const hasEnded = await nftContract.presaleEnded();
        if(hasEnded){
          setPresaleEnded(true);
        } else{ 
          setPresaleEnded(false);
        }
        return hasEnded;
      } catch(err) {
        console.error(err);
        return false;
      }
    }
    const getOwner = async () => {
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        const owner = await nftContract.owner();
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        if(address.toLowerCase() === owner.toLowerCase()){
          setisOwner(true);

        }

      } catch(err){
        console.error(err.message);
      }
      
    }

    const getTokenIdsMinted = async () => {
      try {
        const provider = await getProviderOrSigner();

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        const _tokenIds = await nftContract.tokenIds();
        settokenIdsMinted(_tokenIds.toString());

      } catch(err){
        console.error(err);
      }
    }

    useEffect(() => {
      if(!walletConnected){
        web3modalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false
        });
        connectWallet();

        const _presaleStarted = checkIfPresaleStarted();
        if(_presaleStarted){
          checkIfPresaleEnded();
        }

        getTokenIdsMinted();

        const presaleEndedInternal = setInterval(async function () {
          const _presaleStarted = await checkIfPresaleStarted();
          if(_presaleStarted){
            const _presaleEnded = await checkIfPresaleEnded();
            if(_presaleEnded) {
              clearInterval(presaleEndedInternal);
            }
          }
        }, 5* 1000);

        setInterval(async function (){
          await getTokenIdsMinted();
        }, 5* 1000);

      }
    }, [walletConnected]);

    const renderButton = () => {
      if(!walletConnected){
        return (
          <button onClick={connectWallet} className={styles.button}>
            Connect Your Wallet
          </button>
        )
      }

      if(loading){
        return <button className={styles.button}>Loading...</button>
      }

      if(isOwner && !presaleStarted){
        return(
          <button className={styles.button} onClick={startPresale}>
            Start Presale!
          </button>
        )
      }

      if(!presaleStarted){
        return(
          <div>
            <div className={styles.description}> Presale has not started yet!</div>
          </div>
        )
      }

      if(presaleStarted && !presaleEnded){
        return(
          <div>
            <div className={styles.description}>
              Presale has started!!! If your address is whitelisted, Mint a CryptoDev 🥳
            </div>
            <button className={styles.button} onClick={presaleMint}> Presale Mint 🚀 </button>
          </div>
        )
      }

      if(presaleStarted && presaleEnded){
        return(
          <button className={styles.button} onClick={publicMint}>
             Public Mint 🚀
          </button>
        )
      }
    }
    return(
      <div>
        <Head>
          <title>Crypto Devs</title>
          <meta name="description" content="Whitelist-Dapp"/>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}> Welcome to Crypto Devs!</h1>
            <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
            </div>
            <div className={styles.description}>
              {tokenIdsMinted}/20 have been minted
            </div>
            {renderButton()}
          </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
        </div>
        
        <footer className={styles.footer}>
          Made with &#10084; by Crypto Devs
        </footer>
      </div>
    )

}
