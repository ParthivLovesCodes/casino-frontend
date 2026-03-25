import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import BettingGrid from './components/BettingGrid';
import ActionDock from './components/ActionDock';
import RealisticDiceJar from './components/RealisticDiceJar';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import confetti from 'canvas-confetti';
import { useRef } from 'react';
import PlayerHistory from './components/PlayerHistory';
import BankingModal from './components/BankingModal';

// Placeholder for Past Results Bar from image (Top feed)
const PastResultsFeed = ({ results }) => (
  <div className="w-full overflow-x-auto whitespace-nowrap bg-black/40 p-2 rounded-t-lg shadow-inner flex gap-2 border border-green-900 border-b-0 h-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    {results.map((res, index) => (
      <div key={index} className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-green-950 to-green-900 rounded-full border border-green-800 flex flex-col items-center justify-center shadow-lg relative">
        <div className="flex gap-0.5 scale-75">
          <div className="w-4 h-4 bg-white rounded-sm text-black flex items-center justify-center text-[10px] font-bold border border-gray-300 shadow-sm">{res.dice1}</div>
          <div className="w-4 h-4 bg-white rounded-sm text-black flex items-center justify-center text-[10px] font-bold border border-gray-300 shadow-sm">{res.dice2}</div>
        </div>
        <span className={`text-sm font-black absolute bottom-1 ${res.total === 7 ? 'text-blue-400' : (res.total > 7 ? 'text-red-400' : 'text-green-400')}`}>{res.total}</span>
      </div>
    ))}
  </div>
);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);

const audioCache = {
  'chip.mp3': new Audio('/sounds/chip.mp3'),
  'win.mp3': new Audio('/sounds/win.mp3'),
  'roll.mp3': new Audio('/sounds/roll.mp3')
};

// Set volumes so they are balanced
Object.values(audioCache).forEach(audio => audio.volume = 0.6);

const playSound = (soundName) => {
  const sound = audioCache[soundName];
  if (!sound) return;

  // Reset to start so it can play rapidly (like multiple chips)
  sound.currentTime = 0; 
  
  const playPromise = sound.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.warn(`🔇 Browser blocked ${soundName}. (Waiting for user click)`, error);
    });
  }
};

