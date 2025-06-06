'use client';

import { Trophy, Loader2, AlertCircle } from 'lucide-react';

interface JoinGameProps {
  gameId: string;
  stakeAmount: number;
  creator: string;
  onJoin: () => void;
  onCancel: () => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function JoinGame({ 
  gameId, 
  stakeAmount, 
  creator, 
  onJoin, 
  onCancel,
  isLoading,
  currentPlayer
}: JoinGameProps) {
  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(2);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isCreator = creator === currentPlayer;

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Join Competitive Game
        </h2>
        <p className="text-gray-600">
          Match the stake to join this game
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Game ID</span>
            <span className="text-sm font-mono text-black">
              {truncateAddress(gameId)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Creator</span>
            <span className="text-sm font-mono text-black">
              {isCreator ? 'You' : truncateAddress(creator)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Stake Required</span>
            <span className="text-lg font-bold text-black">
              {formatSUI(stakeAmount)} SUI
            </span>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Prize Distribution</p>
              <p>Winner: {formatSUI(stakeAmount * 2 * 0.9)} SUI (90%)</p>
              <p>Platform fee: {formatSUI(stakeAmount * 2 * 0.1)} SUI (10%)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {!isCreator && (
          <button
            onClick={onJoin}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining Game...
              </span>
            ) : (
              `Join Game (${formatSUI(stakeAmount)} SUI)`
            )}
          </button>
        )}
        
        {isCreator && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-800">
              Waiting for an opponent to join...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Share the game link with your opponent
            </p>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
        >
          {isCreator ? 'Cancel Game' : 'Back'}
        </button>
      </div>
    </div>
  );
}