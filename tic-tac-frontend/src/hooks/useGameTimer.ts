import { useState, useEffect } from 'react';
import { GAME_STATUS } from '@/config/constants';

interface UseGameTimerProps {
  gameStatus: number;
  lastMoveTime?: number; // Unix timestamp in milliseconds
  timeoutDuration?: number; // Duration in milliseconds (default 1 hour)
}

interface UseGameTimerReturn {
  timeRemaining: number; // Time remaining in seconds
  isExpired: boolean;
  isWarning: boolean; // True when less than 5 minutes remaining
  canClaimTimeout: boolean;
  formattedTime: string;
}

export function useGameTimer({
  gameStatus,
  lastMoveTime,
  timeoutDuration = 60 * 60 * 1000, // 1 hour in milliseconds
}: UseGameTimerProps): UseGameTimerReturn {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE || !lastMoveTime) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [gameStatus, lastMoveTime]);

  // Handle case where lastMoveTime might be in seconds (blockchain epoch) vs milliseconds (Date.now())
  // If lastMoveTime is from blockchain, it's in seconds, so we convert to milliseconds
  const lastMoveTimeMs = lastMoveTime || 0;
  
  const timeElapsed = lastMoveTimeMs ? currentTime - lastMoveTimeMs : 0;
  const timeRemaining = Math.max(0, timeoutDuration - timeElapsed);
  const isExpired = timeRemaining === 0;
  const isWarning = timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000; // Last 5 minutes
  
  // Only allow claiming timeout if truly expired AND enough time has passed for blockchain
  // Add a small buffer to account for blockchain vs frontend time differences
  const bufferTime = 30 * 1000; // 30 second buffer
  const canClaimTimeout = (timeRemaining <= bufferTime) && gameStatus === GAME_STATUS.ACTIVE;

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return {
    timeRemaining: Math.floor(timeRemaining / 1000), // Return in seconds
    isExpired,
    isWarning,
    canClaimTimeout,
    formattedTime,
  };
}