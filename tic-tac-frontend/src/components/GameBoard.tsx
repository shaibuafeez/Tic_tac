"use client";

import {
  RotateCcw,
  Trophy,
  Users,
  Wifi,
  Sparkles,
  Twitter,
  Home,
  XCircle,
  Clock,
} from "lucide-react";
import { GameState } from "./TicTacToeGame";
import { GAME_CONSTANTS, GAME_STATUS } from "@/config/constants";
import { useGameSync } from "@/hooks/useGameSync";
import { useLanguage } from "@/hooks/useLanguage";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useState, useEffect, useRef } from "react";
import { AddressDisplay } from "@/components/AddressDisplay";

interface GameBoardProps {
  gameState: GameState;
  onMakeMove: (row: number, col: number) => void;
  onResetGame: () => void;
  onHome?: () => void;
  onCancelGame?: () => void;
  onClaimTimeoutVictory?: () => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function GameBoard({
  gameState: initialGameState,
  onMakeMove,
  onResetGame,
  onHome,
  onCancelGame,
  onClaimTimeoutVictory,
  isLoading,
  currentPlayer,
}: GameBoardProps) {
  const { t } = useLanguage();
  const [gameState, setGameState] = useState(initialGameState);
  const [isLive, setIsLive] = useState(false);
  const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  const prevBoardRef = useRef(initialGameState.board);
  const { board, turn, x, o } = gameState;

  // Use blockchain timestamp for accurate timer
  useEffect(() => {
    if (gameState.status === GAME_STATUS.ACTIVE && gameState.lastMoveEpoch) {
      // Convert epoch (seconds) to milliseconds for accurate timer
      const blockchainTime = gameState.lastMoveEpoch * 1000;
      setLastMoveTime(blockchainTime);
    } else if (gameState.status === GAME_STATUS.ACTIVE && !gameState.lastMoveEpoch) {
      // Fallback for local games or missing blockchain data
      if (!lastMoveTime) {
        setLastMoveTime(Date.now());
      }
    }
  }, [gameState.status, gameState.lastMoveEpoch, lastMoveTime]);

  // Use the game timer hook with blockchain epoch
  const { formattedTime, isExpired, isWarning, canClaimTimeout } = useGameTimer({
    gameStatus: gameState.status,
    lastMoveEpoch: gameState.lastMoveEpoch,
  });

  // Update local state when prop changes
  useEffect(() => {
    setGameState(initialGameState);
  }, [initialGameState]);

  // Detect new moves and winning lines
  useEffect(() => {
    // Find the last move by comparing with previous board
    const newMoveIndex = board.findIndex(
      (cell, index) =>
        cell !== prevBoardRef.current[index] &&
        cell !== GAME_CONSTANTS.MARK_EMPTY
    );

    if (newMoveIndex !== -1) {
      setLastMoveIndex(newMoveIndex);
      // Clear the animation after it plays
      setTimeout(() => setLastMoveIndex(null), 600);
    }

    prevBoardRef.current = [...board];

    // Check for winner and set winning line
    const winner = checkWinner();
    if (winner && !winningLine) {
      const line = getWinningLine();
      setWinningLine(line);

      // Show confetti for current player win
      if (winner === currentPlayer) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [board]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enable real-time sync for non-local games
  const shouldSync =
    !gameState.id.startsWith("game-") && !gameState.id.startsWith("demo-");

  useGameSync({
    gameId: shouldSync ? gameState.id : null,
    onGameUpdate: (updatedGame) => {
      setGameState(updatedGame);
      setIsLive(true);
      // Flash the live indicator
      setTimeout(() => setIsLive(false), 1000);
    },
    enabled: shouldSync && gameState.status === GAME_STATUS.ACTIVE,
    interval: 2000, // Poll every 2 seconds
  });


  const getCurrentPlayer = () => {
    return turn % 2 === 0 ? x : o;
  };

  const isCurrentPlayerTurn = () => {
    return getCurrentPlayer() === currentPlayer;
  };

  const getCellContent = (index: number) => {
    const value = board[index];
    if (value === GAME_CONSTANTS.MARK_X) return "X";
    if (value === GAME_CONSTANTS.MARK_O) return "O";
    return "";
  };

  const getCellColor = (index: number) => {
    const value = board[index];
    if (value === GAME_CONSTANTS.MARK_X) return "text-black"; // X
    if (value === GAME_CONSTANTS.MARK_O) return "text-black"; // O
    return "text-black";
  };

  const checkWinner = () => {
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

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === GAME_CONSTANTS.MARK_X ? x : o;
      }
    }

    return null;
  };

  const getWinningLine = () => {
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

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return line;
      }
    }

    return null;
  };

