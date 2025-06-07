import { useState, useEffect } from 'react';
import { GAME_STATUS } from '@/config/constants';

interface UseGameTimerProps {
  gameStatus: number;
  lastMoveEpoch?: number; // Blockchain epoch in seconds
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
  timeoutDuration = 3600, // 1 hour in seconds (matching blockchain MOVE_TIMEOUT_EPOCHS)
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
  }, [gameStatus]);

  // Convert to blockchain epoch (seconds)
  const currentBlockchainTime = Math.floor(currentTime / 1000);

  // Calculate time remaining using blockchain epochs (seconds)
  let timeRemaining = timeoutDuration; // Default to full duration
  
  console.log('Timer render:', {
    gameStatus,
    lastMoveEpoch,
    currentBlockchainTime,
    hasValidEpoch: lastMoveEpoch && lastMoveEpoch > 0
  });
  
  if (lastMoveEpoch && lastMoveEpoch > 0) {
    // If we have a valid lastMoveEpoch, calculate actual time remaining
    const timeElapsed = currentBlockchainTime - lastMoveEpoch;
    timeRemaining = Math.max(0, timeoutDuration - timeElapsed);
    
    console.log('Timer calculation:', {
      lastMoveEpoch,
      currentBlockchainTime,
      timeElapsed,
      timeRemaining,
      formattedTime: `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
    });
  } else {
    console.log('No valid lastMoveEpoch, showing default:', timeoutDuration);
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