// src/components/ActionDock.jsx
import React, { useState } from 'react';

const ActionDock = ({ 
  selectedChip, 
  setSelectedChip, 
  totalBetAmount, 
  onClearBets, 
  currentBalance,
  // 👇 ADDED THE NEW PROPS HERE 👇
  onDoubleBets, 
  isAuto, 
  onToggleAuto 
}) => {
  // Track if the radial menu is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const chipValues = [10, 50, 100, 200, 1000];

  // Helper function to calculate the X and Y coordinates for the semi-circle
  const getPosition = (index, total) => {
    // Spread 5 chips from 180 degrees (left) to 0 degrees (right)
    const angle = Math.PI - (index * (Math.PI / (total - 1))); 
    const radius = 65; // Distance from the center chip
    const x = Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius; // Negative because CSS Y goes down
    return { x, y };
  };

  const handleChipSelect = (val) => {
    setSelectedChip(val);
    setIsMenuOpen(false); // Close menu after selecting
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#082b1c] p-3 rounded-lg flex flex-col gap-3 shadow-lg border-t-2 border-green-900 relative">
      
      <div className="flex justify-between items-center px-4 text-green-400 font-semibold text-sm">
        <p>Balance <span className="text-yellow-400 text-lg ml-2">{currentBalance}</span></p>
        <p>Your Bet <span className="text-yellow-400 text-lg ml-2">{totalBetAmount}</span></p>
      </div>

      <div className="flex justify-between items-center relative z-50">
        
        {/* --- WIRED UP AUTO BUTTON --- */}
        <button 
          onClick={onToggleAuto}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 ${isAuto ? 'bg-green-900/60 border-green-400 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] scale-105' : 'bg-[#0d402b] border-green-700 hover:bg-[#155e3f] text-green-300'}`}
        >
          <span className="text-lg leading-none">A</span>
          <span className="text-[10px]">auto</span>
        </button>

        {/* --- THE EXISTING RADIAL CHIP MENU (UNTOUCHED!) --- */}
        <div className="relative flex items-center justify-center">
          
          {/* The Hidden Pop-Out Chips */}
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
            {chipValues.map((val, index) => {
              const { x, y } = getPosition(index, chipValues.length);
              return (
                <div 
                  key={val}
                  onClick={() => handleChipSelect(val)}
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer border-4 border-dashed shadow-xl
                    bg-blue-800 border-blue-400 text-blue-100 hover:scale-110 hover:brightness-125 transition-transform`}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  }}
                >
                  {val === 1000 ? '1K' : val}
                </div>
              );
            })}
          </div>

          {/* The Main Center Button (Current Selected Chip) */}
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-16 h-16 bg-purple-600 rounded-full border-4 border-dashed border-white flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(147,51,234,0.8)] z-10 hover:scale-105 transition-transform"
          >
            <span className="text-white font-black text-lg">{selectedChip === 1000 ? '1K' : selectedChip}</span>
          </div>

        </div>

        <div className="flex gap-2">
          {/* --- WIRED UP DOUBLE BUTTON --- */}
          <button 
            onClick={onDoubleBets}
            className="flex flex-col items-center justify-center w-12 h-12 bg-[#0d402b] rounded-full border border-green-700 hover:bg-[#155e3f] transition-all text-green-300 active:scale-95"
          >
            <span className="text-lg font-bold leading-none">x2</span>
            <span className="text-[10px]">double</span>
          </button>
          
          {/* --- EXISTING CLEAR BUTTON --- */}
          <button 
            onClick={onClearBets}
            className="flex flex-col items-center justify-center w-12 h-12 bg-[#0d402b] rounded-full border border-green-700 hover:bg-[#155e3f] transition-all text-red-400 cursor-pointer active:scale-95"
          >
            <span className="text-lg font-bold leading-none">✕</span>
            <span className="text-[10px]">clear</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ActionDock;