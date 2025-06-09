"use client";

import { useState, useEffect } from "react";
import { GameState } from "./TicTacToeGame";
import { getUserGames } from "@/utils/game-queries";
import { useSuiClient } from "@mysten/dapp-kit";
import {
  Trophy,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  AlertCircle,
} from "lucide-react";
import { GAME_STATUS, GAME_MODE } from "@/config/constants";
import { AddressDisplay } from "./AddressDisplay";

interface MyGamesProps {
  currentPlayer: string;
  onSelectGame: (game: GameState) => void;
  onBack: () => void;
}

export function MyGames({ currentPlayer, onSelectGame, onBack }: MyGamesProps) {
  const [games, setGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const suiClient = useSuiClient();

  useEffect(() => {
    loadUserGames();
  }, [currentPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserGames = async () => {
    setIsLoading(true);
    try {
      const userGames = await getUserGames(suiClient, currentPlayer);
      setGames(userGames);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGames = games.filter((game) => {
    if (filter === "all") return true;
    if (filter === "active")
      return (
        game.status === GAME_STATUS.WAITING ||
        game.status === GAME_STATUS.ACTIVE
      );
    if (filter === "completed") return game.status === GAME_STATUS.COMPLETED;
    return true;
  });

  const getGameStatusIcon = (status: number) => {
    switch (status) {
      case GAME_STATUS.WAITING:
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case GAME_STATUS.ACTIVE:
        return <Play className="w-4 h-4 text-blue-600" />;
      case GAME_STATUS.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case GAME_STATUS.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getGameStatusText = (game: GameState) => {
    switch (game.status) {
      case GAME_STATUS.WAITING:
        return "Waiting for opponent";
      case GAME_STATUS.ACTIVE:
        const isMyTurn =
          (game.turn % 2 === 0 && game.x === currentPlayer) ||
          (game.turn % 2 === 1 && game.o === currentPlayer);
        return isMyTurn ? "Your turn" : "Opponent's turn";
      case GAME_STATUS.COMPLETED:
        if (game.winner === currentPlayer) return "You won!";
        if (game.winner && game.winner !== currentPlayer) return "You lost";
        return "Draw";
      case GAME_STATUS.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(2);
  };


  if (isLoading) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 md:p-8 max-w-2xl w-full animate-fade-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spinner" />
          <span className="text-sm sm:text-base">Loading your games...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 md:p-8 max-w-2xl w-full animate-fade-in mx-4 sm:mx-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">My Games</h2>
        <p className="text-sm sm:text-base text-black">Continue playing or view your game history</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            filter === "all"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          All ({games.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            filter === "active"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          Active (
          {
            games.filter(
              (g) =>
                g.status === GAME_STATUS.WAITING ||
                g.status === GAME_STATUS.ACTIVE
            ).length
          }
          )
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            filter === "completed"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          Completed (
          {games.filter((g) => g.status === GAME_STATUS.COMPLETED).length})
        </button>
      </div>

      {/* Games List */}
      <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
        {filteredGames.length === 0 ? (
          <div className="text-center py-8 text-black">
            No games found. Start a new game to see it here!
          </div>
        ) : (
          filteredGames.map((game) => {
            const isWaitingWithStake =
              game.status === GAME_STATUS.WAITING &&
              game.mode === GAME_MODE.COMPETITIVE &&
              game.stakeAmount > 0 &&
              game.creator === currentPlayer;

            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left group hover:shadow-md ${
                  isWaitingWithStake
                    ? "border-yellow-400 bg-yellow-50 hover:border-yellow-600"
                    : "border-black hover:border-black"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {game.mode === GAME_MODE.COMPETITIVE ? (
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="font-semibold text-black">
                        {game.mode === GAME_MODE.COMPETITIVE
                          ? "Competitive"
                          : "Friendly"}{" "}
                        Game
                      </span>
                      {getGameStatusIcon(game.status)}
                    </div>

                    <div className="text-sm text-black space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          vs{" "}
                          {game.x === currentPlayer ? (
                            game.o ? (
                              <AddressDisplay address={game.o} />
                            ) : (
                              "Waiting..."
                            )
                          ) : (
                            <AddressDisplay address={game.x} />
                          )}
                        </span>
                        {game.mode === GAME_MODE.COMPETITIVE &&
                          game.stakeAmount > 0 && (
                            <span className="font-medium">
                              Stake: {formatSUI(game.stakeAmount)} SUI
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            game.status === GAME_STATUS.COMPLETED &&
                            game.winner === currentPlayer
                              ? "text-green-600"
                              : game.status === GAME_STATUS.COMPLETED &&
                                game.winner &&
                                game.winner !== currentPlayer
                              ? "text-red-600"
                              : game.status === GAME_STATUS.ACTIVE
                              ? "text-blue-600"
                              : "text-black"
                          }`}
                        >
                          {getGameStatusText(game)}
                        </span>
                      </div>
                      {isWaitingWithStake && (
                        <div className="flex items-center gap-2 text-yellow-700 mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Your {formatSUI(game.stakeAmount)} SUI is staked -
                            share link to get opponent!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <span className="text-sm text-black group-hover:text-white transition-colors">
                      {game.status === GAME_STATUS.COMPLETED
                        ? "View"
                        : "Continue"}{" "}
                      →
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 border-2 border-black rounded-lg text-black hover:border-black hover:bg-black hover:text-white transition-all duration-200"
      >
        Back to Main Menu
      </button>
    </div>
  );
}
