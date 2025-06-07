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
  const [currentBlockchainTime, setCurrentBlockchainTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE || !lastMoveEpoch) {
      return;
    }

    const interval = setInterval(() => {
      // Use current time in seconds to match blockchain epoch format
      setCurrentBlockchainTime(Math.floor(Date.now() / 1000));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [gameStatus, lastMoveEpoch]);

  // Calculate time remaining using blockchain epochs (seconds)
  const timeElapsed = lastMoveEpoch ? currentBlockchainTime - lastMoveEpoch : 0;
  const timeRemaining = Math.max(0, timeoutDuration - timeElapsed);
  const isExpired = timeRemaining === 0;
  const isWarning = timeRemaining > 0 && timeRemaining <= 5 * 60; // Last 5 minutes
  
  // Only allow claiming timeout if expired AND we have valid epoch data
  const canClaimTimeout = isExpired && gameStatus === GAME_STATUS.ACTIVE && !!lastMoveEpoch;

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