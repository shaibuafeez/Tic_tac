"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { getUserGames } from "@/utils/game-queries";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { GAME_STATUS } from "@/config/constants";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

interface GameTimer {
  gameId: string;
  timeRemaining: number; // in seconds
  isMyTurn: boolean;
  opponent: string;
}

export function GlobalTimer() {
  const [urgentGame, setUrgentGame] = useState<GameTimer | null>(null);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const router = useRouter();
  const { t } = useLanguage();

  const checkGameTimers = useCallback(async () => {
    if (!account) return;

    try {
      const games = await getUserGames(suiClient, account.address);
      
      // Find games with timeout risk
      const gameTimers: GameTimer[] = [];
      const currentBlockchainTime = Math.floor(Date.now() / 1000); // Current time in seconds (blockchain epoch format)
      const oneHour = 3600; // 1 hour in seconds

      games.forEach((game) => {
        if (game.status !== GAME_STATUS.ACTIVE || !game.lastMoveEpoch) return;

        // Convert lastMoveEpoch from milliseconds to seconds
        const lastMoveInSeconds = game.lastMoveEpoch ? Math.floor(game.lastMoveEpoch / 1000) : currentBlockchainTime;
        const timeSinceLastMove = currentBlockchainTime - lastMoveInSeconds;
        const timeRemaining = Math.max(0, oneHour - timeSinceLastMove);

        // Only include games with less than 10 minutes remaining
        if (timeRemaining <= 10 * 60) { // 10 minutes in seconds
          const isPlayerX = game.x === account.address;
          const isPlayerO = game.o === account.address;
          const isXTurn = game.turn % 2 === 0;
          const isMyTurn = (isPlayerX && isXTurn) || (isPlayerO && !isXTurn);
          
          gameTimers.push({
            gameId: game.id,
            timeRemaining, // Already in seconds
            isMyTurn,
            opponent: isPlayerX ? game.o : game.x,
          });
        }
      });

      // Find the most urgent game (least time remaining)
      if (gameTimers.length > 0) {
        const mostUrgent = gameTimers.reduce((prev, current) => 
          current.timeRemaining < prev.timeRemaining ? current : prev
        );
        setUrgentGame(mostUrgent);
      } else {
        setUrgentGame(null);
      }
    } catch (error) {
      console.error("Error checking game timers:", error);
    }
  }, [account, suiClient]);

  useEffect(() => {
    if (account) {
      checkGameTimers();
      // Check every 10 seconds for urgent updates
      const interval = setInterval(checkGameTimers, 10000);
      return () => clearInterval(interval);
    }
  }, [account, checkGameTimers]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    // Navigate to pending moves page instead of specific game
    router.push('/pending');
  };

  if (!account || !urgentGame) {
    return null;
  }

  const isExpired = urgentGame.timeRemaining === 0;
  const isCritical = urgentGame.timeRemaining <= 2 * 60; // Less than 2 minutes

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
        isExpired
          ? "bg-red-100 border-red-300 text-red-800 animate-pulse"
          : isCritical
          ? "bg-orange-100 border-orange-300 text-orange-800"
          : "bg-yellow-100 border-yellow-300 text-yellow-800"
      } hover:shadow-md`}
      title={
        isExpired
          ? "⚠️ Urgent! Click to view all pending moves"
          : urgentGame.isMyTurn
          ? `🎮 Your turn - ${formatTime(urgentGame.timeRemaining)} remaining. Click to view all pending moves.`
          : `⏰ ${formatTime(urgentGame.timeRemaining)} until timeout. Click to view all pending moves.`
      }
    >
      {isExpired ? (
        <AlertTriangle className="w-4 h-4 animate-pulse" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      
      <span className="text-sm font-medium">
        {isExpired ? t("timeExpired") : formatTime(urgentGame.timeRemaining)}
      </span>

      {isExpired && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
          !
        </span>
      )}
    </button>
  );
}