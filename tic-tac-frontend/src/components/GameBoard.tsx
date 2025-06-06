'use client';

import { RotateCcw, Trophy, Users, Wifi } from 'lucide-react';
import { GameState } from './TicTacToeGame';
import { GAME_CONSTANTS, UI_CONFIG, GAME_STATUS } from '@/config/constants';
import { useGameSync } from '@/hooks/useGameSync';
import { useState, useEffect } from 'react';

interface GameBoardProps {
  gameState: GameState;
  onMakeMove: (row: number, col: number) => void;
  onResetGame: () => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function GameBoard({ 
  gameState: initialGameState, 
  onMakeMove, 
  onResetGame, 
  isLoading, 
  currentPlayer 
}: GameBoardProps) {
  const [gameState, setGameState] = useState(initialGameState);
  const [isLive, setIsLive] = useState(false);
  const { board, turn, x, o } = gameState;

  // Update local state when prop changes
  useEffect(() => {
    setGameState(initialGameState);
  }, [initialGameState]);

  // Enable real-time sync for non-local games
  const shouldSync = !gameState.id.startsWith('game-') && !gameState.id.startsWith('demo-');
  
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

  const truncateAddress = (address: string) => {
    if (address.length <= UI_CONFIG.MAX_ADDRESS_LENGTH) return address;
    return `${address.slice(0, UI_CONFIG.TRUNCATE_START)}...${address.slice(-UI_CONFIG.TRUNCATE_END)}`;
  };

  const getCurrentPlayer = () => {
    return turn % 2 === 0 ? x : o;
  };

  const isCurrentPlayerTurn = () => {
    return getCurrentPlayer() === currentPlayer;
  };

  const getCellContent = (index: number) => {
    const value = board[index];
    if (value === GAME_CONSTANTS.MARK_X) return 'X';
    if (value === GAME_CONSTANTS.MARK_O) return 'O';
    return '';
  };

  const getCellColor = (index: number) => {
    const value = board[index];
    if (value === GAME_CONSTANTS.MARK_X) return 'text-black'; // X
    if (value === GAME_CONSTANTS.MARK_O) return 'text-gray-600';  // O
    return 'text-gray-400';
  };

  const checkWinner = () => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === GAME_CONSTANTS.MARK_X ? x : o;
      }
    }

    return null;
  };

  const isDraw = () => {
    return board.every(cell => cell !== GAME_CONSTANTS.MARK_EMPTY) && !checkWinner();
  };

  const handleCellClick = (index: number) => {
    if (board[index] !== GAME_CONSTANTS.MARK_EMPTY || !isCurrentPlayerTurn() || isLoading || checkWinner()) {
      return;
    }

    const row = Math.floor(index / 3);
    const col = index % 3;
    onMakeMove(row, col);
  };

  const winner = checkWinner();
  const gameOver = winner || isDraw();

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-lg w-full">
      {/* Game Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              {gameState.mode === 1 ? <Trophy className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              {gameState.mode === 1 ? 'Competitive Game' : 'Friendly Game'}
            </h2>
            {shouldSync && (
              <div className={`flex items-center gap-1 text-sm ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                <Wifi className="w-4 h-4" />
                <span>{isLive ? 'Live' : 'Connected'}</span>
              </div>
            )}
          </div>
          <button
            onClick={onResetGame}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            title="New Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`p-3 rounded-lg border ${currentPlayer === x ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-sm ${currentPlayer === x ? 'text-gray-300' : 'text-gray-600'}`}>Player X</div>
            <div className={`font-mono text-sm ${currentPlayer === x ? 'text-white' : 'text-black'}`}>
              {truncateAddress(x)}
            </div>
            {currentPlayer === x && (
              <div className="text-xs text-gray-300 mt-1">You</div>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${currentPlayer === o ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-sm ${currentPlayer === o ? 'text-gray-300' : 'text-gray-600'}`}>Player O</div>
            <div className={`font-mono text-sm ${currentPlayer === o ? 'text-white' : 'text-black'}`}>
              {truncateAddress(o)}
            </div>
            {currentPlayer === o && (
              <div className="text-xs text-gray-300 mt-1">You</div>
            )}
          </div>
        </div>

        {/* Prize Pool for Competitive Games */}
        {gameState.mode === 1 && gameState.stakeAmount > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-yellow-800">Prize Pool</span>
              <span className="text-lg font-bold text-yellow-900">
                {((gameState.stakeAmount * 2) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Winner takes {((gameState.stakeAmount * 2 * 0.9) / 1_000_000_000).toFixed(2)} SUI (90%)
            </p>
          </div>
        )}

        {/* Game Status */}
        <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
          {gameOver ? (
            winner ? (
              <div className="flex items-center justify-center gap-2 text-black">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">
                  {winner === currentPlayer ? 'You Win!' : 
                   `Player ${winner === x ? 'X' : 'O'} Wins!`}
                </span>
              </div>
            ) : (
              <span className="text-gray-600 font-medium">It&apos;s a Draw!</span>
            )
          ) : (
            <span className="text-gray-600">
              {isCurrentPlayerTurn() ? 
                "Your turn" : 
                `Waiting for Player ${getCurrentPlayer() === x ? 'X' : 'O'}`
              }
            </span>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {board.map((_, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={isLoading || board[index] !== GAME_CONSTANTS.MARK_EMPTY || !isCurrentPlayerTurn() || !!gameOver}
            className={`
              aspect-square border-2 border-black rounded-lg flex items-center justify-center
              text-4xl font-bold transition-all duration-200 bg-white
              ${board[index] === GAME_CONSTANTS.MARK_EMPTY && isCurrentPlayerTurn() && !gameOver
                ? 'hover:bg-gray-100 hover:border-gray-800 cursor-pointer' 
                : 'cursor-not-allowed'
              }
              ${getCellColor(index)}
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            {getCellContent(index)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-black">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Processing move...</span>
          </div>
        </div>
      )}

    </div>
  );
}