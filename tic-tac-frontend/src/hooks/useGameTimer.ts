import { useState, useEffect } from 'react';
import { GAME_STATUS } from '@/config/constants';

interface UseGameTimerProps {
  gameStatus: number;
  lastMoveEpoch?: number; // Blockchain timestamp in milliseconds
  timeoutDuration?: number; // Duration in seconds (default 1 hour)
}

interface UseGameTimerReturn {
  timeRemaining: number; // Time remaining in seconds
  isExpired: boolean;
  isWarning: boolean; // True when less than 5 minutes remaining
  canClaimTimeout: boolean;
  formattedTime: string;
  currentBlockchainTime: number; // Current blockchain time for debugging
}

export function useGameTimer({
  gameStatus,
  lastMoveEpoch,
  timeoutDuration = 900, // 15 minutes in seconds (matching blockchain MOVE_TIMEOUT_MS / 1000)
}: UseGameTimerProps): UseGameTimerReturn {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    // Only set up interval for active games
    if (gameStatus !== GAME_STATUS.ACTIVE) {
      return;
    }

    // Log initial state
    console.log('Timer initialized:', { gameStatus, lastMoveEpoch });

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, lastMoveEpoch]);

  // Convert to blockchain epoch (seconds)
  const currentBlockchainTime = Math.floor(currentTime / 1000);

  // Calculate time remaining
  let timeRemaining = timeoutDuration; // Default to full duration
  
  if (lastMoveEpoch && lastMoveEpoch > 0) {
    // Convert lastMoveEpoch from milliseconds to seconds
    const lastMoveInSeconds = Math.floor(lastMoveEpoch / 1000);
    const timeElapsed = currentBlockchainTime - lastMoveInSeconds;
    timeRemaining = Math.max(0, timeoutDuration - timeElapsed);
    
    // Debug logging
    if (gameStatus === GAME_STATUS.ACTIVE) {
      console.log('Timer:', {
        lastMoveMs: lastMoveEpoch,
        lastMoveSec: lastMoveInSeconds,
        currentSec: currentBlockchainTime,
        elapsed: timeElapsed,
        remaining: timeRemaining,
      });
    }
  }
  
  const isExpired = timeRemaining === 0;
  const isWarning = timeRemaining > 0 && timeRemaining <= 5 * 60; // Last 5 minutes
  
  // Only allow claiming timeout if expired AND we have valid epoch data
  const canClaimTimeout = isExpired && gameStatus === GAME_STATUS.ACTIVE && !!lastMoveEpoch && lastMoveEpoch > 0;

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return {
    timeRemaining,
    isExpired,
    isWarning,
    canClaimTimeout,
    formattedTime,
    currentBlockchainTime,
  };
}