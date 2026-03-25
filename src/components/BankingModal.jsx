// src/components/BankingModal.jsx
import React, { useState, useEffect } from 'react';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
// Notice we added setCurrentUser here to update the balance instantly!
const BankingModal = ({ onClose, currentBalance, setCurrentUser }) => {
  const [activeTab, setActiveTab] = useState('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [upiId, setUpiId] = useState(''); // NEW: UPI Field state
  const [statusMsg, setStatusMsg] = useState(null);
  
  // NEW: Transaction History State
  const [transactions, setTransactions] = useState([]);
  const token = localStorage.getItem('casinoToken');

  // Fetch Player's Banking History on Load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/banking/my-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setTransactions(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchHistory();
  }, [activeTab, token]); 

  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    // Validation
    if (activeTab === 'WITHDRAWAL' && amount > currentBalance) {
      return showMessage('error', 'Insufficient funds for withdrawal.');
    }
    if (activeTab === 'WITHDRAWAL' && method === 'UPI' && !upiId) {
      return showMessage('error', 'Please provide a valid UPI ID.');
    }

    try {
      // THE REAL BACKEND FETCH
      const res = await fetch(`${BACKEND_URL}/api/banking/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: activeTab, 
          amount: Number(amount), 
          method, 
          upiId: activeTab === 'WITHDRAWAL' ? upiId : undefined 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMessage('success', data.message);
      setAmount('');
      setUpiId('');
      
      // Instantly deduct the player's wallet balance in React!
      if (activeTab === 'WITHDRAWAL' && setCurrentUser) {
        setCurrentUser(prev => ({ ...prev, walletBalance: data.newBalance }));
      }

      // Add the new pending request to the top of the history list instantly
      setTransactions([{ _id: Date.now(), type: activeTab, amount, status: 'PENDING', createdAt: new Date() }, ...transactions]);

    } catch (err) {
      showMessage('error', err.message);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#051c11] w-full max-w-sm rounded-2xl border border-green-900 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-green-900 bg-[#082b1c] shrink-0">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Cashier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center font-bold border border-green-900">
            X
          </button>
        </div>

        {/* TABS (Notice WITHDRAW is now WITHDRAWAL to match DB) */}
        <div className="flex border-b border-green-900 bg-[#0a2e1d] shrink-0">
          <button 
            onClick={() => { setActiveTab('DEPOSIT'); setStatusMsg(null); }}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'DEPOSIT' ? 'text-green-400 border-b-2 border-green-500 bg-[#051c11]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Deposit
          </button>
          <button 
            onClick={() => { setActiveTab('WITHDRAWAL'); setStatusMsg(null); }}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'WITHDRAWAL' ? 'text-yellow-400 border-b-2 border-yellow-500 bg-[#051c11]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Withdraw
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 shrink-0">
          <div className="flex justify-between items-center bg-[#082b1c] border border-green-900/50 rounded-lg p-3 mb-5">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Available Balance</span>
            <span className="text-lg text-white font-black">₹{currentBalance}</span>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded mb-4 text-xs font-bold text-center border ${statusMsg.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <label className="text-[10px] text-green-500 font-bold uppercase tracking-wider mb-1 block">Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-[#03120b] border border-green-800 rounded-lg p-3 text-white font-bold outline-none focus:border-green-400 placeholder-gray-700"
              />
            </div>

            <div>
              <label className="text-[10px] text-green-500 font-bold uppercase tracking-wider mb-1 block">Payment Method</label>
              <select 
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#03120b] border border-green-800 rounded-lg p-3 text-white font-bold outline-none focus:border-green-400 appearance-none"
              >
                <option value="UPI">UPI / Google Pay</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CRYPTO">USDT (TRC20)</option>
              </select>
            </div>

            {/* NEW: CONDITIONAL UPI FIELD */}
            {activeTab === 'WITHDRAWAL' && method === 'UPI' && (
              <div className="animate-fade-in">
                <label className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider mb-1 block">UPI ID</label>
                <input 
                  type="text" 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)} 
                  placeholder="e.g. yourname@okhdfc" 
                  required 
                  className="w-full bg-[#03120b] border border-yellow-800/50 rounded-lg p-3 text-white font-bold outline-none focus:border-yellow-400 placeholder-gray-700" 
                />
              </div>
            )}

            <button 
              type="submit" 
              className={`w-full py-3 rounded-lg font-black uppercase tracking-widest mt-2 shadow-lg transition-all ${activeTab === 'DEPOSIT' ? 'bg-green-600 hover:bg-green-500 text-black shadow-green-900/50' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-900/50'}`}
            >
              {activeTab === 'DEPOSIT' ? 'Request Deposit' : 'Request Withdrawal'}
            </button>
          </form>
        </div>

        {/* NEW: LEDGER / RECENT TRANSACTIONS */}
        <div className="flex-1 bg-[#020b07] border-t border-green-900/50 p-4 overflow-y-auto">
          <h3 className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-3">Recent Requests</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center text-green-900 text-xs font-bold py-2">No recent activity.</div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx._id} className="bg-[#051c11] border border-green-900/50 rounded-lg p-2.5 flex justify-between items-center">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.type}</span>
                    <span className="text-gray-500 text-[9px]">{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-white font-bold text-xs">₹{tx.amount}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 ${tx.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-800' : tx.status === 'APPROVED' ? 'bg-green-900/30 text-green-500 border border-green-800' : 'bg-red-900/30 text-red-500 border border-red-800'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BankingModal;