'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { GameBoard } from './GameBoard';
import { GameCreation } from './GameCreation';
import { GameList } from './GameList';
import { CONTRACT_CONFIG, GAME_CONSTANTS } from '@/config/constants';

export interface GameState {
  id: string;
  board: number[];
  turn: number;
  x: string;
  o: string;
  isActive: boolean;
}

export function TicTacToeGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const createGame = async (playerO: string) => {
    if (!account) return;

    setIsLoading(true);
    try {
      const transaction = new Transaction();
      
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::new`,
        arguments: [
          transaction.pure.address(account.address),
          transaction.pure.address(playerO),
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log('Game created:', result);
            
            try {
              // The result should have a digest property
              if (result.digest) {
                // For now, we'll use the transaction digest as a temporary ID
                // In a real app, you would query the transaction details to get the created object
                const tempGameId = result.digest;
                
                console.log('Transaction successful with digest:', tempGameId);
                alert(`Game created! Transaction: ${tempGameId}\n\nNote: In a production app, you would query the blockchain to get the actual game object ID.`);
                
                // Create a demo game state (in production, you'd get the actual game object ID)
                setGameState({
                  id: 'demo-game-' + Date.now(), // Demo ID
                  board: Array(9).fill(GAME_CONSTANTS.MARK_EMPTY),
                  turn: 0,
                  x: account.address,
                  o: playerO,
                  isActive: true,
                });
              } else {
                console.error('No digest found in transaction result');
                alert('Game creation may have succeeded but unable to get transaction details.');
              }
            } catch (error) {
              console.error('Error processing transaction result:', error);
            }
          },
          onError: (error) => {
            console.error('Failed to create game:', error);
          },
        }
      );
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (row: number, col: number) => {
    if (!account || !gameState) return;

    // Check if this is a demo game
    if (gameState.id.startsWith('demo-')) {
      // Handle demo game locally
      const newBoard = [...gameState.board];
      const index = row * 3 + col;
      newBoard[index] = gameState.turn % 2 === 0 ? GAME_CONSTANTS.MARK_X : GAME_CONSTANTS.MARK_O;
      
      setGameState({
        ...gameState,
        board: newBoard,
        turn: gameState.turn + 1,
      });
      
      console.log('Demo move made:', { row, col, turn: gameState.turn });
      return;
    }

    // For real games, make blockchain transaction
    setIsLoading(true);
    try {
      const transaction = new Transaction();
      
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::place_mark`,
        arguments: [
          transaction.object(gameState.id),
          transaction.pure.u8(row),
          transaction.pure.u8(col),
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log('Move made:', result);
            // Update local game state
            const newBoard = [...gameState.board];
            const index = row * 3 + col;
            newBoard[index] = gameState.turn % 2 === 0 ? GAME_CONSTANTS.MARK_X : GAME_CONSTANTS.MARK_O;
            
            setGameState({
              ...gameState,
              board: newBoard,
              turn: gameState.turn + 1,
            });
          },
          onError: (error) => {
            console.error('Failed to make move:', error);
            alert('Failed to make move. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Error making move:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setShowGameList(false);
  };

  const selectGame = (game: GameState) => {
    setGameState(game);
    setShowGameList(false);
  };

  if (!account) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-black mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Please connect your Sui wallet to start playing tic-tac-toe!
        </p>
      </div>
    );
  }

  if (!gameState) {
    if (showGameList) {
      return (
        <div className="space-y-4">
          <GameList 
            onSelectGame={selectGame}
            currentPlayer={account.address}
          />
          <button
            onClick={() => setShowGameList(false)}
            className="w-full max-w-md mx-auto block text-center py-2 text-gray-600 hover:text-black transition-colors"
          >
            ← Back to create game
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <GameCreation 
          onCreateGame={createGame} 
          isLoading={isLoading}
          currentPlayer={account.address}
        />
        <button
          onClick={() => setShowGameList(true)}
          className="w-full max-w-md mx-auto block text-center py-2 text-gray-600 hover:text-black transition-colors"
        >
          Or browse existing games →
        </button>
      </div>
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      onMakeMove={makeMove}
      onResetGame={resetGame}
      isLoading={isLoading}
      currentPlayer={account.address}
    />
  );
}