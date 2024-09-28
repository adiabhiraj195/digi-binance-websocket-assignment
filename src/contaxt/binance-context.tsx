import { createContext, useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';


interface BinanceContextInterface {
    price: any | null;
    chartContainerRef: any;
    candleData: CandleData[] | null;
    setTokenFeed: Dispatch<SetStateAction<string>>;
    setInterval: Dispatch<SetStateAction<string>>;
    interval: string;
    tokenFeed: string
}

const defaultValues = {
    price: null,
    setPrice: () => { },
    chartContainerRef: null,
    candleData: null,
    tokenFeed: "btcusdt",
    setTokenFeed: () => { },
    setInterval: () => { },
    interval: "3m",

}

export const BinanceContext = createContext<BinanceContextInterface>(defaultValues);

interface BinanceProviderInterface {
    children: JSX.Element;
}

interface CandleData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
}

export const BinanceProvider = ({ children }: BinanceProviderInterface) => {
    const chartContainerRef = useRef<HTMLDivElement | null>(defaultValues.chartContainerRef);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const [price, setPrice] = useState<any>(null);
    const [candleData, setCandleData] = useState<CandleData[]>([]);
    const [tokenFeed, setTokenFeed] = useState<string>(defaultValues.tokenFeed);
    const [interval, setInterval] = useState<string>(defaultValues.interval);

    // setting previous data when change tokenFeed (preserving data)
    // useEffect(() => {
    //     const previousData = localStorage.getItem(tokenFeed);
    //     if (!previousData) return;

    //     setCandleData(JSON.parse(previousData));
    //     // console.log("refresh")
    // }, [tokenFeed])

    useEffect(() => {
        const binanceSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${tokenFeed}@kline_${interval}`);
        // const binanceSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${tokenFeed}@trade`);

        binanceSocket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            const kline = data.k;
            console.log(kline);
            setPrice(kline.c);

            const newCandle: CandleData = {
                time: kline.t / 1000 as UTCTimestamp,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
            };


            if (candleData[candleData.length - 1]?.time >= newCandle?.time) {
                console.log("duplicate time ")
            } else {


                if (kline.x) {

                    setCandleData((prevCandles) => [...prevCandles, newCandle]);
                } else {


                    setCandleData((prevCandles) => {
                        const candlesCopy = [...prevCandles];
                        if (candlesCopy.length > 0) {
                            candlesCopy[candlesCopy.length - 1] = newCandle;
                        }
                        return candlesCopy;
                    });
                }
            }

        };


        return () => {
            binanceSocket.close();
        };
    }, []);

    // Initialize the TradingView Chart
    useEffect(() => {
        if (chartContainerRef.current) {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 400,
                timeScale: {
                    timeVisible: true,
                }
            });

            const candleSeries = chart.addCandlestickSeries();
            candleSeriesRef.current = candleSeries;
            chartRef.current = chart;

            return () => {
                chart.remove();
            };
        }
    }, []);

    // setting chart on change candle data
    // useEffect(() => {
    //     if (candleData.length && candleSeriesRef.current) {
    //         candleSeriesRef.current.setData(candleData.filter());
    //         localStorage.setItem(tokenFeed, JSON.stringify(candleData));
    //     }
    // }, [candleData]);
    useEffect(() => {
        if (candleData.length && candleSeriesRef.current) {
            candleSeriesRef.current.setData(candleData.sort((a, b) => {
                if (new Date(a.time).getTime() > new Date(b.time).getTime()) {
                    return 1;
                }
                if (new Date(a.time).getTime() < new Date(b.time).getTime()) {
                    return -1;
                }
                return 0;
            }).filter((item, index) => candleData.indexOf(item) === index))

            localStorage.setItem(tokenFeed, JSON.stringify(candleData));
        }
    }, [candleData]);

    return (
        <BinanceContext.Provider
            value={{
                price,
                chartContainerRef,
                candleData,
                setTokenFeed,
                setInterval,
                tokenFeed,
                interval
            }}
        >
            {children}
        </BinanceContext.Provider>

    )
}