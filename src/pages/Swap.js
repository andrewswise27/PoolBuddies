import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import file from '../utils/portal';
import TokenModal from '../components/TokenModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowsUpDown } from '@fortawesome/free-solid-svg-icons';
import CoinChart from '../components/CoinChart';

const Swap = ({ tokens, user }) => {

    const qs = require('qs');
    const Web3 = require('web3');
    const BigNumber = require('bignumber.js');

    const [isHovering, setIsHovering] = useState(false);

    const handleMouseOver = () => {
        setIsHovering(true)
    }

    const handleMouseOut = () => {
        setIsHovering(false)
    }

    const handleClick = () => {
        if(tokenTo == null){
            return
        } else {
        setTokenFrom(tokenTo)
        setTokenTo(tokenFrom)}
    }

    // Swap amount 
    const [fromAmount, setFromAmount] = useState(null);
    const [toAmount, setToAmount] = useState(null);

    // Tokem Modal Open
    const [tokenOpenFrom, setTokenOpenFrom] = useState(false);
    const [tokenOpenTo, setTokenOpenTo] = useState(false);

    const handleTokenModalTo = () => {
        setTokenOpenTo(prev => !prev);
    }
    const handleTokenModalFrom = () => {
        setTokenOpenFrom(prev => !prev);
    }
    const oneInch = {
        address: '0x111111111117dC0aa78b770fA6A738034120C302',
        name: '1inch',
        symbol: '1INCH',
        logoURI: 'https://assets.coingecko.com/coins/images/13469/thumb/1inch-token.png?1608803028',
        decimals: 18
    }

    // Token TO and FROM
    const [tokenFrom, setTokenFrom] = useState(oneInch);
    const [tokenTo, setTokenTo] = useState(null);

    const handleTokenFromChange = (tokenObj) => {
        setTokenFrom(tokenObj);
    }
    const handleTokenToChange = (tokenObj) => {
        setTokenTo(tokenObj);
    }

    async function handlePriceEstimate() {
        if (!tokenFrom || !tokenTo) return
        let amount = fromAmount * 10 ** tokenFrom.decimals
        // console.log(amount)
        // console.log("token from", tokenFrom.name.toLowerCase())

        const params = {
            sellToken: tokenFrom.address,
            buyToken: tokenTo.address,
            sellAmount: amount
        }

        const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`)
        const priceJSON = await response.json();
        // console.log("fetching price", priceJSON)
        setToAmount(priceJSON.buyAmount / (10 ** tokenTo.decimals))
    }


    async function getQuote(account) {
        if (!tokenFrom || !tokenTo || !user) return

        // console.log("getting quote")

        let amount = fromAmount * 10 ** tokenFrom.decimals
        // console.log(amount)

        const params = {
            sellToken: tokenFrom.address,
            buyToken: tokenTo.address,
            sellAmount: amount,
            // takerAddress: account
        }
        const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
        const swapQuoteJSON = await response.json();

        setToAmount(swapQuoteJSON.buyAmount / (10 ** tokenTo.decimals))
        return swapQuoteJSON;

    }

    useEffect(() => {
        getQuote()
    }, [tokenFrom])


    async function trySwap() {

        // Pulls in any address / most recent used account.
        let accounts = await window.ethereum.request({ method: "eth_accounts" });
        // console.log("window.eth", accounts[0]);
        // console.log("user", user)

        let takerAddress = accounts[0];
        const swapQuoteJSON = await getQuote(takerAddress);
        // console.log(swapQuoteJSON)

        // Set token allowance 
        const web3 = new Web3(Web3.givenProvider);
        const fromTokenAddress = tokenFrom.address;
        const erc20Abi = file;



        const ERC20TokenContract = new web3.eth.Contract(erc20Abi, fromTokenAddress);
        console.log("setup erc20 token contract: ", ERC20TokenContract);

        const maxApproval = new BigNumber(2).pow(256).minus(1);

        ERC20TokenContract.methods.approve(swapQuoteJSON.allowanceTarget, maxApproval)
            .send({ from: takerAddress })
            .then(tx => console.log("tx: ", tx))

        const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
        // console.log("receipt: ", receipt);


    }

    const [chartData, setChartData] = useState(null)

    const fetchChartData = (id) => {
        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=monthly`
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const newArray = []
                for (const object of data.prices) {
                    const newObject = {
                        x: object[0],
                        y: object[1]
                    }
                    newArray.push(newObject)
                }
                const reversedArray = newArray.reverse()
                setChartData(reversedArray)
            })
        console.log(chartData)
    }

    useEffect(() => {
        if (tokenFrom == null) {
            return
        } else {
            const coinString = tokenFrom.name.toLowerCase()
            fetchChartData(coinString)
        }
        
    }, [tokenFrom])


    const getChartData = async (id) => {
        return await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=monthly`)
            .then(res => res.json())
            .then(data => {
                const newArray = []
                for (const object of data.prices) {
                    const newObject = {
                        x: object[0],
                        y: object[1]
                    }
                    newArray.push(newObject)
                }
                const reversedArray = newArray.reverse()
                setChartData(reversedArray)
            })
    }

    useEffect(() => {
        if (tokenFrom == null) {
            return
        } else {
            const coinString = tokenFrom.name.toLowerCase()
            getChartData(coinString)
        }
    }, [tokenFrom])




    return (
        <>
            <div className="swap-page-wrapper">

            <CoinChart chartData={chartData} tokenFrom={tokenFrom.symbol} />
            <div className='swap-modal-wrapper'>
                <Box className='swap-modal'>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Token Swap
                    </Typography>

                    <Box className='swap-box'>
                        <input className='token-input' type="text" placeholder='0.0' onBlur={handlePriceEstimate} value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} />
                        <div onClick={handleTokenModalFrom} className='token-dropdown'>
                            {tokenFrom ? <img className='swapIMG' src={tokenFrom.logoURI}></img> : <h2>🔁</h2>}
                            <h2>{tokenFrom && tokenFrom.symbol}</h2>
                        </div>
                        {tokens.length && <TokenModal tokenOpen={tokenOpenFrom} handleTokenModal={handleTokenModalFrom} tokens={tokens} handleTokenFromChange={handleTokenFromChange} />}
                    </Box>
                    {!isHovering ? <button className='token-swap' onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleClick}><FontAwesomeIcon icon={faArrowDown} /></button>
                        : <button className='token-swap' onClick={handleClick} onMouseOut={handleMouseOut}><FontAwesomeIcon onMouseOver={handleMouseOver} icon={faArrowsUpDown}/></button>
                    }

                    <Box className='swap-box'>
                        <input className='token-input' type="text" placeholder='0.0' value={toAmount} />
                        <div onClick={handleTokenModalTo} className='token-dropdown'>
                            {tokenTo ? <img className='swapIMG' src={tokenTo.logoURI}></img> : <h2>🔁</h2>}
                            <h2>{tokenTo && tokenTo.symbol}</h2>
                        </div>
                        {tokens.length && <TokenModal tokenOpen={tokenOpenTo} handleTokenModal={handleTokenModalTo} tokens={tokens} handleTokenFromChange={handleTokenToChange} />}
                    </Box>

                    <button className='token-swap' disabled={!user} onClick={trySwap}>SWAP</button>
                </Box>
            </div>



            </div>
            
            
        </>
    )
}


export default Swap