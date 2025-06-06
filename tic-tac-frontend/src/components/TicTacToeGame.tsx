'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { GameBoard } from './GameBoard';
import { GameModeSelection } from './GameModeSelection';
import { JoinGame } from './JoinGame';
import { GameList } from './GameList';
import { CONTRACT_CONFIG, GAME_CONSTANTS, GAME_MODE, GAME_STATUS } from '@/config/constants';

export interface GameState {
  id: string;
  board: number[];
  turn: number;
  x: string;
  o: string;
  mode: number;
  status: number;
  stakeAmount: number;
  creator: string;
  winner: string;
  gameLink?: string;
  viewerLink?: string;
}

export function TicTacToeGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const [showJoinGame, setShowJoinGame] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const createGame = async (mode: number, stakeAmount?: number) => {
    if (!account) return;

    setIsLoading(true);
    try {
      const transaction = new Transaction();
      
      if (mode === GAME_MODE.FRIENDLY) {
        // For now, create a friendly game with a placeholder opponent
        const opponentAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        transaction.moveCall({
          target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::create_friendly_game`,
          arguments: [
            transaction.pure.address(opponentAddress),
          ],
        });
      } else if (mode === GAME_MODE.COMPETITIVE && stakeAmount) {
        // Split coins for the stake
        const [coin] = transaction.splitCoins(
          transaction.gas,
          [transaction.pure.u64(stakeAmount)]
        );
        
        transaction.moveCall({
          target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::create_competitive_game`,
          arguments: [coin],
        });
      }

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log('Game created:', result);
            
            // Extract game links from the transaction result
            // In production, you'd parse the actual return values
            const gameLink = `game_${result.digest}`;
            const viewerLink = `viewer_${result.digest}`;
            
            alert(`Game created! Share these links:\nGame Link: ${gameLink}\nViewer Link: ${viewerLink}`);
            
            // Create a local game state
            setGameState({
              id: 'game-' + Date.now(),
              board: Array(9).fill(GAME_CONSTANTS.MARK_EMPTY),
              turn: 0,
              x: account.address,
              o: mode === GAME_MODE.FRIENDLY ? "0x0000000000000000000000000000000000000000000000000000000000000000" : "",
              mode,
              status: mode === GAME_MODE.FRIENDLY ? GAME_STATUS.ACTIVE : GAME_STATUS.WAITING,
              stakeAmount: stakeAmount || 0,
              creator: account.address,
              winner: "",
              gameLink,
              viewerLink,
            });
            
            if (mode === GAME_MODE.COMPETITIVE) {
              setShowJoinGame(true);
            }
          },
          onError: (error) => {
            console.error('Failed to create game:', error);
            alert('Failed to create game. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinCompetitiveGame = async () => {
    if (!account || !gameState) return;

    setIsLoading(true);
    try {
      const transaction = new Transaction();
      
      // Split coins for the stake
      const [coin] = transaction.splitCoins(
        transaction.gas,
        [transaction.pure.u64(gameState.stakeAmount)]
      );
      
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::join_competitive_game`,
        arguments: [
          transaction.object(gameState.id),
          coin,
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log('Joined game:', result);
            
            // Update game state
            setGameState({
              ...gameState,
              o: account.address,
              status: GAME_STATUS.ACTIVE,
            });
            
            setShowJoinGame(false);
          },
          onError: (error) => {
            console.error('Failed to join game:', error);
            alert('Failed to join game. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Error joining game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (row: number, col: number) => {
    if (!account || !gameState) return;

    // For local games, handle locally
    if (gameState.id.startsWith('game-')) {
      const newBoard = [...gameState.board];
      const index = row * 3 + col;
      newBoard[index] = gameState.turn % 2 === 0 ? GAME_CONSTANTS.MARK_X : GAME_CONSTANTS.MARK_O;
      
      setGameState({
        ...gameState,
        board: newBoard,
        turn: gameState.turn + 1,
      });
      
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
    setShowJoinGame(false);
  };

  const selectGame = (game: GameState) => {
    setGameState(game);
    setShowGameList(false);
    
    // If it's a competitive game waiting for players, show join screen
    if (game.mode === GAME_MODE.COMPETITIVE && game.status === GAME_STATUS.WAITING) {
      setShowJoinGame(true);
    }
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

  if (showJoinGame && gameState) {
    return (
      <JoinGame
        gameId={gameState.id}
        stakeAmount={gameState.stakeAmount}
        creator={gameState.creator}
        onJoin={joinCompetitiveGame}
        onCancel={resetGame}
        isLoading={isLoading}
        currentPlayer={account.address}
      />
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
        <GameModeSelection
          onSelectMode={createGame}
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