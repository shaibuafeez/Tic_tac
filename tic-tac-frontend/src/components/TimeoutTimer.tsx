'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeoutTimerProps {
  lastMoveEpoch: number;
  currentEpoch: number;
  isOpponentTurn: boolean;
  onTimeoutReached?: () => void;
}

const TIMEOUT_EPOCHS = 60; // 1 hour

export function TimeoutTimer({ 
  lastMoveEpoch, 
  currentEpoch, 
  isOpponentTurn,
  onTimeoutReached 
}: TimeoutTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canClaimVictory, setCanClaimVictory] = useState(false);

  useEffect(() => {
    const epochsPassed = currentEpoch - lastMoveEpoch;
    const epochsRemaining = Math.max(0, TIMEOUT_EPOCHS - epochsPassed);
    setTimeRemaining(epochsRemaining);
    
    const isTimeout = epochsPassed >= TIMEOUT_EPOCHS;
    setCanClaimVictory(isTimeout && isOpponentTurn);
    
    if (isTimeout && isOpponentTurn && onTimeoutReached) {
      onTimeoutReached();
    }
  }, [lastMoveEpoch, currentEpoch, isOpponentTurn, onTimeoutReached]);

  // Convert epochs to human readable time (assuming 1 epoch ≈ 1 minute)
  const formatTime = (epochs: number) => {
    const minutes = epochs;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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