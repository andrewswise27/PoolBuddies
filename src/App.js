import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Swap from './pages/Swap';
import Pools from './pages/Pools';
import Nft from './pages/Nft';
import { useEffect, useState } from 'react';
// import { useMoralisWeb3Api } from "react-moralis";
// import Moralis from 'moralis-v1';
// import { useMoralis } from "react-moralis";
import Web3 from 'web3'


function App() {



  const [tokens, setTokens] = useState([]);



  useEffect(() => {
    fetch('https://gateway.ipfs.io/ipns/tokens.uniswap.org')
    .then(res => res.json())
    .then(data => setTokens(data.tokens))
  })


  const [userObj, setUserObj] = useState({
    isConnected: false,
    address: "",
    balance: 0.00
  });

  const detect = () => {
    let provider;
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          console.log(result[0]);
        })
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      alert("Install MetaMask")
    }
    return provider;
  }


  const onConnect = async () => {
    try {
      const currentProvider = window.web3.currentProvider;
      if (currentProvider) {
        await currentProvider.request({ method: 'eth_requestAccounts' })
        console.log("detected current provider")
        const web3 = new Web3(currentProvider);
        const userAccount = await web3.eth.getAccounts();
        const account = userAccount[0];
        let ethBalance = await web3.eth.getBalance(account);
        // console.log(ethBalance);
        handleUserSignIn(account);
        connectUser(true);
      }
    } catch (err) {
      console.log(err);
    }
  }


  const connectUser = () => {
    setUserObj((prev) => {
      return { ...prev, isConnected: true }
    })
  }

  const disconnectUser = () => {
    setUserObj((prev) => {
      return { ...prev, isConnected: false }
    })
  }

  const handleUserSignIn = (address) => {
    setUserObj((prev) => {
      return { ...prev, address: address }
    })
  }

  const handleBalanceUpdate = (balance) => {
    setUserObj((prev) => {
      return { ...prev, balance: balance }
    })
  }



  // const fetchTokenBalances = async () => {
  //   const balances = await Web3Api.account.getTokenBalances();
  //   const response = await balances[0]

  //   if (response.symbol === "MATIC") {
  //     let balance = response.balance / 10 ** response.decimals
  //     handleBalanceUpdate(balance.toFixed(2))
  //   }
  // };

  // fetchTokenBalances()





  return (
    <>
      <Navbar handleUserSignIn={handleUserSignIn} userObj={userObj} onConnect={onConnect} disconnectUser={disconnectUser} />
      <Routes>
        <Route path="/swap" element={<Swap tokens={tokens} user={userObj}/>} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/nft" element={<Nft />} />
      </Routes>

    </>
  );
}

export default App;
