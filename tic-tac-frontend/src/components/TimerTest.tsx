"use client";

import { useState, useEffect } from 'react';
import { useGameTimer } from '@/hooks/useGameTimer';
import { GAME_STATUS } from '@/config/constants';

export function TimerTest() {
  const [testEpoch] = useState(Math.floor(Date.now() / 1000) - 1800); // 30 minutes ago
  
  const { formattedTime, timeRemaining, currentBlockchainTime } = useGameTimer({
    gameStatus: GAME_STATUS.ACTIVE,
    lastMoveEpoch: testEpoch,
  });
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-black rounded-lg p-4 shadow-lg">
      <h3 className="font-bold mb-2">Timer Test</h3>
      <div className="text-sm space-y-1">
        <div>Current Time: {currentTime}</div>
        <div>Test Epoch: {testEpoch}</div>
        <div>Current Epoch: {currentBlockchainTime}</div>
        <div>Time Elapsed: {currentBlockchainTime - testEpoch}s</div>
        <div className="font-bold text-lg">Timer: {formattedTime}</div>
        <div>Remaining: {timeRemaining}s</div>
      </div>
    </div>
  );
}