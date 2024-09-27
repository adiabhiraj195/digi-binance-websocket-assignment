import React, { useEffect, useState, useContext } from "react";
import { BinanceContext } from "./contaxt/binance-context";


function App() {
  // State to store the price
  const {
    price,
    chartContainerRef,
    candleData,
    setTokenFeed,
    setInterval,
    tokenFeed,
    interval
  } = useContext(BinanceContext)

  // tokenFeed must be one of them "btcusdt" | "dotusdt" | "ethusdt"
  // interval must be one of them "1m" | "3m" | "5m"
  return (
    <div className="App">

      <div>
        <h1>BTC/USDT Real-Time Candlestick Chart</h1>
        <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }}></div>
      </div>
    </div>
  );
}

export default App;