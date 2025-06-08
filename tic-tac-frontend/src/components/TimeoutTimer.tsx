'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeoutTimerProps {
  lastMoveMs: number; // Last move timestamp in milliseconds
  isOpponentTurn: boolean;
  onTimeoutReached?: () => void;
}

const TIMEOUT_MS = 900000; // 15 minutes in milliseconds

export function TimeoutTimer({ 
  lastMoveMs, 
  isOpponentTurn,
  onTimeoutReached 
}: TimeoutTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canClaimVictory, setCanClaimVictory] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const currentMs = Date.now();
      const elapsedMs = currentMs - lastMoveMs;
      const remainingMs = Math.max(0, TIMEOUT_MS - elapsedMs);
      setTimeRemaining(remainingMs);
      
      const isTimeout = elapsedMs >= TIMEOUT_MS;
      setCanClaimVictory(isTimeout && isOpponentTurn);
      
      if (isTimeout && isOpponentTurn && onTimeoutReached) {
        onTimeoutReached();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastMoveMs, isOpponentTurn, onTimeoutReached]);

  // Convert milliseconds to human readable time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpponentTurn) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${
      canClaimVictory ? 'text-red-600 font-semibold' : 
      timeRemaining < 10 ? 'text-orange-600' : 
      'text-black'
    }`}>
      {canClaimVictory ? (
        <>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Opponent timed out! Claim your victory!</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4" />
          <span>Time remaining: {formatTime(timeRemaining)}</span>
        </>
      )}
    </div>
  );
}