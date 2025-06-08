import { useEffect, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { GameState } from '@/components/TicTacToeGame';
import { isZeroAddress } from '@/utils/sui-helpers';

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
        
        // Debug rematch field parsing
        console.log('🔍 useGameSync - Raw rematch field data:', {
          raw_field: fields.rematch_requested_by,
          field_type: typeof fields.rematch_requested_by,
          is_zero_address_full: fields.rematch_requested_by === "0x0000000000000000000000000000000000000000",
          is_zero_address_short: fields.rematch_requested_by === "0x0",
          is_at_zero: fields.rematch_requested_by === "@0x0",
          is_empty: !fields.rematch_requested_by,
          is_zero_helper: isZeroAddress(fields.rematch_requested_by),
          stringified: String(fields.rematch_requested_by),
          gameId: gameId
        });
        
        // Create a hash of the current state to detect changes
        const stateHash = JSON.stringify({
          board: fields.board,
          turn: fields.turn,
          status: fields.status,
          winner: fields.winner,
          last_move_ms: fields.last_move_ms,
          rematch_requested_by: fields.rematch_requested_by,
          rematch_accepted: fields.rematch_accepted,
        });

        // Only update if state has changed
        if (stateHash !== lastUpdateRef.current) {
          console.log('🔄 useGameSync - State change detected:', {
            gameId,
            previousHash: lastUpdateRef.current.slice(0, 50) + '...',
            newHash: stateHash.slice(0, 50) + '...',
            rematchRequestedBy: fields.rematch_requested_by,
            parsedRematchRequestedBy: !isZeroAddress(fields.rematch_requested_by) ? String(fields.rematch_requested_by) : undefined,
            isCompletedGame: Number(fields.status) === 2, // GAME_STATUS.COMPLETED
            fullFields: fields
          });
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
            lastMoveEpoch: Number(fields.last_move_ms) || 0,
            gameLink: `${window.location.origin}/game/${gameId}`,
            viewerLink: `${window.location.origin}/view/${gameId}`,
            rematchRequestedBy: !isZeroAddress(fields.rematch_requested_by)
              ? String(fields.rematch_requested_by) 
              : undefined,
            rematchAccepted: fields.rematch_accepted ? Boolean(fields.rematch_accepted) : false,
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