import { useEffect, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { GameState } from '@/components/TicTacToeGame';

interface UseGameSyncProps {
  gameId: string | null;
  onGameUpdate: (game: GameState) => void;
  enabled: boolean;
  interval?: number;
}

export function useGameSync({ 
  gameId, 
  onGameUpdate, 
  enabled, 
  interval = 3000 
}: UseGameSyncProps) {
  const suiClient = useSuiClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');

  const fetchGameState = async () => {
    if (!gameId || !enabled) {
      console.log('Game sync skipped:', { gameId, enabled });
      return;
    }

    console.log('Fetching game state for sync:', gameId);
    try {
      const object = await suiClient.getObject({
        id: gameId,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        // Game not found - this is expected for demo/local games
        return;
      }

      // Parse the game state from the Move object
      // This is a simplified version - in production you'd parse the actual object
      const content = object.data.content;
      if (content && 'fields' in content) {
        const fields = content.fields as Record<string, unknown>;
        
        // Create a hash of the current state to detect changes
        const stateHash = JSON.stringify({
          board: fields.board,
          turn: fields.turn,
          status: fields.status,
          winner: fields.winner,
          last_move_epoch: fields.last_move_epoch,
        });

        // Only update if state has changed
        if (stateHash !== lastUpdateRef.current) {
          lastUpdateRef.current = stateHash;
          
          // Parse the board array properly
          let board = Array(9).fill(0);
          if (fields.board && Array.isArray(fields.board)) {
            board = fields.board.map(cell => Number(cell));
          }
          
          const gameState: GameState = {
            id: gameId,
            board,
            turn: Number(fields.turn) || 0,
            x: String(fields.x) || '',
            o: String(fields.o) || '',
            mode: fields.mode !== undefined ? Number(fields.mode) : 0,
            status: fields.status !== undefined ? Number(fields.status) : 0,
            stakeAmount: Number(fields.stake_amount) || 0,
            creator: String(fields.creator) || '',
            winner: String(fields.winner) || '',
            lastMoveEpoch: Number(fields.last_move_epoch) || 0,
            gameLink: `${window.location.origin}/game/${gameId}`,
            viewerLink: `${window.location.origin}/view/${gameId}`,
          };

          onGameUpdate(gameState);
        }
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  useEffect(() => {
    if (!gameId || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchGameState();

    // Set up polling
    intervalRef.current = setInterval(fetchGameState, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameId, enabled, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  return { refetch: fetchGameState };
}