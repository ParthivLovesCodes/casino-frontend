// src/components/PlayerHistory.jsx
import React, { useState, useEffect } from 'react';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const PlayerHistory = ({ onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  const fetchHistory = async (dateStr = '') => {
    setLoading(true);
    const token = localStorage.getItem('casinoToken');
    try {
      const url = `${BACKEND_URL}/api/bet/history${dateStr ? `?date=${dateStr}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
    setLoading(false);
  };

  // Fetch when component mounts or date changes
  useEffect(() => {
    fetchHistory(filterDate);
  }, [filterDate]);

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
      {/* Sliding Panel */}
      <div className="bg-[#051c11] w-full h-[85%] rounded-t-[2rem] border-t-2 border-green-900 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-slide-up">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-green-900 bg-[#082b1c]">
          <h2 className="text-xl font-black text-green-400 uppercase tracking-widest">Bet Ledger</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center font-bold border border-green-900">
            X
          </button>
        </div>

        {/* CALENDAR FILTER */}
        <div className="p-4 bg-[#0a2e1d] flex items-center gap-3 border-b border-green-900/50">
          <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Date:</span>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#051c11] text-white text-sm border border-green-800 rounded px-2 py-1 outline-none focus:border-green-400 flex-1 color-scheme-dark"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-[10px] bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800 uppercase">Clear</button>
          )}
        </div>

        {/* HISTORY LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-green-600 font-bold mt-10 animate-pulse">Loading secure ledger...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 font-bold mt-10 text-sm">No bets found for this period.</div>
          ) : (
            history.map((bet) => (
              <div key={bet._id} className="bg-[#082b1c] border border-green-900/50 rounded-lg p-3 flex justify-between items-center shadow-lg">
                <div className="flex flex-col">
                  <span className="text-white font-black uppercase text-sm">{bet.betTarget.replace('_', ' ')}</span>
                  <span className="text-gray-500 text-[10px]">{new Date(bet.createdAt).toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-gray-300 text-xs">Bet: ₹{bet.amount}</span>
                  {bet.payoutStatus === 'WON' ? (
                    <span className="text-green-400 font-black text-sm">+₹{bet.payoutAmount}</span>
                  ) : bet.payoutStatus === 'LOST' ? (
                    <span className="text-red-500 font-black text-sm">-₹{bet.amount}</span>
                  ) : (
                    <span className="text-yellow-500 font-black text-sm">PENDING</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerHistory;