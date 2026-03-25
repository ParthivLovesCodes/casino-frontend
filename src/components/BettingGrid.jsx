// src/components/BettingGrid.jsx
import React from 'react';

const CHIP_STYLES = {
  10: 'bg-gray-500 border-gray-300 text-white',
  50: 'bg-green-600 border-green-300 text-white',
  100: 'bg-red-600 border-red-300 text-white',
  200: 'bg-purple-600 border-purple-300 text-white',
  1000: 'bg-yellow-500 border-yellow-200 text-black',
};

const calculateChipStack = (totalAmount) => {
  let remaining = totalAmount;
  const stack = [];
  const denominations = [1000, 200, 100, 50, 10]; 

  for (const val of denominations) {
    while (remaining >= val) {
      stack.push(val);
      remaining -= val;
    }
  }
  return stack.reverse(); 
};

const VisualChip = ({ amount }) => {
  if (!amount) return null;
  
  const stack = calculateChipStack(amount);
  const displayStack = stack.slice(-6); 

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none w-8 h-8 sm:w-10 sm:h-10">
      {displayStack.map((chipVal, index) => (
        <div 
          key={index}
          className={`absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed flex items-center justify-center shadow-[0_4px_4px_rgba(0,0,0,0.5)] ${CHIP_STYLES[chipVal]}`}
          style={{
            transform: `translate(${index * 2}px, -${index * 3}px)`,
            zIndex: index
          }}
        >
          <span className="text-[10px] sm:text-xs font-bold">{chipVal === 1000 ? '1K' : chipVal}</span>
        </div>
      ))}
      
      {stack.length > 1 && (
        <div 
          className="absolute bg-black/80 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-white/20"
          style={{
            transform: `translate(-20%, -${displayStack.length * 3 + 12}px)`,
            zIndex: 100
          }}
        >
          {amount >= 1000 ? (amount/1000).toFixed(1) + 'K' : amount}
        </div>
      )}
    </div>
  );
};

const BettingGrid = ({ bets, globalPool = {}, onPlaceBet,isLocked }) => {
  const numberMultipliers = {
    2: 26, 3: 12, 4: 8, 5: 6, 6: 4.5,
    8: 4.5, 9: 6, 10: 8, 11: 12, 12: 26
  };

  return (
    // 2. 👉 Ensure this main div has 'relative' and 'overflow-hidden'
    <div className="w-full max-w-3xl mx-auto p-1.5 sm:p-2 bg-[#0d402b] rounded-lg shadow-2xl border-2 border-green-800 relative overflow-hidden">
      
      {/* 3. 👉 THE NEW LOCK OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-50 bg-[#020b07]/70 backdrop-blur-[2px] flex items-center justify-center animate-fade-in transition-all duration-300">
          <div className="bg-rose-950/90 border border-rose-500 text-rose-400 font-black tracking-widest uppercase py-3 px-8 rounded-xl shadow-[0_0_40px_rgba(225,29,72,0.4)] flex items-center gap-3 transform transition-transform duration-500 hover:scale-105">
            <span className="text-2xl">🔒</span> 
            <span className="text-lg mt-0.5">Bets Locked</span>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 h-28 sm:h-32">
        {/* DOWN */}
        <div onClick={() => !isLocked && onPlaceBet('DOWN')} className="flex-1 bg-[#1a4d2e] border-2 border-green-600 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#235e3b] transition relative overflow-hidden">
          <VisualChip amount={bets['DOWN']} />
          <h2 className="text-3xl sm:text-4xl font-black text-green-300 drop-shadow-md z-10">2-6</h2>
          <p className="text-[10px] sm:text-sm text-green-500 font-bold tracking-widest mt-0.5 z-10">1:1</p>
          <h3 className="text-4xl sm:text-5xl font-black text-green-900/40 absolute bottom-1 pointer-events-none">DOWN</h3>
          {globalPool['DOWN'] > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-medium z-10">
                <span>👥</span>
                {/* Quick formatter to turn 1500 into 1.5k */}
                <span>{globalPool['DOWN'] > 999 ? (globalPool['DOWN']/1000).toFixed(1) + 'k' : globalPool['DOWN']}</span>
              </div>
            )}
        </div>

        {/* LUCKY 7 */}
        <div onClick={() => !isLocked && onPlaceBet('LUCKY_7')} className="flex-1 bg-[#0f2a4a] border-2 border-blue-500 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#153860] transition relative overflow-hidden">
          <VisualChip amount={bets['LUCKY_7']} />
          <h2 className="text-5xl sm:text-6xl font-black text-[#d4af37] drop-shadow-lg z-10" style={{ fontFamily: 'serif' }}>7</h2>
          <p className="text-[10px] sm:text-sm text-blue-300 font-bold tracking-widest mt-1 z-10">1:4</p>
          {globalPool['LUCKY_7'] > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-medium z-10">
                <span>👥</span>
                {/* Quick formatter to turn 1500 into 1.5k */}
                <span>{globalPool['LUCKY_7'] > 999 ? (globalPool['LUCKY_7']/1000).toFixed(1) + 'k' : globalPool['LUCKY_7']}</span>
              </div>
            )}
        </div>

        {/* UP */}
        <div onClick={() => !isLocked && onPlaceBet('UP')} className="flex-1 bg-[#b92b27] border-2 border-red-400 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#c93b37] transition relative overflow-hidden">
          <VisualChip amount={bets['UP']} />
          <h2 className="text-3xl sm:text-4xl font-black text-[#f8e8b0] drop-shadow-md z-10">8-12</h2>
          <p className="text-[10px] sm:text-sm text-red-200 font-bold tracking-widest mt-0.5 z-10">1:1</p>
          <h3 className="text-4xl sm:text-5xl font-black text-red-900/30 absolute bottom-1 pointer-events-none">UP</h3>
          {globalPool['UP'] > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-medium z-10">
                <span>👥</span>
                {/* Quick formatter to turn 1500 into 1.5k */}
                <span>{globalPool['UP'] > 999 ? (globalPool['UP']/1000).toFixed(1) + 'k' : globalPool['UP']}</span>
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {Object.entries(numberMultipliers).map(([num, multiplier]) => (
          <div 
            key={num} 
            onClick={() => !isLocked && onPlaceBet(`NUM_${num}`)}
            className="bg-[#0b3824] border border-[#145c3d] rounded-md h-16 sm:h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-[#114b31] transition relative"
          >
            <VisualChip amount={bets[`NUM_${num}`]} />
            <h3 className="text-lg sm:text-2xl font-bold text-green-100 z-10 leading-none">{num}</h3>
            <p className="text-[9px] sm:text-xs text-green-500 font-semibold mt-0.5 sm:mt-1 z-10 leading-none">1:{multiplier}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BettingGrid;