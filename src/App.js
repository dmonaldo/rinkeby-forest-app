import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/TreePortal.json";


const App = () => {
  const [isPendingTransaction, setIsPendingTransaction] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [allTrees, setAllTrees] = useState([]);
  const [message, setMessage] = useState("");
  const contractAddress = "0x9a7A04F79c402e29cf946E828c6d0098Ca5247d7";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch(err) {
      console.log(err);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllTrees();
    } catch(err) {
      console.log(err);
    }
  }

  const plant = async (message) => {
    setIsPendingTransaction(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const treePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await treePortalContract.getTotalTrees();
        console.log("Retrieved total tree count...", count.toNumber());
        const plantTxn = await treePortalContract.plant(message, { gasLimit: 300000 });
        console.log("Mining...", plantTxn.hash);

        await plantTxn.wait();
        console.log("Mined -- ", plantTxn.hash);

        // count = await treePortalContract.getTotalTrees();
        // console.log("Retrieved total tree count...", count.toNumber());
        setMessage("");
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(err) {
      console.log(err);
      alert("Transaction failed")
    }
    setIsPendingTransaction(false)
  }

  const getAllTrees = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const treePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const trees = await treePortalContract.getAllTrees();

        let treesCleaned = [];
        trees.forEach(tree => {
          treesCleaned.push({
            address: tree.planter,
            timestamp: new Date(tree.timestamp * 1000),
            message: tree.message
          });
        });

        setAllTrees(treesCleaned);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(err) {
      console.log(err);
    }
  }

  useEffect(() => {
    let treePortalContract;

    const onNewTree = (from, timestamp, message) => {
      console.log('NewTree', from, timestamp, message);
      setAllTrees(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ])
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      treePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log(treePortalContract)
      treePortalContract.on('NewTree', onNewTree);
    }

    return () => {
      if (treePortalContract) {
        treePortalContract.off('NewTree', onNewTree);
      }
    }
  }, []);

  const countTrees = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const treePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await treePortalContract.getTotalTrees();
        console.log("Retrieved total tree count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(err) {
      console.log(err);
    }
  }

  const viewAddress = (address) => {
    window.open("https://rinkeby.etherscan.io/address/"+address);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllTrees();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        Rinkeby Forest
        </div>

        <div className="bio">
          Help me build a virtual forest. Connect your wallet on the Rinkeby testnet and send a message when planting your tree. You may even win some testnet eth!
          <br/><br/>
          Built by <a href="https://dantemonaldo.com">Dante</a> using <a href="https://buildspace.so">buildspace</a>.
        </div>

        {currentAccount && (
          <div className="messageInput">
            <input type="text" placeholder="say something" defaultValue={message} onChange={event => setMessage(event.target.value)} disabled={isPendingTransaction} />
            <button onClick={() => plant(message)} disabled={isPendingTransaction}>
              Plant a Tree
            </button>
            <div className="spinnerContainer">
              {isPendingTransaction && (
                <div className="spinner"></div>
              )}
            </div>
          </div>
        )}

        {!currentAccount && (
          <div className="messageInput">
            <button onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        )}

        <div>
          {allTrees.map((tree, index) => {
            return (
              <div className="planted tooltip" key={index}>
                <button className="emoji" onClick={() => {viewAddress(tree.address)}}>🌲</button>
                <div className="tooltiptext">
                  {tree.address}<br/><br/>
                  {tree.message}<br/><br/>
                  {tree.timestamp.toString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default App
