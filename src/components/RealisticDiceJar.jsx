import React, { useState, useEffect } from 'react';

// The Dot Generator
const DiceDots = ({ count, faceType }) => {
  const dotPositions = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };
  const activeDots = dotPositions[count] || [4];
  
  const isRed = [1, 2, 4].includes(count);
  const dotColor = isRed ? 'bg-[#b31b1b]' : 'bg-[#1a1a1a]';
  const shadowOpacity = faceType === 'top' ? '0.6' : '0.9';

  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 p-1.5">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <div key={index} className="flex items-center justify-center">
          {activeDots.includes(index) && (
            <div 
              className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
              style={{ boxShadow: `inset 0 1px 3px rgba(0,0,0,${shadowOpacity})` }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

// The Solid Isometric Die
const SolidDie = ({ value, isRolling, positionClass, delay }) => {
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    let interval;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayVal(Math.floor(Math.random() * 6) + 1);
      }, 80);
    } else {
      setDisplayVal(value);
    }
    return () => clearInterval(interval);
  }, [isRolling, value]);

  const leftFaceVal = (displayVal % 6) + 1;
  const rightFaceVal = ((displayVal + 2) % 6) + 1;

  return (
    <div 
      className={`locked-die ${positionClass} ${isRolling ? 'is-bouncing' : ''}`}
      style={{ animationDelay: `${delay}s`, zIndex: 10 }}
    >
      <div className="static-face face-top">
        <DiceDots count={displayVal} faceType="top" />
      </div>
      <div className="static-face face-left">
        <DiceDots count={leftFaceVal} faceType="side" />
      </div>
      <div className="static-face face-right">
        <DiceDots count={rightFaceVal} faceType="side" />
      </div>
    </div>
  );
};

// --- THE MAIN COMPONENT USING YOUR CSS ---
// --- THE MAIN COMPONENT ---
const RealisticDiceJar = ({ dice1 = 4, dice2 = 3, isRolling = false, scale = 1 }) => {
  return (
    // 2. Add the style prop here to control the size natively!
    <div 
      className="flex justify-center items-center" 
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'center' // Ensures it shrinks towards the middle, not the top left
      }}
    >
      <div className="jar-scene">
        
        <div className={`jar-dome ${isRolling ? 'jar-dome-shake' : ''}`}>
            
            {/* Your new perfect 160x60 Table */}
            <div className="jar-table"></div>

            {/* Die 1 - Lowered to sit inside the left side of the oval */}
            <SolidDie 
              value={dice1} 
              isRolling={isRolling} 
              positionClass="bottom-[15px] left-[38px]" 
              delay={0} 
            />
            
            {/* Die 2 - Lowered to sit inside the right side of the oval */}
            <SolidDie 
              value={dice2} 
              isRolling={isRolling} 
              positionClass="bottom-[25px] right-[38px]" 
              delay={0.15} 
            />
            <div className="jar-glass"></div>

            {/* Glass intentionally left out for testing! */}

          </div>
        </div>
    </div>
  );
};

export default RealisticDiceJar;
