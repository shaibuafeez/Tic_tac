"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { getUserGames } from "@/utils/game-queries";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { GAME_STATUS } from "@/config/constants";
import { useRouter } from "next/navigation";

export function NotificationBadge() {
  const [pendingMoves, setPendingMoves] = useState(0);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const router = useRouter();

  const checkPendingMoves = useCallback(async () => {
    if (!account) return;

    try {
      const games = await getUserGames(suiClient, account.address);

      // Count games where it's your turn
      const pendingCount = games.filter((game) => {
        if (game.status !== GAME_STATUS.ACTIVE) return false;

        const isPlayerX = game.x === account.address;
        const isPlayerO = game.o === account.address;
        const isXTurn = game.turn % 2 === 0;

        return (isPlayerX && isXTurn) || (isPlayerO && !isXTurn);
      }).length;

      setPendingMoves(pendingCount);
    } catch (error) {
      console.error("Error checking pending moves:", error);
    }
  }, [account, suiClient]);

  useEffect(() => {
    if (account) {
      checkPendingMoves();
      // Check every 30 seconds
      const interval = setInterval(checkPendingMoves, 30000);
      return () => clearInterval(interval);
    }
  }, [account, checkPendingMoves]);

  const handleClick = () => {
    router.push("/pending");
  };

  if (!account || pendingMoves === 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-black hover:text-white rounded-lg transition-colors"
      title={`You have ${pendingMoves} game${
        pendingMoves > 1 ? "s" : ""
      } waiting for your move`}
    >
      <Bell className="w-6 h-6 text-black" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        {pendingMoves}
      </span>
    </button>
  );
}
