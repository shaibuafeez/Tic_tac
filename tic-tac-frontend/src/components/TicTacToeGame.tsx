'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { GameBoard } from './GameBoard';
import { GameModeSelection } from './GameModeSelection';
import { JoinGame } from './JoinGame';
import { GameList } from './GameList';
import { ShareGame } from './ShareGame';
import { CONTRACT_CONFIG, GAME_CONSTANTS, GAME_MODE, GAME_STATUS } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { useGameSync } from '@/hooks/useGameSync';

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

interface TicTacToeGameProps {
  gameId?: string;
}

export function TicTacToeGame({ gameId }: TicTacToeGameProps = {}) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const [showJoinGame, setShowJoinGame] = useState(false);
  const [showShareGame, setShowShareGame] = useState(false);
  const [shareLinks, setShareLinks] = useState({ gameLink: '', viewerLink: '' });
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const router = useRouter();

  // Use real-time sync when waiting for opponent
  const shouldSyncWaiting = gameState?.status === GAME_STATUS.WAITING && 
                           gameState?.mode === GAME_MODE.COMPETITIVE &&
                           !gameState.id.startsWith('game-');

  useGameSync({
    gameId: shouldSyncWaiting ? gameState.id : null,
    onGameUpdate: (updatedGame) => {
      if (updatedGame.status === GAME_STATUS.ACTIVE && gameState?.status === GAME_STATUS.WAITING) {
        // Game has started! Hide join screen and update state
        setShowJoinGame(false);
        setGameState(updatedGame);
        alert('Opponent has joined! Game is starting.');
      }
    },
    enabled: shouldSyncWaiting,
    interval: 3000,
  });

  // Load game if gameId is provided
  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGame = async (id: string) => {
    setIsLoading(true);
    try {
      const object = await suiClient.getObject({
        id,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        alert('Game not found');
        router.push('/');
        return;
      }

      // Parse game data - in production this would parse the actual Move object
      // For now, create a mock game state
      const mockGame: GameState = {
        id,
        board: Array(9).fill(GAME_CONSTANTS.MARK_EMPTY),
        turn: 0,
        x: account?.address || '0x0',
        o: '',
        mode: GAME_MODE.COMPETITIVE,
        status: GAME_STATUS.WAITING,
        stakeAmount: 2_000_000_000,
        creator: '0x123',
        winner: '',
        gameLink: `${window.location.origin}/game/${id}`,
        viewerLink: `${window.location.origin}/view/${id}`,
      };

      setGameState(mockGame);
      
      // If it's a competitive game waiting for players, show join screen
      if (mockGame.mode === GAME_MODE.COMPETITIVE && mockGame.status === GAME_STATUS.WAITING && mockGame.creator !== account?.address) {
        setShowJoinGame(true);
      }
    } catch (error) {
      console.error('Error loading game:', error);
      alert('Failed to load game');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

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
            
            // For now, use a mock game ID (in production, extract from transaction result)
            const newGameId = `0x${Date.now().toString(16)}`;
            const gameLink = `${window.location.origin}/game/${newGameId}`;
            const viewerLink = `${window.location.origin}/view/${newGameId}`;
            
            // Set share links and show share modal
            setShareLinks({ gameLink, viewerLink });
            setShowShareGame(true);
            
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
    <>
      <GameBoard
        gameState={gameState}
        onMakeMove={makeMove}
        onResetGame={resetGame}
        isLoading={isLoading}
        currentPlayer={account.address}
      />
      
      {showShareGame && (
        <ShareGame
          gameLink={shareLinks.gameLink}
          viewerLink={shareLinks.viewerLink}
          onClose={() => setShowShareGame(false)}
        />
      )}
    </>
  );
}