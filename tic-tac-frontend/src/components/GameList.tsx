"use client";

import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Grid3x3, Loader2, RefreshCw, Trophy, Users } from "lucide-react";
import { GAME_STATUS, GAME_MODE } from "@/config/constants";
import { getAllActiveGames } from "@/utils/game-queries";
import { GameState } from "./TicTacToeGame";

interface GameListProps {
  onSelectGame: (game: GameState) => void;
  currentPlayer: string;
}

export function GameList({ onSelectGame, currentPlayer }: GameListProps) {
  const [games, setGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const suiClient = useSuiClient();

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const activeGames = await getAllActiveGames(suiClient);
      // Filter out games where current player is already a participant
      const availableGames = activeGames.filter(
        (game) => game.x !== currentPlayer && game.o !== currentPlayer
      );
      setGames(availableGames);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [currentPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const truncateAddress = (address: string) => {
    if (address.includes("...")) return address; // Already truncated
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getGameStatus = (game: GameState) => {
    if (game.status === GAME_STATUS.WAITING) {
      return "Waiting for player";
    }
    return game.status === GAME_STATUS.ACTIVE ? "In progress" : "Completed";
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading games...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Grid3x3 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Browse Active Games
        </h2>
        <p className="text-black">Join a game waiting for an opponent</p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={fetchGames}
          className="p-2 text-black hover:text-white hover:bg-black rounded-lg transition-colors border border-black"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8 text-black">
          <p>No games waiting for players</p>
          <p className="text-sm mt-2">Create a new game or check back later</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="w-full p-4 border-2 border-black rounded-lg hover:border-black hover:bg-black hover:text-white transition-all duration-200 text-left hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {game.mode === GAME_MODE.COMPETITIVE ? (
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="font-semibold">
                    {game.mode === GAME_MODE.COMPETITIVE
                      ? "Competitive"
                      : "Friendly"}
                  </span>
                  {game.mode === GAME_MODE.COMPETITIVE &&
                    game.stakeAmount > 0 && (
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                        {(game.stakeAmount / 1_000_000_000).toFixed(2)} SUI
                      </span>
                    )}
                </div>
                <span className="text-xs text-black">
                  {getGameStatus(game)}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-black">Created by:</span>
                  <span className="font-mono text-black">
                    {truncateAddress(game.creator)}
                  </span>
                </div>
                {game.status === GAME_STATUS.WAITING && (
                  <div className="mt-2 text-green-600 font-medium">
                    → Join this game
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