const MULTIPLIERS = {
  'DOWN': 2, 'UP': 2, 'LUCKY_7': 5,
  'NUM_2': 26, 'NUM_3': 12, 'NUM_4': 8, 'NUM_5': 6, 'NUM_6': 4.5,
  'NUM_8': 4.5, 'NUM_9': 6, 'NUM_10': 8, 'NUM_11': 12, 'NUM_12': 26
};
function App() {
  const [gameState, setGameState] = useState('BETTING');
  const [timeLeft, setTimeLeft] = useState(15);
  const [rollResult, setRollResult] = useState({ dice1: 1, dice2: 2, total: 3 });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [selectedChip, setSelectedChip] = useState(200);
  const [bets, setBets] = useState({});
  const [winMessage, setWinMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showBanking, setShowBanking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [savedBets, setSavedBets] = useState({});
  const [globalPool, setGlobalPool] = useState({});
  // Mock past results feed
  const [pastResults, setPastResults] = useState([
    { dice1: 4, dice2: 2, total: 6 },
    { dice1: 1, dice2: 6, total: 7 },
    { dice1: 3, dice2: 5, total: 8 },
    { dice1: 4, dice2: 4, total: 8 },
    { dice1: 1, dice2: 2, total: 3 },
    { dice1: 6, dice2: 5, total: 11 },
    { dice1: 4, dice2: 3, total: 7 },
    { dice1: 2, dice2: 6, total: 8 },
    { dice1: 1, dice2: 1, total: 2 },
  ]);

  const betsRef = useRef(bets);
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);

  // --- FAKE MULTIPLAYER BET SIMULATOR (MAIN BLOCKS ONLY) ---
// --- FAKE MULTIPLAYER BET SIMULATOR (WEIGHTED FOR REALISM) ---
useEffect(() => {
  let betInterval;

  if (gameState === 'BETTING') {
    betInterval = setInterval(() => {
      
      // WEIGHTED TARGETS: 
      // 4 chances for DOWN, 4 chances for UP, only 1 chance for LUCKY_7
      // This means ~88% of the money will flow to the sides, and ~12% to the middle.
      const targets = [
        'DOWN', 'DOWN', 'DOWN', 'DOWN', 
        'UP', 'UP', 'UP', 'UP', 
        'LUCKY_7'
      ];
      
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      
      // Amounts remain the same, but they will stack up much faster on UP/DOWN
      const amounts = [50, 100, 200, 500, 1000, 2500];
      const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];

      setGlobalPool(prev => ({
        ...prev,
        [randomTarget]: (prev[randomTarget] || 0) + randomAmount
      }));
      
    }, 500); // Firing slightly faster (500ms) to keep the main pools growing quickly
  }

  // Clear interval when state changes
  return () => clearInterval(betInterval);
}, [gameState]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      // Left Cannon
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#22c55e', '#eab308', '#ffffff'] });
      // Right Cannon
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#22c55e', '#eab308', '#ffffff'] });

      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('casinoToken');
      
      // If they don't have a token, stop loading and let them log in normally
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        // Ask the server who this token belongs to
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData); // Auto-login successful!
        } else {
          // Token is expired or invalid. Destroy it.
          localStorage.removeItem('casinoToken');
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoadingAuth(false); // Done loading, reveal the screen!
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🟢 Connected to Game Server!');
    });

    socket.on('timerTick', (data) => {
      setGameState(data.status);
      setTimeLeft(data.timeLeft);
    });

    socket.on('gameStatus', (data) => {
      setGameState(data.status);
      setTimeLeft(data.timeLeft);
      
      // 1. Update the dice and history
      if (data.result) {
        setRollResult(data.result);
      }

      // 2. --- THE WIN DETECTOR ---
      if (data.status === 'RESOLVED' && data.result) {

        setPastResults(prev => [data.result, ...prev.slice(0, 15)]);
        const myBets = betsRef.current;
        const { total } = data.result;
        let wonAmount = 0;

        // --- UPDATED: Check ALL bets including Exact Numbers ---
        if (myBets['DOWN'] && total < 7) wonAmount += (myBets['DOWN'] * MULTIPLIERS['DOWN']);
        if (myBets['UP'] && total > 7) wonAmount += (myBets['UP'] * MULTIPLIERS['UP']);
        if (myBets['LUCKY_7'] && total === 7) wonAmount += (myBets['LUCKY_7'] * MULTIPLIERS['LUCKY_7']);
        
        // This single magic line checks for exact number wins!
        if (myBets[`NUM_${total}`]) wonAmount += (myBets[`NUM_${total}`] * MULTIPLIERS[`NUM_${total}`]);

        // If they won money, trigger the celebration!
        if (wonAmount > 0) {
          playSound('win.mp3');
          fireConfetti(); // 🎊 BOOM!
          setWinMessage(`+₹${wonAmount}`); // Show the popup
          
          // Secretly update their visual wallet so the number goes up!
          setCurrentUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance + wonAmount } : null);
        }
      }
      
      // 3. --- NEW ROUND RESET ---
      if (data.status === 'BETTING' && data.timeLeft === 15) {
        setBets({});    
        setGlobalPool({});       // Clear the chips from the board
        setWinMessage(null);   // Hide the winning banner
      }
    });

    // Cleanup listeners if the component unmounts
    return () => {
      socket.off('connect');
      socket.off('timerTick');
      socket.off('gameStatus');
    };
  }, []);

const handlePlaceBet = async (betTarget) => {
    // 1. Check if the timer allows betting
    if (gameState !== 'BETTING') return;

    // 2. Grab the player's digital badge
    const token = localStorage.getItem('casinoToken');

    try {
      // 3. Send the bet to the secure backend
      const response = await fetch(`${BACKEND_URL}/api/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          betTarget: betTarget,
          amount: selectedChip
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If the server rejects the bet (e.g., insufficient funds), throw an error
        throw new Error(data.error);
      }

      // 4. IF SUCCESSFUL: Update the visual chips on the board
      setBets((prevBets) => {
        const currentAmount = prevBets[betTarget] || 0;
        return {
          ...prevBets,
          [betTarget]: currentAmount + selectedChip
        };
      });
      playSound('chip.mp3');

      // 5. Update the player's wallet balance in React!
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: data.newBalance
      }));

    } catch (error) {
      console.error("Bet rejected:", error.message);
      // Optional: You can replace this with a nice custom toast notification later!
      alert(`⚠️ ${error.message}`); 
    }
  };

  const handleDoubleBets = () => {
    if (gameState !== 'BETTING') return;
    if (totalBetAmount === 0) return; // Nothing to double!
    
    // Check if they have enough money to double their current bet
    if (currentUser.walletBalance < totalBetAmount) {
      // Assuming you have a showMessage or toast function, or just alert:
      alert("Insufficient balance to double your bets!"); 
      return;
    }

    // Multiply every active bet by 2
    const doubledBets = { ...bets };
    for (const target in doubledBets) {
      doubledBets[target] *= 2;
    }
    
    setBets(doubledBets);
    // Deduct the *additional* amount from their wallet
    setCurrentUser(prev => ({ ...prev, walletBalance: prev.walletBalance - totalBetAmount }));
  };
 // 1. Dedicated useEffect for the Rolling Sound
useEffect(() => {
  const rollSound = audioCache['roll.mp3']; // Grab the sound you already loaded

  if (gameState === 'ROLLING') {
    if (rollSound) {
      rollSound.loop = true; // Make it loop
      // Use your existing safe play mechanism, or play directly catching errors
      const playPromise = rollSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.warn(`🔇 Roll sound blocked`, error));
      }
    }
  }

  // The Cleanup Function: Kills the sound when state changes
  return () => {
    if (rollSound) {
      rollSound.pause();
      rollSound.currentTime = 0; 
    }
  };
}, [gameState]); // Notice 'bets' is removed so it never triggers overlapping sounds!


// 2. Dedicated useEffect for Saving Bets
useEffect(() => {
  if (gameState === 'ROLLING' && Object.keys(bets).length > 0) {
    setSavedBets(bets); // Remember what they bet for the next round
  }
}, [gameState, bets]);

  // --- 3. AUTO-BET TRIGGER (Fires when a new round starts) ---
  useEffect(() => {
    if (gameState === 'BETTING' && isAuto && Object.keys(savedBets).length > 0) {
      const savedTotal = Object.values(savedBets).reduce((a, b) => a + b, 0);
      
      if (currentUser?.walletBalance >= savedTotal) {
        setBets(savedBets);
        setCurrentUser(prev => ({ ...prev, walletBalance: prev.walletBalance - savedTotal }));
      } else {
        alert("Insufficient balance for Auto-Bet. Auto disabled.");
        setIsAuto(false);
      }
    }
  }, [gameState]);

  const handleClearBets = () => {
    if (gameState !== 'BETTING') return;
    setBets({});
  };

  const totalBetAmount = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
  
  if (isLoadingAuth) {
    return (
      <div className="h-[100dvh] w-full bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-green-500 font-black tracking-widest uppercase text-sm">Entering Casino...</p>
        </div>
      </div>
    );
  }

  return (
    /* 1. THE MAIN BACKGROUND: Darkened slightly and set to center */
    <div className="h-[100dvh] w-full bg-[#080808] flex items-center justify-center overflow-hidden">
      
      {/* 2. THE PHONE SCREEN: Mobile = 100%. Desktop (sm:) = acts like a physical phone! */}
      <div className="w-full h-full max-w-[430px] sm:max-h-[850px] sm:rounded-[2.5rem] sm:border-[8px] sm:border-[#1a1a1a] flex flex-col bg-[#051c11] shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* --- SECURITY ROUTING: 3-Way Intersection --- */}
        {!currentUser ? (
          // 1. NOT LOGGED IN -> Show Login Screen
          <Login onLoginSuccess={(userData) => setCurrentUser(userData)} />
        ) : currentUser.role === 'admin' ? (
          // 2. LOGGED IN AS ADMIN -> Show Back Office
          <AdminDashboard 
            onLogout={() => {
              localStorage.removeItem('casinoToken');
              setCurrentUser(null);
            }} 
          />
        ) : (
          // 3. LOGGED IN AS PLAYER -> Show Casino Floor
          <>
            {/* --- TOP RIGHT: HAMBURGER ICON --- */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="absolute top-4 right-4 z-40 bg-black/60 p-2 rounded-lg border border-green-900/50 text-white shadow-lg backdrop-blur-sm hover:bg-green-900/40 transition-all flex flex-col gap-1 w-10 h-10 justify-center items-center"
            >
              <div className="w-5 h-0.5 bg-green-400 rounded"></div>
              <div className="w-5 h-0.5 bg-green-400 rounded"></div>
              <div className="w-5 h-0.5 bg-green-400 rounded"></div>
            </button>

            {/* --- SLIDE-OUT HAMBURGER MENU --- */}
            {isMenuOpen && (
              <>
                {/* Dark Overlay to click and close */}
                <div 
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                  onClick={() => setIsMenuOpen(false)}
                ></div>
                
                {/* The Actual Sidebar Menu */}
                <div className="absolute top-0 right-0 h-full w-64 bg-[#051c11] z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] border-l border-green-900 flex flex-col animate-slide-left">
                  
                  {/* Menu Header */}
                  <div className="p-6 border-b border-green-900/50 flex justify-between items-center bg-[#082b1c]">
                    <div className="flex flex-col">
                      <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest">VIP Player</span>
                      <span className="text-white font-black text-lg">{currentUser?.username}</span>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 text-xl font-black hover:text-white">&times;</button>
                  </div>

                  {/* Menu Links */}
                  <div className="flex-1 p-4 flex flex-col gap-3">
                    <button 
                      onClick={() => { setIsMenuOpen(false); setShowBanking(true); }}
                      className="w-full text-left bg-[#0a2e1d] hover:bg-[#0d3d26] p-4 rounded-xl border border-green-900/50 transition-all flex items-center justify-between group"
                    >
                      <span className="text-white font-bold uppercase tracking-widest text-sm">🏦 Cashier</span>
                      <span className="text-green-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                    
                    <button 
                      onClick={() => { setIsMenuOpen(false); setShowHistory(true); }}
                      className="w-full text-left bg-[#0a2e1d] hover:bg-[#0d3d26] p-4 rounded-xl border border-green-900/50 transition-all flex items-center justify-between group"
                    >
                      <span className="text-white font-bold uppercase tracking-widest text-sm">📜 Bet Ledger</span>
                      <span className="text-green-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  </div>

                  {/* Bottom Logout Button */}
                  <div className="p-4 border-t border-green-900/50">
                    <button 
                      onClick={() => { 
                        localStorage.removeItem('casinoToken'); 
                        setCurrentUser(null); 
                      }}
                      className="w-full py-3 bg-red-900/80 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest border border-red-500/50 transition-all shadow-lg"
                    >
                      Secure Logout
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* --- TOP: Past Results --- */}
            {/* Added pt-8 padding so the results feed doesn't hide behind the hamburger button */}
            <div className="shrink-0 pt-8">
              <PastResultsFeed results={pastResults} />
            </div>

            {/* --- TOP: Status Banner --- */}
              <div className="shrink-0 flex justify-between items-center bg-[#082b1c] px-4 py-2 h-auto border-b border-green-900 transition-all duration-300">
                
                {/* Left Side: Main Status */}
                <div className="flex flex-col">
                  <span className="text-green-500 text-[10px] font-bold tracking-widest uppercase leading-tight mb-0.5">Status</span>
                  <span className={`text-sm font-black uppercase leading-tight tracking-wider ${gameState === 'BETTING' ? 'text-green-400' : 'text-rose-500'}`}>
                    {gameState === 'BETTING' ? 'PLACE YOUR BETS' : 'BETS CLOSED'}
                  </span>
                </div>
                
                {/* Right Side: Dynamic Information Panel */}
                <div className="flex flex-col items-end min-w-[80px]">
                  {gameState === 'BETTING' ? (
                    // 1. Betting Phase: Show the Countdown
                    <>
                      <span className="text-green-500 text-[10px] font-bold tracking-widest uppercase leading-tight mb-0.5">Time Left</span>
                      <span className={`text-xl font-black leading-tight tracking-widest ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                      </span>
                    </>
                  ) : gameState === 'ROLLING' ? (
                    // 2. Rolling Phase: Show an animated rolling indicator
                    <>
                      <span className="text-yellow-500 text-[10px] font-bold tracking-widest uppercase leading-tight mb-0.5">Action</span>
                      <span className="text-xl font-black leading-tight tracking-widest text-yellow-400 animate-pulse">
                        ROLLING
                      </span>
                    </>
                  ) : (
                    // 3. Result Phase: Show a payout or resolving indicator
                    <>
                      <span className="text-blue-500 text-[10px] font-bold tracking-widest uppercase leading-tight mb-0.5">Result</span>
                      <span className="text-xl font-black leading-tight tracking-widest text-blue-400">
                        PAYOUT
                      </span>
                    </>
                  )}
                </div>

              </div>

            {/* --- MIDDLE TOP: Dice Jar --- */}
            {/* UPDATED: min-h-[150px] changed to min-h-[60px] to fix laptop bottom-cutoff */}
            <div className="flex-1 w-full flex justify-center items-center overflow-visible z-10 min-h-[60px] relative">
              <RealisticDiceJar 
                dice1={rollResult?.dice1 || 3} 
                dice2={rollResult?.dice2 || 4} 
                isRolling={gameState === 'ROLLING'} 
                scale={0.75} 
              />
            </div>

            {/* --- WINNER BANNER --- */}
            {winMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce pointer-events-none">
                <div className="bg-gradient-to-r from-green-600 to-yellow-500 p-1 rounded-xl shadow-[0_0_60px_rgba(250,204,21,0.6)]">
                  <div className="bg-[#051c11] px-10 py-5 rounded-lg flex flex-col items-center">
                    <span className="text-yellow-400 font-black tracking-widest uppercase text-sm mb-1 drop-shadow-md">Winner!</span>
                    <span className="text-white font-black text-5xl drop-shadow-lg">{winMessage}</span>
                  </div>
                </div>
              </div>
            )}

            {/* --- MIDDLE BOTTOM: Betting Grid --- */}
            <div className="shrink-0 w-full flex flex-col bg-[#051c11]">
              <BettingGrid 
                bets={bets} 
                globalPool={globalPool}
                onPlaceBet={handlePlaceBet} 
                isLocked={gameState !== 'BETTING'} // <--- UPDATED: Pass the lock state to the grid!
              />
            </div>

            {/* --- BOTTOM: Action Dock --- */}
            <div className="shrink-0 bg-[#092b1a] border-t border-green-900 z-20">
              <ActionDock 
                selectedChip={selectedChip} 
                setSelectedChip={setSelectedChip}
                totalBetAmount={totalBetAmount}
                onClearBets={handleClearBets}
                currentBalance={currentUser?.walletBalance || 0}
                onDoubleBets={handleDoubleBets}
                isAuto={isAuto}
                onToggleAuto={() => setIsAuto(!isAuto)}
              />
            </div>

            {/* --- POPUP MODALS --- */}
            {showHistory && (
              <PlayerHistory onClose={() => setShowHistory(false)} />
            )}
            
            {showBanking && (
              <BankingModal 
                currentBalance={currentUser?.walletBalance || 0} 
                setCurrentUser={setCurrentUser}
                onClose={() => setShowBanking(false)} 
              />
            )}
          </>
        )}

      </div>
    </div>
  )};
export default App;