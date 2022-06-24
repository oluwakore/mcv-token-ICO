import React, { useState, useRef, useEffect } from "react";
import { BigNumber, Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import {
  MAVERICK_NFT_CONTRACT_ABI,
  MAVERICK_NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  const zero = BigNumber.from(0);

  const [walletConnected, setWalletConnected] = useState(false);

  const [loading, setLoading] = useState(false);

  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  const [balanceOfMaverickTokens, setBalanceOfMaverickTokens] = useState(zero);

  const [tokenAmount, setTokenAmount] = useState(zero);

  const [tokensMinted, setTokensMinted] = useState(zero);

  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef();

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        MAVERICK_NFT_CONTRACT_ADDRESS,
        MAVERICK_NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;

        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }

        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  const getBalanceOfMaverickTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const balance = await tokenContract.balanceOf(address);

      setBalanceOfMaverickTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfMaverickTokens(zero);
    }
  };

  const mintMaverickToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.0005 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted Maverick Tokens");
      await getBalanceOfMaverickTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  const claimMaverickTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully claimed Maverick Tokens");
      await getBalanceOfMaverickTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _tokenMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokenMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner(), setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _owner = await tokenContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfMaverickTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading🎁...</button>
        </div>
      );
    }

    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 50} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimMaverickTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex" }}>
        <div>
          <input
            type="number"
            defaultValue="10"
            placeholder="Amount of Tokens"
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            style={{ width: "12.5rem", padding: "1.2rem" , outline: "none"}}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintMaverickToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Maverick Chain</title>
        <meta name="description" content="ICO-Dapp" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Mavericks Chain ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Maverick tokens here
          </div>
          <div className={styles.description}>
            You are to mint in multiples of 100
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfMaverickTokens)}{" "}
                Maverick Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)} / 1000000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button className={styles.button}>Connect your wallet</button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./onboard.jpg" />
        </div>
      </div>

      <footer className={styles.footer}>Made with ❤ by Bellz</footer>
    </div>
  );
}
