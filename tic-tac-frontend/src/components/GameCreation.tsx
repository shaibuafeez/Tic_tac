'use client';

import { useState } from 'react';
import { Users, Play } from 'lucide-react';

interface GameCreationProps {
  onCreateGame: (playerO: string) => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function GameCreation({ onCreateGame, isLoading, currentPlayer }: GameCreationProps) {
  const [playerOAddress, setPlayerOAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerOAddress.trim() && playerOAddress !== currentPlayer) {
      onCreateGame(playerOAddress.trim());
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Create New Game
        </h2>
        <p className="text-gray-600">
          Enter the address of your opponent to start a new game
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Player X (You):</div>
        <div className="font-mono text-sm text-black">
          {truncateAddress(currentPlayer)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="playerO" className="block text-sm font-medium text-black mb-2">
            Player O Address:
          </label>
          <input
            type="text"
            id="playerO"
            value={playerOAddress}
            onChange={(e) => setPlayerOAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none font-mono text-sm"
            disabled={isLoading}
          />
          {playerOAddress === currentPlayer && (
            <p className="text-red-500 text-sm mt-1">
              You cannot play against yourself
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !playerOAddress.trim() || playerOAddress === currentPlayer}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Game...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Create Game
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Note:</strong> Make sure the opponent&apos;s address is correct. 
          Once the game is created, both players can take turns making moves.
        </div>
      </div>
    </div>
  );
}