"use client";

import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Eye, RefreshCw, Trophy, Users, Loader2 } from "lucide-react";
import {
  GAME_CONSTANTS,
  GAME_MODE,
  GAME_STATUS,
  UI_CONFIG,
} from "@/config/constants";

interface GameViewerProps {
  gameId: string;
}

interface GameData {
  board: number[];
  turn: number;
  x: string;
  o: string;
  mode: number;
  status: number;
  stakeAmount: number;
  winner: string;
}

export function GameViewer({ gameId }: GameViewerProps) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const suiClient = useSuiClient();

  const fetchGameData = async () => {
    try {
      // Check if this is a demo game
      if (gameId.startsWith("demo-game-")) {
        setError(
          "This is a demo game that cannot be viewed by others. Please create a new competitive game to get a shareable viewer link."
        );
        return;
      }

      const object = await suiClient.getObject({
        id: gameId,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        setError("Game not found");
        return;
      }

      // Parse game data from the actual Move object
      const content = object.data.content;
      if (!content || !("fields" in content)) {
        setError("Invalid game data format");
        return;
      }

      const fields = content.fields as Record<string, unknown>;
      console.log("Viewer - Game fields from blockchain:", fields);

      // Parse the board array properly
      let board = Array(9).fill(0);
      if (fields.board && Array.isArray(fields.board)) {
        board = fields.board.map((cell) => Number(cell));
      }

      const gameData: GameData = {
        board,
        turn: Number(fields.turn) || 0,
        x: String(fields.x) || "",
        o: String(fields.o) || "",
        mode:
          fields.mode !== undefined
            ? Number(fields.mode)
            : GAME_MODE.COMPETITIVE,
        status:
          fields.status !== undefined
            ? Number(fields.status)
            : GAME_STATUS.WAITING,
        stakeAmount: Number(fields.stake_amount) || 0,
        winner: String(fields.winner) || "",
      };

      console.log("Viewer - Parsed game data:", gameData);

      setGameData(gameData);
      setError(null);
    } catch (err) {
      console.error("Error fetching game:", err);
      setError("Failed to load game data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();

    // Auto-refresh every 5 seconds if enabled and game is active
    const interval = setInterval(() => {
      if (autoRefresh && gameData?.status === GAME_STATUS.ACTIVE) {
        fetchGameData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, autoRefresh, gameData?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const truncateAddress = (address: string) => {
    if (address.includes("...")) return address;
    return `${address.slice(0, UI_CONFIG.TRUNCATE_START)}...${address.slice(
      -UI_CONFIG.TRUNCATE_END
    )}`;
  };

  const getCellContent = (value: number) => {
    if (value === GAME_CONSTANTS.MARK_X) return "X";
    if (value === GAME_CONSTANTS.MARK_O) return "O";
    return "";
  };

  const getCellColor = (value: number) => {
    if (value === GAME_CONSTANTS.MARK_X) return "text-black";
    if (value === GAME_CONSTANTS.MARK_O) return "text-black";
    return "text-black";
  };

  const checkWinner = (board: number[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === GAME_CONSTANTS.MARK_X ? gameData?.x : gameData?.o;
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-black">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white border-2 border-red-300 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-black mb-4">{error || "Failed to load game"}</p>
          <button
            onClick={fetchGameData}
            className="px-4 py-2 bg-black text-white rounded hover:bg-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const winner = checkWinner(gameData.board);
  const gameOver = winner || gameData.status === GAME_STATUS.COMPLETED;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Spectator Mode</h1>
          </div>
          <p className="text-black">You are watching this game live</p>
        </div>

        {/* Game Container */}
        <div className="bg-white border-2 border-black rounded-lg p-8">
          {/* Game Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                {gameData.mode === GAME_MODE.COMPETITIVE ? (
                  <Trophy className="w-6 h-6" />
                ) : (
                  <Users className="w-6 h-6" />
                )}
                {gameData.mode === GAME_MODE.COMPETITIVE
                  ? "Competitive Game"
                  : "Friendly Game"}
              </h2>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors border ${
                  autoRefresh
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-white text-black border-black"
                }`}
                title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              >
                <RefreshCw
                  className={`w-5 h-5 ${autoRefresh ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div
                className={`p-3 rounded-lg border ${
                  gameData.turn % 2 === 0 && !gameOver
                    ? "bg-black text-white border-black"
                    : "bg-white border-black"
                }`}
              >
                <div
                  className={`text-sm ${
                    gameData.turn % 2 === 0 && !gameOver
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  Player X
                </div>
                <div
                  className={`font-mono text-sm ${
                    gameData.turn % 2 === 0 && !gameOver
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  {truncateAddress(gameData.x)}
                </div>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  gameData.turn % 2 === 1 && !gameOver
                    ? "bg-black text-white border-black"
                    : "bg-white border-black"
                }`}
              >
                <div
                  className={`text-sm ${
                    gameData.turn % 2 === 1 && !gameOver
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  Player O
                </div>
                <div
                  className={`font-mono text-sm ${
                    gameData.turn % 2 === 1 && !gameOver
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  {truncateAddress(gameData.o)}
                </div>
              </div>
            </div>

            {/* Prize Pool */}
            {gameData.mode === GAME_MODE.COMPETITIVE &&
              gameData.stakeAmount > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-yellow-800">
                      Prize Pool
                    </span>
                    <span className="text-lg font-bold text-yellow-900">
                      {((gameData.stakeAmount * 2) / 1_000_000_000).toFixed(2)}{" "}
                      SUI
                    </span>
                  </div>
                </div>
              )}

            {/* Game Status */}
            <div className="text-center p-3 rounded-lg bg-white border border-black">
              {gameOver ? (
                winner ? (
                  <div className="flex items-center justify-center gap-2 text-black">
                    <Trophy className="w-5 h-5" />
                    <span className="font-medium">
                      Winner: Player {winner === gameData.x ? "X" : "O"}
                    </span>
                  </div>
                ) : (
                  <span className="text-black font-medium">Game Draw!</span>
                )
              ) : (
                <span className="text-black">
                  Current Turn: Player {gameData.turn % 2 === 0 ? "X" : "O"}
                </span>
              )}
            </div>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-3">
            {gameData.board.map((value, index) => (
              <div
                key={index}
                className={`
                  aspect-square border-2 border-black rounded-lg flex items-center justify-center
                  text-4xl font-bold bg-white ${getCellColor(value)}
                `}
              >
                {getCellContent(value)}
              </div>
            ))}
          </div>

          {/* Viewer Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Spectator Mode</p>
                <p>
                  You are viewing this game as a spectator. The board updates
                  automatically every 5 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
