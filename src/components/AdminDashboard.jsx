// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';

// 1. ADDED: Grabs your live Render link!
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AdminDashboard = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('HOME');

  // Form States
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState('1000');
  const [targetUser, setTargetUser] = useState('');
  const [amount, setAmount] = useState('');
  const [engineMode, setEngineMode] = useState('FAIR');
  const [message, setMessage] = useState(null);
  
  // Player List States
  const [searchQuery, setSearchQuery] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState('');
  const [newPlayerPassword, setNewPlayerPassword] = useState('');
  
  // History Modal States
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTargetUser, setHistoryTargetUser] = useState('');
  const [playerHistoryData, setPlayerHistoryData] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerDateFilter, setLedgerDateFilter] = useState('');
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  
  // MOCK STATE (For UI testing until we build the fetch route)
  const [players, setPlayers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const token = localStorage.getItem('casinoToken');
  
  // --- FETCH REAL PLAYERS ON LOAD ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [playersRes, requestsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/admin/players`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/admin/banking/requests`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (playersRes.ok) setPlayers(await playersRes.json());
        if (requestsRes.ok) setPendingRequests(await requestsRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [token]);

  // --- UPDATED FETCH PLAYER HISTORY LOGIC ---
  const fetchPlayerHistory = async (username, dateStr = '') => {
    setIsHistoryLoading(true);
    try {
      const url = `${BACKEND_URL}/api/admin/player/${username}/history${dateStr ? `?date=${dateStr}` : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlayerHistoryData(data);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // --- FETCH MASTER LEDGER LOGIC ---
  const fetchLedger = async (dateStr = '') => {
    setIsLedgerLoading(true);
    try {
      const url = `${BACKEND_URL}/api/admin/ledger${dateStr ? `?date=${dateStr}` : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setLedgerData(await res.json());
    } catch (err) { console.error(err); } finally { setIsLedgerLoading(false); }
  };

  // Auto-fetch the ledger when the admin opens the tab or changes the date!
  useEffect(() => {
    if (activeView === 'LEDGER') fetchLedger(ledgerDateFilter);
  }, [activeView, ledgerDateFilter]);

  const handleOpenHistoryModal = (username) => {
    setHistoryTargetUser(username);
    setHistoryModalOpen(true);
    setHistoryDateFilter(''); // Clear any old calendar filters when opening a new player
    fetchPlayerHistory(username, ''); // Fetch their lifetime history first
  };

  // Watch the calendar: Fetch new data instantly if the admin changes the date!
  useEffect(() => {
    if (historyModalOpen && historyTargetUser) {
      fetchPlayerHistory(historyTargetUser, historyDateFilter);
    }
  }, [historyDateFilter]);

  // --- ACTIONS ---
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProcessRequest = async (id, action) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banking/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ requestId: id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 1. Remove the ticket from the notification list
      setPendingRequests(prev => prev.filter(req => req._id !== id));
      showMessage('success', data.message);

      // 2. Instantly update the player's balance on your VIP Roster screen!
      setPlayers(players.map(p => 
        p._id === data.userId ? { ...p, walletBalance: data.newBalance } : p
      ));
    } catch (err) {
      showMessage('error', err.message);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/create-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username: newUsername, password: newPassword, initialBalance: Number(initialBalance) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showMessage('success', `VIP Player ${newUsername} created with ₹${initialBalance}!`);
      setPlayers([{ _id: Date.now().toString(), username: newUsername, walletBalance: Number(initialBalance) }, ...players]);
      setNewUsername(''); setNewPassword(''); setInitialBalance('1000');
    } catch (err) { showMessage('error', err.message); }
  };

  // 👇 THE NEW DELETE LOGIC 👇
  const handleDeletePlayer = async (username) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${username}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/player/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Remove player from the UI instantly
      setPlayers(players.filter(p => p.username !== username));
      showMessage('success', data.message);
    } catch (err) {
      showMessage('error', err.message);
    }
  };
  
  // --- RESET PASSWORD LOGIC ---
  const handleOpenResetModal = (username) => {
    setResetTargetUser(username);
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/player/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: resetTargetUser, newPassword: newPlayerPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMessage('success', data.message);
      setResetModalOpen(false);
      setNewPlayerPassword('');
    } catch (err) {
      showMessage('error', err.message);
    }
  };

