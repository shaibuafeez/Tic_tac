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
    if (!gameId || !enabled) return;

    try {
      const object = await suiClient.getObject({
        id: gameId,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        console.error('Game not found');
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
        });

        // Only update if state has changed
        if (stateHash !== lastUpdateRef.current) {
          lastUpdateRef.current = stateHash;
          
          const gameState: GameState = {
            id: gameId,
            board: (fields.board as number[]) || [],
            turn: (fields.turn as number) || 0,
            x: (fields.x as string) || '',
            o: (fields.o as string) || '',
            mode: (fields.mode as number) || 0,
            status: (fields.status as number) || 0,
            stakeAmount: (fields.stake_amount as number) || 0,
            creator: (fields.creator as string) || '',
            winner: (fields.winner as string) || '',
            gameLink: (fields.game_link as string) || '',
            viewerLink: (fields.viewer_link as string) || '',
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