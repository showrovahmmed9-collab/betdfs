
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, LayoutDashboard, History, Settings, User as UserIcon, 
  ShieldCheck, ArrowUpCircle, ArrowDownCircle, RefreshCcw, Zap, Info, BarChart3, Wallet
} from 'lucide-react';
import { Asset, Trade, User, PricePoint } from './types';
import { getMarketInsight } from './services/geminiService';

// Constants
const INITIAL_BALANCE = 10000;
const ASSETS: Asset[] = [
  { id: 'btc', symbol: 'BTC/USDT', name: 'Bitcoin', price: 65420.50, change24h: 2.5, history: [] },
  { id: 'eth', symbol: 'ETH/USDT', name: 'Ethereum', price: 3450.20, change24h: -1.2, history: [] },
  { id: 'sol', symbol: 'SOL/USDT', name: 'Solana', price: 145.75, change24h: 5.8, history: [] },
  { id: 'bnb', symbol: 'BNB/USDT', name: 'Binance Coin', price: 580.10, change24h: 0.4, history: [] },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User>({
    username: 'DemoTrader_99',
    balance: INITIAL_BALANCE,
    trades: []
  });
  const [currentAsset, setCurrentAsset] = useState<Asset>(ASSETS[0]);
  const [allAssets, setAllAssets] = useState<Asset[]>(ASSETS);
  const [view, setView] = useState<'TRADE' | 'ADMIN'>('TRADE');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betDuration, setBetDuration] = useState<number>(30); // seconds
  const [marketInsight, setMarketInsight] = useState<string>('Analyzing market signals...');
  const [adminForceResult, setAdminForceResult] = useState<'NONE' | 'WIN' | 'LOSS'>('NONE');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Price Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAllAssets(prevAssets => prevAssets.map(asset => {
        const drift = (Math.random() - 0.5) * (asset.price * 0.001);
        const newPrice = asset.price + drift;
        const newPoint = { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          price: newPrice 
        };
        const newHistory = [...asset.history, newPoint].slice(-50);
        
        const updatedAsset = { ...asset, price: newPrice, history: newHistory };
        if (updatedAsset.id === currentAsset.id) {
          setCurrentAsset(updatedAsset);
        }
        return updatedAsset;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAsset.id]);

  // Fetch AI insights periodically
  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoadingInsight(true);
      const insight = await getMarketInsight(currentAsset.symbol, currentAsset.price, currentAsset.history);
      setMarketInsight(insight || "Awaiting market data...");
      setIsLoadingInsight(false);
    };
    fetchInsight();
    const insightInterval = setInterval(fetchInsight, 30000);
    return () => clearInterval(insightInterval);
  }, [currentAsset.symbol]);

  // Handle Trade Conclusion
  const concludeTrade = useCallback((trade: Trade) => {
    const asset = allAssets.find(a => a.id === trade.assetId);
    if (!asset) return;

    let isWin = false;
    if (adminForceResult === 'WIN') isWin = true;
    else if (adminForceResult === 'LOSS') isWin = false;
    else {
      if (trade.direction === 'UP') isWin = asset.price > trade.entryPrice;
      else isWin = asset.price < trade.entryPrice;
    }

    const payout = isWin ? trade.amount * 1.85 : 0;
    
    setUser(prev => ({
      ...prev,
      balance: prev.balance + payout,
      trades: prev.trades.map(t => t.id === trade.id ? { 
        ...t, 
        status: isWin ? 'WIN' : 'LOSS', 
        exitPrice: asset.price,
        payout 
      } : t)
    }));
  }, [allAssets, adminForceResult]);

  // Execution Logic
  const handlePlaceTrade = (direction: 'UP' | 'DOWN') => {
    if (user.balance < betAmount) return;

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: currentAsset.id,
      amount: betAmount,
      direction,
      entryPrice: currentAsset.price,
      timestamp: Date.now(),
      duration: betDuration,
      status: 'OPEN',
      payout: 0
    };

    setUser(prev => ({
      ...prev,
      balance: prev.balance - betAmount,
      trades: [newTrade, ...prev.trades]
    }));

    setTimeout(() => concludeTrade(newTrade), betDuration * 1000);
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e11] text-[#eaecef] overflow-hidden">
      {/* Sidebar - Asset List */}
      <div className="w-64 bg-[#1e2329] border-r border-[#2b3139] flex flex-col">
        <div className="p-4 border-b border-[#2b3139] flex items-center gap-2">
          <Zap className="text-yellow-400 fill-yellow-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">CRYPTOS</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setCurrentAsset(asset)}
              className={`w-full p-4 flex items-center justify-between hover:bg-[#2b3139] transition-colors border-l-4 ${currentAsset.id === asset.id ? 'bg-[#2b3139] border-yellow-400' : 'border-transparent'}`}
            >
              <div className="text-left">
                <p className="font-semibold text-sm">{asset.symbol}</p>
                <p className="text-xs text-[#848e9c]">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 mt-auto border-t border-[#2b3139] flex flex-col gap-2">
          <button 
            onClick={() => setView(view === 'TRADE' ? 'ADMIN' : 'TRADE')}
            className={`flex items-center gap-2 text-sm p-2 rounded transition-colors ${view === 'ADMIN' ? 'bg-purple-600 text-white' : 'text-[#848e9c] hover:bg-[#2b3139]'}`}
          >
            <ShieldCheck size={18} />
            {view === 'ADMIN' ? 'Exit Admin' : 'Admin Control'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-14 bg-[#1e2329] border-b border-[#2b3139] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-[#848e9c]">Market</span>
              <span className="text-sm font-semibold">{currentAsset.symbol}</span>
            </div>
            <div className="h-8 w-px bg-[#2b3139]" />
            <div className="flex flex-col">
              <span className="text-xs text-[#848e9c]">Price</span>
              <span className={`text-sm font-semibold transition-colors duration-500`}>
                ${currentAsset.price.toLocaleString()}
              </span>
            </div>
            <div className="h-8 w-px bg-[#2b3139]" />
            <div className="flex flex-col">
              <span className="text-xs text-[#848e9c]">24h Low/High</span>
              <span className="text-sm font-semibold text-[#848e9c]">
                ${(currentAsset.price * 0.98).toLocaleString()} / ${(currentAsset.price * 1.02).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#848e9c]">Balance</span>
              <span className="text-sm font-bold text-yellow-400">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors">
              <Wallet size={16} /> Deposit
            </button>
            <UserIcon className="text-[#848e9c] cursor-pointer hover:text-white" size={20} />
          </div>
        </header>

        {view === 'TRADE' ? (
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Chart Area */}
            <div className="flex-1 flex flex-col p-4 bg-[#0b0e11] overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-yellow-400" size={20} />
                  <h2 className="text-lg font-bold">Real-time Chart</h2>
                  <span className="bg-[#2b3139] text-[#848e9c] text-[10px] px-2 py-0.5 rounded">LIVE</span>
                </div>
                <div className="flex gap-2">
                  {['1s', '1m', '5m', '15m', '1h'].map(t => (
                    <button key={t} className={`text-[10px] px-2 py-1 rounded ${t === '1s' ? 'bg-[#2b3139] text-white' : 'text-[#848e9c] hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentAsset.history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f3ba2f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f3ba2f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#474d57" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#474d57" 
                      fontSize={10} 
                      orientation="right" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #2b3139', borderRadius: '4px' }}
                      itemStyle={{ color: '#f3ba2f' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#f3ba2f" 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Trade History - Bottom Panel */}
              <div className="h-48 border-t border-[#2b3139] mt-4 flex flex-col overflow-hidden">
                <div className="flex items-center gap-4 py-2 px-1 text-xs font-semibold text-[#848e9c] border-b border-[#2b3139]">
                  <button className="text-white border-b-2 border-yellow-400 pb-1">Open Orders</button>
                  <button className="hover:text-white pb-1">Trade History</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[#848e9c] border-b border-[#2b3139]">
                        <th className="py-2 px-2">Asset</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Entry</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 px-2 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.trades.map(trade => (
                        <tr key={trade.id} className="border-b border-[#2b3139] hover:bg-[#1e2329]">
                          <td className="py-2 px-2">{allAssets.find(a => a.id === trade.assetId)?.symbol}</td>
                          <td className={`py-2 font-bold ${trade.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.direction}
                          </td>
                          <td className="py-2">${trade.entryPrice.toLocaleString()}</td>
                          <td className="py-2">${trade.amount}</td>
                          <td className="py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' :
                              trade.status === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-yellow-400">
                            {trade.status === 'WIN' ? `+$${trade.payout.toFixed(2)}` : trade.status === 'LOSS' ? '-$0.00' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Trading Controls Panel */}
            <div className="w-full md:w-80 bg-[#1e2329] p-4 flex flex-col gap-6 shrink-0 border-l border-[#2b3139]">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#848e9c] uppercase tracking-wider">Trading Terminal</h3>
                
                {/* AI Insight Box */}
                <div className="bg-[#2b3139] p-4 rounded-lg border border-yellow-400/20 relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`w-4 h-4 text-yellow-400 ${isLoadingInsight ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold text-yellow-400">GEMINI AI INSIGHT</span>
                  </div>
                  <p className="text-xs italic text-[#eaecef] leading-relaxed">
                    "{marketInsight}"
                  </p>
                  <div className="absolute top-0 right-0 p-2">
                     {isLoadingInsight && <RefreshCcw className="w-3 h-3 text-yellow-400 animate-spin" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#848e9c] block mb-2">Investment Amount</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full bg-[#0b0e11] border border-[#474d57] rounded p-3 text-sm focus:border-yellow-400 outline-none pr-12"
                      />
                      <span className="absolute right-3 top-3 text-xs text-[#848e9c]">USDT</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      {[10, 50, 100, 500].map(val => (
                        <button 
                          key={val}
                          onClick={() => setBetAmount(val)}
                          className="text-[10px] bg-[#2b3139] px-3 py-1 rounded hover:bg-[#474d57] transition-colors"
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#848e9c] block mb-2">Expiration Time</label>
                    <select 
                      value={betDuration}
                      onChange={(e) => setBetDuration(Number(e.target.value))}
                      className="w-full bg-[#0b0e11] border border-[#474d57] rounded p-3 text-sm focus:border-yellow-400 outline-none appearance-none"
                    >
                      <option value={30}>30 Seconds</option>
                      <option value={60}>1 Minute</option>
                      <option value={300}>5 Minutes</option>
                      <option value={900}>15 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => handlePlaceTrade('UP')}
                    disabled={user.balance < betAmount}
                    className="flex flex-col items-center gap-1 bg-[#2ebd85] hover:bg-[#36d396] disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg transition-all transform active:scale-95"
                  >
                    <ArrowUpCircle size={28} />
                    <span className="text-xs font-bold">CALL / UP</span>
                    <span className="text-[10px] opacity-75">+85% Profit</span>
                  </button>
                  <button 
                    onClick={() => handlePlaceTrade('DOWN')}
                    disabled={user.balance < betAmount}
                    className="flex flex-col items-center gap-1 bg-[#f6465d] hover:bg-[#ff5b72] disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg transition-all transform active:scale-95"
                  >
                    <ArrowDownCircle size={28} />
                    <span className="text-xs font-bold">PUT / DOWN</span>
                    <span className="text-[10px] opacity-75">+85% Profit</span>
                  </button>
                </div>
              </div>

              <div className="mt-auto bg-[#0b0e11] p-4 rounded border border-[#2b3139]">
                 <div className="flex justify-between text-xs mb-2">
                   <span className="text-[#848e9c]">Min Trade</span>
                   <span>$1.00</span>
                 </div>
                 <div className="flex justify-between text-xs mb-2">
                   <span className="text-[#848e9c]">Max Trade</span>
                   <span>$50,000.00</span>
                 </div>
                 <div className="flex justify-between text-xs">
                   <span className="text-[#848e9c]">Platform Commission</span>
                   <span className="text-green-400">0%</span>
                 </div>
              </div>
            </div>
          </main>
        ) : (
          /* Admin View */
          <main className="flex-1 p-8 bg-[#0b0e11] overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <ShieldCheck className="text-purple-500" size={32} />
                    Admin Control Panel
                  </h2>
                  <p className="text-[#848e9c] mt-2">Manage user outcomes and platform profitability.</p>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-purple-400">SYSTEM SECURE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e2329] p-6 rounded-xl border border-[#2b3139]">
                  <h3 className="text-sm font-bold text-[#848e9c] mb-4 uppercase">User Balance Control</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Current User</span>
                      <span className="text-sm font-bold">{user.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Current Balance</span>
                      <span className="text-sm font-bold text-yellow-400">${user.balance.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => setUser(p => ({...p, balance: p.balance + 1000}))}
                      className="w-full bg-[#2b3139] hover:bg-[#474d57] py-2 rounded text-xs font-bold"
                    >
                      Inject $1,000 Demo Funds
                    </button>
                    <button 
                      onClick={() => setUser(p => ({...p, balance: 0}))}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded text-xs font-bold"
                    >
                      Wipe User Balance
                    </button>
                  </div>
                </div>

                <div className="bg-[#1e2329] p-6 rounded-xl border border-[#2b3139] col-span-2">
                  <h3 className="text-sm font-bold text-[#848e9c] mb-4 uppercase">Trade Result Manipulation</h3>
                  <p className="text-xs text-[#848e9c] mb-6">Force all concluding trades to either win or lose regardless of market price. This is a powerful feature for platform revenue control.</p>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={() => setAdminForceResult('NONE')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${adminForceResult === 'NONE' ? 'bg-blue-500 border-blue-400' : 'bg-[#0b0e11] border-[#2b3139]'}`}
                    >
                      <RefreshCcw size={20} />
                      <span className="text-xs font-bold">Natural Market</span>
                      <span className="text-[10px] opacity-60">No interference</span>
                    </button>
                    <button 
                      onClick={() => setAdminForceResult('WIN')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${adminForceResult === 'WIN' ? 'bg-green-600 border-green-500' : 'bg-[#0b0e11] border-[#2b3139]'}`}
                    >
                      <TrendingUp size={20} />
                      <span className="text-xs font-bold">Force Wins</span>
                      <span className="text-[10px] opacity-60">High Engagement</span>
                    </button>
                    <button 
                      onClick={() => setAdminForceResult('LOSS')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${adminForceResult === 'LOSS' ? 'bg-red-600 border-red-500' : 'bg-[#0b0e11] border-[#2b3139]'}`}
                    >
                      <TrendingDown size={20} />
                      <span className="text-xs font-bold">Force Losses</span>
                      <span className="text-[10px] opacity-60">Max Profit Mode</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] overflow-hidden">
                <div className="p-4 border-b border-[#2b3139] flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#848e9c] uppercase">System Analytics</h3>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Real-time Feed</span>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs text-[#848e9c]">Total Volume</p>
                    <p className="text-xl font-bold">${user.trades.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#848e9c]">Platform Profit</p>
                    <p className="text-xl font-bold text-green-400">
                      ${user.trades.reduce((acc, t) => acc + (t.status === 'LOSS' ? t.amount : t.status === 'WIN' ? -t.payout + t.amount : 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#848e9c]">Total Trades</p>
                    <p className="text-xl font-bold">{user.trades.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#848e9c]">Win Rate</p>
                    <p className="text-xl font-bold">
                      {user.trades.length > 0 ? ((user.trades.filter(t => t.status === 'WIN').length / user.trades.length) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Persistent Global Notifications (Mockup) */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
        {user.trades.length > 0 && user.trades[0].status !== 'OPEN' && (
          <div className="bg-[#1e2329] border border-[#2b3139] p-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
            <div className={`p-2 rounded-full ${user.trades[0].status === 'WIN' ? 'bg-green-500' : 'bg-red-500'}`}>
              <Info size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold">{user.trades[0].status === 'WIN' ? 'Trade Success!' : 'Trade Loss'}</p>
              <p className="text-[10px] text-[#848e9c]">
                {user.trades[0].status === 'WIN' ? `You just made $${user.trades[0].payout.toFixed(2)}` : 'Better luck next time.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
