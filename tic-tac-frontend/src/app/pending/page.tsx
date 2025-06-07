"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { getUserGames } from "@/utils/game-queries";
import { GAME_STATUS } from "@/config/constants";
import { Clock, AlertTriangle, Trophy, Users, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { GameState } from "@/components/TicTacToeGame";

interface PendingGame {
  game: GameState;
  timeRemaining: number; // in seconds
  isMyTurn: boolean;
  isUrgent: boolean; // less than 10 minutes
  isCritical: boolean; // less than 2 minutes
  opponent: string;
}

export default function PendingMovesPage() {
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const router = useRouter();
  const { t } = useLanguage();

  const loadPendingGames = useCallback(async () => {
    if (!account) return;
    
    setIsLoading(true);
    try {
      const games = await getUserGames(suiClient, account.address);
      
      const currentBlockchainTime = Math.floor(Date.now() / 1000);
      const oneHour = 3600; // 1 hour in seconds
      
      const pending: PendingGame[] = [];
      
      games.forEach((game) => {
        if (game.status !== GAME_STATUS.ACTIVE || !game.lastMoveEpoch) return;
        
        // Calculate time remaining
        const timeSinceLastMove = currentBlockchainTime - game.lastMoveEpoch;
        const timeRemaining = Math.max(0, oneHour - timeSinceLastMove);
        
        // Determine whose turn it is
        const isPlayerX = game.x === account.address;
        const isPlayerO = game.o === account.address;
        const isXTurn = game.turn % 2 === 0;
        const isMyTurn = (isPlayerX && isXTurn) || (isPlayerO && !isXTurn);
        
        // Only include games where it's either my turn OR opponent is close to timeout
        const isUrgent = timeRemaining <= 10 * 60; // 10 minutes
        const isCritical = timeRemaining <= 2 * 60; // 2 minutes
        
        if (isMyTurn || isUrgent) {
          pending.push({
            game,
            timeRemaining,
            isMyTurn,
            isUrgent,
            isCritical,
            opponent: isPlayerX ? game.o : game.x,
          });
        }
      });
      
      // Sort by urgency: my urgent games first, then opponent urgent games, then my regular turns
      pending.sort((a, b) => {
        if (a.isMyTurn && a.isUrgent && !(b.isMyTurn && b.isUrgent)) return -1;
        if (!(a.isMyTurn && a.isUrgent) && b.isMyTurn && b.isUrgent) return 1;
        if (a.isMyTurn && !b.isMyTurn) return -1;
        if (!a.isMyTurn && b.isMyTurn) return 1;
        return a.timeRemaining - b.timeRemaining;
      });
      
      setPendingGames(pending);
    } catch (error) {
      console.error("Error loading pending games:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, suiClient]);

  useEffect(() => {
    if (account) {
      loadPendingGames();
      // Update every 10 seconds
      const interval = setInterval(loadPendingGames, 10000);
      return () => clearInterval(interval);
    }
  }, [account, suiClient, loadPendingGames]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navigateToGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  const goBack = () => {
    router.back();
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Connect Wallet</h1>
          <p className="text-gray-600">Please connect your wallet to view pending moves.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-black">{t("pendingMoves")}</h1>
              <p className="text-gray-600">{t("gamesRequiringAttention")}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-black">{pendingGames.length}</div>
            <div className="text-sm text-gray-600">{t("activeGames")}</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              <span>{t("loadingPendingGames")}</span>
            </div>
          </div>
        ) : pendingGames.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">{t("noPendingMoves")}</h2>
            <p className="text-gray-500">{t("allGamesUpToDate")}</p>
          </div>
        ) : (
          /* Games List */
          <div className="space-y-4">
            {pendingGames.map((pendingGame) => {
              const { game, timeRemaining, isMyTurn, isUrgent, isCritical } = pendingGame;
              const isExpired = timeRemaining === 0;
              
              return (
                <div
                  key={game.id}
                  onClick={() => navigateToGame(game.id)}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isExpired
                      ? "bg-red-50 border-red-300 hover:border-red-400"
                      : isCritical
                      ? "bg-orange-50 border-orange-300 hover:border-orange-400"
                      : isUrgent
                      ? "bg-yellow-50 border-yellow-300 hover:border-yellow-400"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Game Info */}
                      <div className="flex items-center gap-3 mb-2">
                        {game.mode === 1 ? (
                          <Trophy className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Users className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="font-medium text-black">
                          {game.mode === 1 ? "Competitive" : "Friendly"} Game
                        </span>
                        {game.mode === 1 && game.stakeAmount > 0 && (
                          <span className="text-sm text-gray-600">
                            ({(game.stakeAmount / 1_000_000_000).toFixed(2)} SUI)
                          </span>
                        )}
                      </div>

                      {/* Opponent */}
                      <div className="text-sm text-gray-600 mb-2">
                        vs {truncateAddress(pendingGame.opponent)}
                      </div>

                      {/* Turn Status */}
                      <div className="flex items-center gap-2">
                        {isMyTurn ? (
                          <span className="text-green-700 font-medium">{t("yourTurnLabel")}</span>
                        ) : (
                          <span className="text-gray-600">{t("opponentsTurnLabel")}</span>
                        )}
                        {isUrgent && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            {t("urgent")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {isExpired ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-600" />
                        )}
                        <span
                          className={`text-lg font-mono ${
                            isExpired
                              ? "text-red-600 font-bold"
                              : isCritical
                              ? "text-orange-600 font-bold"
                              : isUrgent
                              ? "text-yellow-700 font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {isExpired ? t("expired") : formatTime(timeRemaining)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {isExpired
                          ? t("canClaimTimeoutVictory")
                          : isMyTurn
                          ? t("timeToMakeMove")
                          : t("untilYouCanClaimVictory")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}