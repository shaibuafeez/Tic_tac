'use client';

import { useState } from 'react';
import { Users, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { GAME_MODE } from '@/config/constants';

interface GameModeSelectionProps {
  onSelectMode: (mode: number, stakeAmount?: number) => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function GameModeSelection({ onSelectMode, isLoading, currentPlayer }: GameModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('2');
  const [showStakeInput, setShowStakeInput] = useState(false);

  const handleModeSelect = (mode: number) => {
    if (mode === GAME_MODE.COMPETITIVE) {
      setSelectedMode(mode);
      setShowStakeInput(true);
    } else {
      onSelectMode(mode);
    }
  };

  const handleConfirmCompetitive = () => {
    const stakeInMist = parseFloat(stakeAmount) * 1_000_000_000; // Convert SUI to MIST
    onSelectMode(GAME_MODE.COMPETITIVE, stakeInMist);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (showStakeInput && selectedMode === GAME_MODE.COMPETITIVE) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Set Your Stake
          </h2>
          <p className="text-gray-600">
            Winner takes 90% of the pool. 10% platform fee.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount (SUI)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
              placeholder="Enter stake amount"
            />
            <p className="mt-2 text-sm text-gray-600">
              Minimum stake: 0.1 SUI
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important!</p>
                <p>Your SUI will be staked immediately. Access your game anytime from "My Games" even after page reload.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleConfirmCompetitive}
              disabled={isLoading || parseFloat(stakeAmount) < 0.1}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed modern-button active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Game...
                </span>
              ) : (
                'Create Competitive Game'
              )}
            </button>
            <button
              onClick={() => {
                setShowStakeInput(false);
                setSelectedMode(null);
              }}
              className="w-full py-3 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">
          Choose Game Mode
        </h2>
        <p className="text-gray-600">
          Playing as {truncateAddress(currentPlayer)}
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleModeSelect(GAME_MODE.FRIENDLY)}
          disabled={isLoading}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-black transition-all duration-200 text-left group hover:scale-[1.02] hover:shadow-lg active:scale-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-200 shadow-sm group-hover:shadow-md">
              <Users className="w-6 h-6 text-blue-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-1">Friendly Game</h3>
              <p className="text-sm text-gray-600">
                Play for fun with no stakes. Perfect for practice or casual games.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleModeSelect(GAME_MODE.COMPETITIVE)}
          disabled={isLoading}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-black transition-all duration-200 text-left group hover:scale-[1.02] hover:shadow-lg active:scale-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center group-hover:from-yellow-500 group-hover:to-yellow-600 transition-all duration-200 shadow-sm group-hover:shadow-md">
              <Trophy className="w-6 h-6 text-yellow-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-1">Competitive Game</h3>
              <p className="text-sm text-gray-600">
                Put SUI at stake. Winner takes 90% of the prize pool.
              </p>
            </div>
          </div>
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 text-center animate-fade-in">
          <Loader2 className="w-6 h-6 animate-spinner mx-auto text-gray-600" />
          <p className="text-sm text-gray-600 mt-2 animate-pulse">Processing...</p>
        </div>
      )}
    </div>
  );
}