// --- RESTORED CASHIER LOGIC ---
  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetUsername: targetUser, amount: Number(amount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMessage('success', `Deposited ₹${amount} to ${targetUser}.`);
      
      // Instantly update the UI balance for that player!
      setPlayers(players.map(p => 
        p.username === targetUser 
          ? { ...p, walletBalance: data.newBalance } 
          : p
      ));

      setTargetUser(''); 
      setAmount('');
    } catch (err) {
      showMessage('error', err.message);
    }
  };
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    // Safety check so you don't accidentally click it
    if (!amount || amount <= 0) {
      return showMessage('error', 'Please enter a valid amount.');
    }

    const confirmDeduct = window.confirm(`Are you sure you want to deduct ₹${amount} from ${targetUser}?`);
    if (!confirmDeduct) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetUsername: targetUser, amount: Number(amount) })
      });
      
      const data = await res.json();
      
      // If the backend says "Insufficient funds", this catches it
      if (!res.ok) throw new Error(data.error);

      showMessage('success', `Withdrew ₹${amount} from ${targetUser}.`);
      
      // Instantly update the UI balance for that player!
      setPlayers(players.map(p => 
        p.username === targetUser 
          ? { ...p, walletBalance: data.newBalance } 
          : p
      ));

      setTargetUser(''); 
      setAmount('');
    } catch (err) {
      showMessage('error', err.message);
    }
  };

  // --- QUICK ACTION ROUTING ---
  const handleQuickDeposit = (username) => {
    setTargetUser(username);
    setActiveView('CASHIER');
  };

  const handleActionPlaceholder = (actionName, username) => {
    showMessage('error', `${actionName} for ${username} - Backend route needed!`);
  };
  
  const handleToggleEngine = async (mode) => {
    try {
      const token = localStorage.getItem('casinoToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/engine-mode`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ mode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEngineMode(mode);
      alert(`Success: ${data.message}`); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredPlayers = players.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 w-full bg-gradient-to-br from-[#02110a] to-[#051c11] text-white overflow-hidden flex flex-col relative font-sans">
      
      {/* --- ADMIN HEADER & HAMBURGER --- */}
      <div className="flex justify-between items-center p-5 border-b border-emerald-900/50 bg-[#02110a]/80 backdrop-blur-md shrink-0 shadow-lg">
        <h2 className="text-lg font-black tracking-widest text-emerald-400 uppercase flex items-center gap-3">
          <span className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">🕹️</span> 
          Control Center
        </h2>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="z-40 p-2 text-emerald-500 flex flex-col gap-1.5 w-10 h-10 justify-center items-end hover:opacity-80 transition-opacity"
        >
          {pendingRequests.length > 0 && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>}
          <div className="w-6 h-0.5 bg-emerald-400 rounded-full"></div>
          <div className="w-4 h-0.5 bg-emerald-400 rounded-full"></div>
          <div className="w-6 h-0.5 bg-emerald-400 rounded-full"></div>
        </button>
      </div>

      {/* --- GLOBAL MESSAGE BANNER --- */}
      {message && (
        <div className={`m-4 p-4 rounded-xl text-sm font-bold border backdrop-blur-md z-30 absolute top-16 left-0 right-0 shadow-2xl animate-slide-up ${message.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-300' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'}`}>
          {message.text}
        </div>
      )}

      {/* --- HAMBURGER MENU (Sleeker design) --- */}
      {isMenuOpen && (
        <>
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-b from-[#03150d] to-[#02110a] z-50 border-l border-emerald-900/50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]">
            <div className="p-6 border-b border-emerald-900/30 flex justify-between items-center">
              <span className="text-emerald-500 font-black text-sm uppercase tracking-widest">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
            </div>
            {/* Menu Buttons inside here... (kept clean for space) */}
            <div className="flex-1 p-4 flex flex-col gap-3">
              <button onClick={() => { setActiveView('HOME'); setIsMenuOpen(false); }} className="w-full text-left p-4 rounded-xl border border-emerald-900/30 font-bold uppercase tracking-widest text-xs bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 transition-all">🏠 Dashboard</button>
              <button onClick={() => { setActiveView('NOTIFICATIONS'); setIsMenuOpen(false); }} className="w-full text-left p-4 rounded-xl border border-emerald-900/30 font-bold uppercase tracking-widest text-xs bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 transition-all flex justify-between">
                🔔 Requests {pendingRequests.length > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>}
              </button>
              <button onClick={() => { setActiveView('CASHIER'); setIsMenuOpen(false); }} className="w-full text-left p-4 rounded-xl border border-emerald-900/30 font-bold uppercase tracking-widest text-xs bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 transition-all">🏦 Cashier</button>
              {/* Add this button right above the House Edge button in the Hamburger Menu */}
<button onClick={() => { setActiveView('LEDGER'); setIsMenuOpen(false); }} className="w-full text-left p-4 rounded-xl border border-emerald-900/30 font-bold uppercase tracking-widest text-xs bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 transition-all">📊 P/L Ledger</button>
              <button onClick={() => { setActiveView('ENGINE'); setIsMenuOpen(false); }} className="w-full text-left p-4 rounded-xl border border-emerald-900/30 font-bold uppercase tracking-widest text-xs bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 transition-all">⚙️ House Edge</button>
            </div>
            <div className="p-6">
              <button onClick={onLogout} className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl font-black uppercase tracking-widest border border-rose-500/20 transition-all">Logout</button>
            </div>
          </div>
        </>
      )}

      {/* --- DYNAMIC MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-8">

        {/* VIEW 1: PREMIUM HOME DASHBOARD */}
        {activeView === 'HOME' && (
          <>
            {/* NEW PLAYER CARD */}
            <div className="bg-[#051810]/60 p-6 rounded-2xl border border-emerald-800/30 shadow-lg backdrop-blur-sm">
              <h3 className="text-emerald-400 font-bold mb-5 uppercase tracking-widest flex items-center gap-2 text-sm">
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-lg leading-none">+</span> Create VIP
              </h3>
              <form onSubmit={handleCreatePlayer} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Username" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-[#020b07] border border-emerald-900/50 rounded-xl p-3 text-sm text-emerald-50 outline-none focus:border-emerald-500 transition-colors placeholder-emerald-900" />
                  <input type="password" placeholder="Password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#020b07] border border-emerald-900/50 rounded-xl p-3 text-sm text-emerald-50 outline-none focus:border-emerald-500 transition-colors placeholder-emerald-900" />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">₹</span>
                  <input type="number" placeholder="1000" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full bg-[#020b07] border border-emerald-900/50 rounded-xl p-3 pl-8 text-sm text-emerald-50 outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <button type="submit" className="w-full bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">Create Account</button>
              </form>
            </div>

            {/* PLAYERS LIST */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-2 text-sm px-1">
                  👥 Active Players
                </h3>
                <button className="text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-all">
                  Refresh
                </button>
              </div>
              
              <div className="relative mb-5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search user..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#051810]/60 border border-emerald-800/30 rounded-xl p-3 pl-10 text-sm text-emerald-100 outline-none focus:border-emerald-500 backdrop-blur-sm placeholder-emerald-900/70"
                />
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[1fr_60px_auto] gap-2 border-b border-emerald-900/30 pb-3 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest px-2">
                <span>Player</span>
                <span className="text-right">Bal</span>
                <span className="text-center w-[150px]">Actions</span>
              </div>

              {/* Table Rows (Premium Glass Cards) */}
              <div className="space-y-2">
                {filteredPlayers.map(player => (
                  <div key={player._id} className="grid grid-cols-[1fr_60px_auto] gap-2 bg-[#051810]/40 border border-emerald-900/20 py-3 px-3 rounded-xl items-center hover:bg-[#051810]/80 transition-colors">
                    <span className="text-emerald-100 font-bold text-sm truncate">{player.username}</span>
                    <span className="text-emerald-400 font-mono text-sm text-right font-bold">{player.walletBalance}</span>
                    
                    {/* The 4 Glowing Action Buttons */}
                    <div className="flex justify-end gap-2 w-[150px]">
                      {/* Deposit (Green) */}
                      <button onClick={() => handleQuickDeposit(player.username)} className="bg-emerald-900/40 border border-emerald-500/30 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] group transition-all">
                        <span className="text-xs text-emerald-400 group-hover:text-black">💰</span>
                      </button>
                      {/* Replace the old amber button with this wired-up version: */}
                      <button 
                        onClick={() => handleOpenResetModal(player.username)} 
                        className="bg-amber-900/30 border border-amber-500/30 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] group transition-all"
                      >
                        <span className="text-xs text-amber-400 group-hover:text-black">🔑</span>
                      </button>
                      <button 
                          onClick={() => handleOpenHistoryModal(player.username)} 
                          className="bg-blue-900/30 border border-blue-500/30 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] group transition-all"
                          >
                          <span className="text-xs text-blue-400 group-hover:text-black">📜</span>
                      </button>
                      {/* Delete (Rose) - NOW FULLY WIRED! */}
                      <button onClick={() => handleDeletePlayer(player.username)} className="bg-rose-900/30 border border-rose-500/30 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:shadow-[0_0_15px_rgba(225,29,72,0.5)] group transition-all">
                        <span className="text-sm text-rose-500 group-hover:text-white font-black">×</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Keeping placeholders for other views to save space... */}
        {activeView === 'NOTIFICATIONS' && (
          <div>
            <h3 className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="bg-emerald-500/20 p-1.5 rounded">🔔</span> Pending Actions
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center text-emerald-900 font-bold mt-10 p-6 bg-[#051810]/40 rounded-xl border border-emerald-900/30">All caught up! No pending requests.</div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req._id} className="bg-[#051810]/60 p-5 rounded-2xl border border-emerald-800/30 shadow-lg relative overflow-hidden backdrop-blur-sm">
                    <div className={`absolute left-0 top-0 w-1.5 h-full ${req.type === 'DEPOSIT' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${req.type === 'DEPOSIT' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : 'bg-amber-900/40 text-amber-400 border border-amber-500/30'}`}>
                          {req.type} • {req.method}
                        </span>
                        <p className="text-emerald-50 font-black text-xl mt-2">{req.username}</p>
                        {req.upiId && <p className="text-amber-500/80 text-xs font-bold mt-1">UPI: {req.upiId}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 text-[10px] block font-bold">{new Date(req.createdAt).toLocaleString()}</span>
                        <span className="text-white font-black text-2xl leading-none mt-1 block">₹{req.amount}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-3">
                      <button onClick={() => handleProcessRequest(req._id, 'APPROVE')} className="flex-1 bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/50 font-black uppercase text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">Approve</button>
                      <button onClick={() => handleProcessRequest(req._id, 'DENY')} className="flex-1 bg-rose-900/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/50 font-black uppercase text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.1)]">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeView === 'CASHIER' && (
            <div className="bg-[#051810]/60 p-6 rounded-2xl border border-emerald-800/30 shadow-lg backdrop-blur-sm max-w-md">
              <h3 className="text-emerald-400 font-bold mb-5 uppercase tracking-widest flex items-center gap-2 text-sm">
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-lg leading-none">🏦</span> Cashier Operations
              </h3>
              
              {/* Removed onSubmit here since the buttons will handle their own clicks */}
              <form className="space-y-4">
                <div>
                  <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1 block">Target Username</label>
                  <input type="text" placeholder="Enter username..." required value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="w-full bg-[#020b07] border border-emerald-900/50 rounded-xl p-3 text-sm text-emerald-50 outline-none focus:border-emerald-500 transition-colors placeholder-emerald-900" />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1 block">Amount of Chips (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">₹</span>
                    <input type="number" placeholder="Enter amount..." required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#020b07] border border-emerald-900/50 rounded-xl p-3 pl-8 text-sm text-emerald-50 outline-none focus:border-emerald-500 transition-colors placeholder-emerald-900" />
                  </div>
                </div>
                
                {/* The new side-by-side action buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={handleDeposit}
                    className="flex-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  >
                    ➕ Deposit
                  </button>
                  <button 
                    type="button" 
                    onClick={handleWithdraw}
                    className="flex-1 bg-rose-600/20 border border-rose-500/50 text-rose-400 font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-black transition-all shadow-[0_0_15px_rgba(225,29,72,0.1)]"
                  >
                    ➖ Deduct
                  </button>
                </div>
              </form>
            </div>
          )}

        {/* VIEW 5: MASTER PROFIT/LOSS LEDGER */}
        {activeView === 'LEDGER' && (
          <div className="space-y-4 max-w-lg mx-auto animate-fade-in">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 text-sm mb-2">
              <span className="bg-emerald-500/20 p-1.5 rounded text-lg leading-none">📊</span> Master Ledger
            </h3>

            {/* The Calendar Filter */}
            <div className="flex items-center gap-3 bg-[#051810]/60 p-3 rounded-xl border border-emerald-900/30 backdrop-blur-sm">
               <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Date:</span>
               <input 
                 type="date" 
                 value={ledgerDateFilter}
                 onChange={(e) => setLedgerDateFilter(e.target.value)}
                 className="flex-1 bg-transparent text-emerald-100 text-sm outline-none color-scheme-dark"
               />
               {ledgerDateFilter && (
                 <button onClick={() => setLedgerDateFilter('')} className="text-[10px] text-rose-400 border border-rose-900/50 bg-rose-900/20 px-2 py-1 rounded uppercase hover:bg-rose-900/50 transition-colors">Clear</button>
               )}
            </div>

            {isLedgerLoading || !ledgerData ? (
              <div className="text-center text-emerald-500/50 font-bold py-10 animate-pulse">Calculating Casino Revenue...</div>
            ) : (
              <>
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 bg-gradient-to-br from-[#051810] to-[#020b07] border border-emerald-900/50 p-5 rounded-2xl shadow-lg">
                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest block mb-1">Net Casino Profit</span>
                    <span className={`text-3xl font-black tracking-wider ${ledgerData.houseProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {ledgerData.houseProfit >= 0 ? '+' : '-'}₹{Math.abs(ledgerData.houseProfit)}
                    </span>
                  </div>
                  
                  <div className="bg-[#051810]/60 border border-emerald-900/30 p-4 rounded-xl">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest block mb-1">Total Wagered</span>
                    <span className="text-white font-bold text-lg">₹{ledgerData.totalWagered}</span>
                  </div>
                  <div className="bg-[#051810]/60 border border-emerald-900/30 p-4 rounded-xl">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest block mb-1">Total Paid Out</span>
                    <span className="text-rose-400 font-bold text-lg">₹{ledgerData.totalPaidOut}</span>
                  </div>
                </div>

                {/* Cash Flow Summary */}
                <div className="flex justify-between items-center bg-[#020b07] p-3 rounded-lg border border-emerald-900/20 mt-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cash Flow:</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-500 text-xs font-bold">In: ₹{ledgerData.totalDeposits}</span>
                    <span className="text-amber-500 text-xs font-bold">Out: ₹{ledgerData.totalWithdrawals}</span>
                  </div>
                </div>

                {/* System Timeline List */}
                <div className="mt-6">
                  <h4 className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-3 border-b border-emerald-900/30 pb-2">System Activity Log</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {ledgerData.transactions.length === 0 ? (
                      <div className="text-center text-emerald-900/50 text-xs font-bold py-5">No financial activity recorded.</div>
                    ) : (
                      ledgerData.transactions.map(tx => (
                        <div key={tx._id} className="bg-[#051810]/40 border border-emerald-900/20 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${tx.type === 'DEPOSIT' || tx.type === 'BET_WON' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                            <span className="text-gray-500 text-[9px]">{new Date(tx.createdAt).toLocaleString()}</span>
                          </div>
                          <span className={`font-black text-sm ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        
        {activeView === 'ENGINE' && (
          <div className="bg-[#051810]/60 p-6 rounded-2xl border border-emerald-800/30 shadow-lg backdrop-blur-sm max-w-md relative overflow-hidden">
            {engineMode === 'RIGGED' && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>}
            
            <h3 className="text-emerald-400 font-bold mb-5 uppercase tracking-widest flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-lg leading-none">⚙️</span> Engine Control
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-lg border ${engineMode === 'FAIR' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-rose-900/30 text-rose-400 border-rose-500/30 animate-pulse'}`}>CURRENT: {engineMode}</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => handleToggleEngine('FAIR')} className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest border transition-all ${engineMode === 'FAIR' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#020b07] border-emerald-900/30 text-gray-500 hover:border-blue-500/50 hover:text-blue-400'}`}>Fair Play (Pure RNG)</button>
              <button onClick={() => handleToggleEngine('RIGGED')} className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest border transition-all ${engineMode === 'RIGGED' ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-[#020b07] border-emerald-900/30 text-gray-500 hover:border-rose-500/50 hover:text-rose-400'}`}>Rigged (House Edge)</button>
            </div>
            
            <p className="text-[10px] text-emerald-700 mt-5 text-center leading-relaxed font-bold uppercase tracking-wider">
              {engineMode === 'FAIR' ? 'Game operates on pure random probability.' : 'Warning: Game will actively calculate lowest payout.'}
            </p>
          </div>
        )}

      </div>
      {/* --- PASSWORD RESET MODAL --- */}
      {resetModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResetModalOpen(false)}></div>
          <div className="relative bg-gradient-to-b from-[#051810] to-[#020b07] border border-amber-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] w-full max-w-sm animate-fade-in">
            <h3 className="text-amber-400 font-black mb-2 uppercase tracking-widest text-lg">Reset Password</h3>
            <p className="text-emerald-100/60 text-xs mb-5">Override credentials for VIP: <span className="text-emerald-400 font-bold">{resetTargetUser}</span></p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter new password..." 
                required 
                value={newPlayerPassword} 
                onChange={(e) => setNewPlayerPassword(e.target.value)} 
                className="w-full bg-[#020b07] border border-amber-900/50 rounded-xl p-3 text-sm text-emerald-50 outline-none focus:border-amber-500 transition-colors placeholder-emerald-900/50" 
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetModalOpen(false)} className="flex-1 bg-transparent border border-emerald-900/50 text-emerald-500 font-bold py-3 rounded-xl uppercase text-xs hover:bg-emerald-900/30 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl uppercase text-xs tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">Force Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- PLAYER HISTORY MODAL --- */}
      {/* --- PLAYER HISTORY MODAL --- */}
      {historyModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)}></div>
          <div className="relative bg-gradient-to-b from-[#051118] to-[#02070b] border border-blue-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.2)] w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b border-blue-900/50 pb-3 shrink-0">
              <div>
                <h3 className="text-blue-400 font-black uppercase tracking-widest text-lg">Bet Ledger</h3>
                <p className="text-blue-100/60 text-xs">Viewing history for: <span className="text-blue-400 font-bold">{historyTargetUser}</span></p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
            </div>

            {/* THE CALENDAR FILTER */}
            <div className="flex items-center gap-3 bg-[#020b12] p-3 rounded-lg border border-blue-900/30 mb-4 shrink-0">
               <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Date:</span>
               <input 
                 type="date" 
                 value={historyDateFilter}
                 onChange={(e) => setHistoryDateFilter(e.target.value)}
                 className="flex-1 bg-transparent text-blue-100 text-sm outline-none color-scheme-dark"
               />
               {historyDateFilter && (
                 <button onClick={() => setHistoryDateFilter('')} className="text-[10px] text-rose-400 border border-rose-900/50 bg-rose-900/20 px-2 py-1 rounded uppercase hover:bg-rose-900/50 transition-colors">Clear</button>
               )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {isHistoryLoading ? (
                <div className="text-center text-blue-500/50 font-bold py-10 animate-pulse">Decrypting secure ledger...</div>
              ) : playerHistoryData.length === 0 ? (
                <div className="text-center text-gray-500 text-sm font-bold py-10">No bets recorded for this player.</div>
              ) : (
                playerHistoryData.map(bet => (
                  <div key={bet._id} className="bg-[#02070b]/50 border border-blue-900/30 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-blue-100 font-bold text-sm uppercase block">{bet.betTarget.replace('_', ' ')}</span>
                      <span className="text-blue-500/50 text-[10px]">{new Date(bet.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-400 text-xs">Bet: ₹{bet.amount}</span>
                      {bet.payoutStatus === 'WON' ? (
                        <span className="text-emerald-400 font-black text-sm">+₹{bet.payoutAmount}</span>
                      ) : bet.payoutStatus === 'LOST' ? (
                        <span className="text-rose-500 font-black text-sm">-₹{bet.amount}</span>
                      ) : (
                        <span className="text-amber-500 font-black text-sm">PENDING</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;