  const isDraw = () => {
    return (
      board.every((cell) => cell !== GAME_CONSTANTS.MARK_EMPTY) &&
      !checkWinner()
    );
  };

  const handleCellClick = (index: number) => {
    if (
      board[index] !== GAME_CONSTANTS.MARK_EMPTY ||
      !isCurrentPlayerTurn() ||
      isLoading ||
      checkWinner()
    ) {
      return;
    }

    const row = Math.floor(index / 3);
    const col = index % 3;
    onMakeMove(row, col);
  };

  const winner = checkWinner();
  const gameOver = winner || isDraw();

  const shareGameToTwitter = () => {
    const isCompetitive = gameState.mode === 1;
    const suiAmount = gameState.stakeAmount / 1_000_000_000;
    const winAmount = suiAmount * 2 * 0.9;
    const gameLink = `${window.location.origin}/game/${gameState.id}`;
    const viewerLink = `${window.location.origin}/view/${gameState.id}`;

    let message = "";
    if (gameOver) {
      if (winner) {
        if (winner === currentPlayer) {
          message =
            isCompetitive && gameState.stakeAmount > 0
              ? `🏆 Just won ${winAmount.toFixed(
                  2
                )} SUI playing Tic-Tac-Toe on @SuiNetwork!\n\n🎮 Play me next: ${gameLink}\n👀 Watch the winning game: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`
              : `🏆 Victory! Just won a game of Tic-Tac-Toe on @SuiNetwork and earned an NFT trophy!\n\n🎮 Challenge me: ${gameLink}\n👀 Watch the game: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
        } else {
          message =
            isCompetitive && gameState.stakeAmount > 0
              ? `🎮 Good game! Lost ${suiAmount.toFixed(
                  2
                )} SUI but ready for another game on @SuiNetwork!\n\n🎯 Play again: ${gameLink}\n👀 Watch the game: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`
              : `🎮 Great match! Ready for another round of Tic-Tac-Toe on @SuiNetwork!\n\n🎯 Play again: ${gameLink}\n👀 Watch: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
        }
      } else {
        message = `🤝 It's a draw! Intense Tic-Tac-Toe match on @SuiNetwork!\n\n🎮 Play again: ${gameLink}\n👀 Watch the game: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
      }
    } else {
      message =
        isCompetitive && gameState.stakeAmount > 0
          ? `🔥 Epic battle in progress! Playing for ${suiAmount.toFixed(
              2
            )} SUI on @SuiNetwork!\n\n💰 Winner takes ${winAmount.toFixed(
              2
            )} SUI\n👀 Watch live: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`
          : `🎮 Playing Tic-Tac-Toe on @SuiNetwork! Who's got the winning strategy?\n\n👀 Watch live: ${viewerLink}\n🎯 Join the fun: ${gameLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      message
    )}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-lg w-full relative animate-fade-in">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: [
                  "#ff6b6b",
                  "#4ecdc4",
                  "#45b7d1",
                  "#f7dc6f",
                  "#bb8fce",
                ][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
      {/* Game Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              {gameState.mode === 1 ? (
                <Trophy className="w-6 h-6" />
              ) : (
                <Users className="w-6 h-6" />
              )}
              {gameState.mode === 1 ? t("competitiveGame") : t("friendlyGame")}
            </h2>
            {shouldSync && (
              <div
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLive ? "text-green-600" : "text-black"
                }`}
              >
                <Wifi className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
                <span>{isLive ? t("live") : t("connected")}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {onHome && (
              <button
                onClick={onHome}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300 hover:scale-110 active:scale-95"
                title="Home"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={shareGameToTwitter}
              className="p-2 text-gray-500 hover:text-[#1DA1F2] hover:bg-blue-50 rounded-lg transition-all duration-200 border border-gray-300 hover:scale-110 active:scale-95"
              title="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={onResetGame}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300 hover:scale-110 active:scale-95"
              title="New Game"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div
            className={`p-3 rounded-lg border transition-all duration-300 ${
              currentPlayer === x
                ? "bg-black text-white border-black animate-glow"
                : "bg-white border-black"
            } ${turn % 2 === 0 && !gameOver ? "scale-105" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`text-sm ${
                  currentPlayer === x ? "text-white" : "text-black"
                }`}
              >
                {t("playerX")}
              </div>
              {turn % 2 === 0 && !gameOver && (
                <div className={`text-xs font-bold ${
                  currentPlayer === x ? "text-white" : "text-black"
                } animate-pulse`}>
                  {t("yourTurnLabel")}
                </div>
              )}
            </div>
            <div
              className={`font-mono text-sm ${
                currentPlayer === x ? "text-white" : "text-black"
              }`}
            >
              <AddressDisplay address={x} />
            </div>
            {currentPlayer === x && (
              <div className="text-xs text-white mt-1">{t("you")} ✓</div>
            )}
          </div>
          <div
            className={`p-3 rounded-lg border transition-all duration-300 ${
              currentPlayer === o
                ? "bg-black text-white border-black animate-glow"
                : "bg-white border-black"
            } ${turn % 2 === 1 && !gameOver ? "scale-105" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`text-sm ${
                  currentPlayer === o ? "text-white" : "text-black"
                }`}
              >
                {t("playerO")}
              </div>
              {turn % 2 === 1 && !gameOver && (
                <div className={`text-xs font-bold ${
                  currentPlayer === o ? "text-white" : "text-black"
                } animate-pulse`}>
                  {t("yourTurnLabel")}
                </div>
              )}
            </div>
            <div
              className={`font-mono text-sm ${
                currentPlayer === o ? "text-white" : "text-black"
              }`}
            >
              <AddressDisplay address={o} />
            </div>
            {currentPlayer === o && (
              <div className="text-xs text-white mt-1">{t("you")} ✓</div>
            )}
          </div>
        </div>

        {/* Prize Pool for Competitive Games */}
        {gameState.mode === 1 && gameState.stakeAmount > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-yellow-800">
                {t("prizePool")}
              </span>
              <span className="text-lg font-bold text-yellow-900">
                {((gameState.stakeAmount * 2) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {t("winnerTakes")}{" "}
              {((gameState.stakeAmount * 2 * 0.9) / 1_000_000_000).toFixed(2)}{" "}
              SUI (90%)
            </p>
          </div>
        )}

        {/* Timer Display for Active Games */}
        {gameState.status === GAME_STATUS.ACTIVE && (
          <div className={`mb-4 p-3 rounded-lg border transition-all duration-300 ${
            isExpired 
              ? "bg-red-50 border-red-300 animate-pulse" 
              : isWarning
              ? "bg-yellow-50 border-yellow-300"
              : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center justify-center gap-2">
              <Clock className={`w-5 h-5 ${
                isExpired ? "text-red-600 animate-pulse" : isWarning ? "text-yellow-600" : "text-gray-600"
              }`} />
              <span className={`text-sm font-medium ${
                isExpired ? "text-red-700" : isWarning ? "text-yellow-700" : "text-gray-700"
              }`}>
                {isExpired ? t("timeExpired") : t("timeRemaining")}: {formattedTime}
              </span>
            </div>
            {canClaimTimeout && (
              <p className="text-xs text-red-600 mt-1 text-center">
                {isCurrentPlayerTurn() 
                  ? t("opponentCanClaimTimeout") 
                  : t("youCanClaimTimeout")}
              </p>
            )}
          </div>
        )}

        {/* Claim Timeout Victory Button */}
        {gameState.status === GAME_STATUS.ACTIVE && 
         canClaimTimeout && 
         !isCurrentPlayerTurn() && 
         onClaimTimeoutVictory && (
          <div className="mb-4">
            <button
              onClick={onClaimTimeoutVictory}
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse text-sm sm:text-base"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("claimTimeoutVictory")}
            </button>
            <p className="text-xs text-black mt-2 text-center">
              {t("opponentHasExceededTimeLimit")}
            </p>
          </div>
        )}

        {/* Game Status */}
        <div
          className={`text-center p-3 rounded-lg border transition-all duration-300 ${
            winner && winner === currentPlayer
              ? "bg-green-50 border-green-200"
              : winner && winner !== currentPlayer
              ? "bg-red-50 border-red-200"
              : isDraw()
              ? "bg-yellow-50 border-yellow-200"
              : gameState.status === GAME_STATUS.WAITING
              ? "bg-orange-50 border-orange-200"
              : "bg-white border-black"
          }`}
        >
          {gameOver ? (
            winner ? (
              <div className="flex items-center justify-center gap-2">
                {winner === currentPlayer ? (
                  <>
                    <Sparkles className="w-5 h-5 text-green-600 animate-pulse" />
                    <span className="font-bold text-green-700">
                      {t("youWin")}
                    </span>
                    <Trophy className="w-5 h-5 text-green-600 animate-bounce" />
                  </>
                ) : (
                  <>
                    <span className="font-medium text-red-700">
                      Player {winner === x ? "X" : "O"} Wins
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-yellow-700 font-medium">{t("draw")}</span>
            )
          ) : gameState.status === GAME_STATUS.WAITING ? (
            <div>
              <span className="text-orange-800 font-medium">
                {t("waitingForOpponent")}
              </span>
              {gameState.creator === currentPlayer &&
                gameState.mode === 1 &&
                gameState.stakeAmount > 0 && (
                  <p className="text-xs text-orange-700 mt-1">
                    {(gameState.stakeAmount / 1_000_000_000).toFixed(2)} SUI
                    staked
                  </p>
                )}
            </div>
          ) : (
            <span className="text-black">
              {isCurrentPlayerTurn() ? (
                <span className="font-medium animate-pulse">
                  {t("yourTurnLabel")}
                </span>
              ) : (
                t("opponentTurn")
              )}
            </span>
          )}
        </div>

      </div>

      {/* Cancel Button for Waiting Games */}
      {gameState.status === GAME_STATUS.WAITING &&
        gameState.creator === currentPlayer &&
        onCancelGame && (
          <div className="mb-6">
            <button
              onClick={onCancelGame}
              disabled={isLoading}
              className="w-full py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              {t("cancelGame")}{" "}
              {gameState.mode === 1 &&
                gameState.stakeAmount > 0 &&
                `(${t("getSuiBack")}: ${(
                  gameState.stakeAmount / 1_000_000_000
                ).toFixed(2)} SUI)`}
            </button>
            <p className="text-xs text-black mt-2 text-center">
              {t("cancelGameDescription")}
            </p>
          </div>
        )}

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {board.map((_, index) => {
          const isWinningCell = winningLine?.includes(index);
          const isLastMove = lastMoveIndex === index;
          const isEmpty = board[index] === GAME_CONSTANTS.MARK_EMPTY;
          const canPlay =
            isEmpty && isCurrentPlayerTurn() && !gameOver && !isLoading;

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={
                isLoading || !isEmpty || !isCurrentPlayerTurn() || !!gameOver
              }
              className={`
                aspect-square border-2 border-black rounded-lg flex items-center justify-center
                text-4xl font-bold transition-all duration-200 relative overflow-hidden
                ${
                  canPlay
                    ? "game-cell hover:bg-white hover:border-black cursor-pointer hover:scale-105"
                    : "cursor-not-allowed"
                }
                ${getCellColor(index)}
                ${isLoading ? "opacity-50" : ""}
                ${isWinningCell ? "animate-winning bg-green-50" : "bg-white"}
                ${isLastMove ? "animate-pop" : ""}
                ${!isEmpty ? "occupied" : ""}
              `}
            >
              <span className={isLastMove ? "animate-pop" : ""}>
                {getCellContent(index)}
              </span>
              {canPlay && (
                <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 hover:opacity-100 transition-opacity">
                  {turn % 2 === 0 ? "X" : "O"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center loading-overlay rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-black animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-black">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spinner" />
              <span className="font-medium">{t("moveProcessing")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
