'use client';

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Grid3x3, Loader2, RefreshCw } from 'lucide-react';
import { CONTRACT_CONFIG } from '@/config/constants';

interface Game {
  id: string;
  board: number[];
  turn: number;
  x: string;
  o: string;
}

interface GameListProps {
  onSelectGame: (game: Game) => void;
  currentPlayer: string;
}

export function GameList({ onSelectGame, currentPlayer }: GameListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const suiClient = useSuiClient();

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      // Query for Game objects from our package
      const objects = await suiClient.getOwnedObjects({
        owner: currentPlayer,
        filter: {
          StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::Game`
        }
      });

      console.log('Found objects:', objects);

      // For demo purposes, create some mock games
      const mockGames: Game[] = [
        {
          id: 'demo-game-1',
          board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          turn: 0,
          x: currentPlayer,
          o: '0x1234...5678'
        },
        {
          id: 'demo-game-2',
          board: [1, 0, 0, 0, 2, 0, 0, 0, 0],
          turn: 2,
          x: '0x8765...4321',
          o: currentPlayer
        }
      ];

      setGames(mockGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [currentPlayer]);

  const truncateAddress = (address: string) => {
    if (address.includes('...')) return address; // Already truncated
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getGameStatus = (game: Game) => {
    const isYourTurn = (game.turn % 2 === 0 && game.x === currentPlayer) ||
                       (game.turn % 2 === 1 && game.o === currentPlayer);
    return isYourTurn ? 'Your turn' : 'Opponent\'s turn';
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
          Select a Game
        </h2>
        <p className="text-gray-600">
          Join an existing game or create a new one
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={fetchGames}
          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No active games found</p>
          <p className="text-sm mt-2">Create a new game to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-black transition-colors text-left"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-mono text-gray-600">
                  {truncateAddress(game.id)}
                </span>
                <span className="text-xs text-gray-500">
                  Turn {game.turn}
                </span>
              </div>
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">X:</span>
                  <span className={`font-mono ${game.x === currentPlayer ? 'text-black font-bold' : 'text-gray-700'}`}>
                    {game.x === currentPlayer ? 'You' : truncateAddress(game.x)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">O:</span>
                  <span className={`font-mono ${game.o === currentPlayer ? 'text-black font-bold' : 'text-gray-700'}`}>
                    {game.o === currentPlayer ? 'You' : truncateAddress(game.o)}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-sm font-medium text-black">
                {getGameStatus(game)}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Note:</strong> This demo shows mock games. In production, it would query actual blockchain games.
        </div>
      </div>
    </div>
  );
}