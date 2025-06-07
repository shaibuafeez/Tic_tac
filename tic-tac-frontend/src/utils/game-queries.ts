import { SuiClient } from '@mysten/sui/client';
import { CONTRACT_CONFIG } from '@/config/constants';
import { GameState } from '@/components/TicTacToeGame';

export async function getUserGames(
  suiClient: SuiClient,
  userAddress: string
): Promise<GameState[]> {
  try {
    // Query games created by the user
    const createdGames = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
      },
      limit: 100,
    });

    const userCreatedGameIds = createdGames.data
      .filter((event) => {
        const parsed = event.parsedJson as { creator?: string; game_id?: string } | undefined;
        return parsed?.creator === userAddress;
      })
      .map((event) => {
        const parsed = event.parsedJson as { creator?: string; game_id?: string } | undefined;
        return parsed?.game_id;
      })
      .filter(Boolean);

    // Also query for games where user joined
    const joinedGames = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameJoined`,
      },
      limit: 100,
    });

    const userJoinedGameIds = joinedGames.data
      .filter((event) => {
        const parsed = event.parsedJson as { player?: string; game_id?: string } | undefined;
        return parsed?.player === userAddress;
      })
      .map((event) => {
        const parsed = event.parsedJson as { player?: string; game_id?: string } | undefined;
        return parsed?.game_id;
      })
      .filter(Boolean);

    // Combine all game IDs and remove duplicates
    const allGameIds = [...new Set([...userCreatedGameIds, ...userJoinedGameIds])];
    
    // Fetch details of all games
    const gamePromises = allGameIds.map(id => 
      suiClient.getObject({
        id: id as string,
        options: { showContent: true }
      })
    );

    const gameResults = await Promise.all(gamePromises);
    const allGameObjects = gameResults.map(result => result.data).filter(Boolean);

    // Parse and filter games
    const games: GameState[] = [];
    
    for (const obj of allGameObjects) {
      if (!obj || !obj.content || !('fields' in obj.content)) continue;
      
      const fields = obj.content.fields as {
        board?: number[];
        turn?: number;
        x?: string;
        o?: string;
        mode?: number;
        status?: number;
        stake_amount?: number;
        creator?: string;
        winner?: string;
        last_move_ms?: number;
      };
      const gameId = obj.objectId;
      
      // Include games where user is creator (x) or joined player (o)
      // For waiting games, o might be empty but creator should still see it
      if (fields.x !== userAddress && fields.o !== userAddress && fields.creator !== userAddress) continue;
      
      // Skip if this game is already in our list (deduplication)
      if (games.some(g => g.id === gameId)) continue;
      
      const board = Array.isArray(fields.board) 
        ? fields.board.map(cell => Number(cell))
        : Array(9).fill(0);
      
      games.push({
        id: gameId,
        board,
        turn: Number(fields.turn) || 0,
        x: String(fields.x) || '',
        o: String(fields.o) || '',
        mode: Number(fields.mode) || 0,
        status: Number(fields.status) || 0,
        stakeAmount: Number(fields.stake_amount) || 0,
        creator: String(fields.creator) || '',
        winner: String(fields.winner) || '',
        lastMoveEpoch: Number(fields.last_move_ms) || 0,
        gameLink: `${window.location.origin}/game/${gameId}`,
        viewerLink: `${window.location.origin}/view/${gameId}`,
      });
    }
    
    // Sort by status (active first) then by creation
    return games.sort((a, b) => {
      if (a.status !== b.status) {
        // Active games (status 1) come first
        return a.status === 1 ? -1 : b.status === 1 ? 1 : 0;
      }
      return 0;
    });
  } catch (error) {
    console.error('Error fetching user games:', error);
    return [];
  }
}

export async function getAllActiveGames(suiClient: SuiClient): Promise<GameState[]> {
  try {
    // Query recent game creation events
    const { data } = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
      },
      limit: 50,
    });

    const gameIds = data
      .map((event) => {
        const parsed = event.parsedJson as { game_id?: string } | undefined;
        return parsed?.game_id;
      })
      .filter(Boolean);

    // Fetch game details
    const gamePromises = gameIds.map(id => 
      suiClient.getObject({
        id: id as string,
        options: { showContent: true }
      })
    );

    const gameResults = await Promise.all(gamePromises);
    const games: GameState[] = [];

    for (const result of gameResults) {
      const obj = result.data;
      if (!obj || !obj.content || !('fields' in obj.content)) continue;
      
      const fields = obj.content.fields as {
        board?: number[];
        turn?: number;
        x?: string;
        o?: string;
        mode?: number;
        status?: number;
        stake_amount?: number;
        creator?: string;
        winner?: string;
        last_move_ms?: number;
      };
      const gameId = obj.objectId;
      
      // Only include waiting or active games
      const status = Number(fields.status) || 0;
      if (status !== 0 && status !== 1) continue;
      
      const board = Array.isArray(fields.board) 
        ? fields.board.map(cell => Number(cell))
        : Array(9).fill(0);
      
      games.push({
        id: gameId,
        board,
        turn: Number(fields.turn) || 0,
        x: String(fields.x) || '',
        o: String(fields.o) || '',
        mode: Number(fields.mode) || 0,
        status,
        stakeAmount: Number(fields.stake_amount) || 0,
        creator: String(fields.creator) || '',
        winner: String(fields.winner) || '',
        lastMoveEpoch: Number(fields.last_move_ms) || 0,
        gameLink: `${window.location.origin}/game/${gameId}`,
        viewerLink: `${window.location.origin}/view/${gameId}`,
      });
    }
    
    return games.sort((a, b) => {
      // Waiting games first, then active
      if (a.status !== b.status) {
        return a.status === 0 ? -1 : 1;
      }
      return 0;
    });
  } catch (error) {
    console.error('Error fetching active games:', error);
    return [];
  }
}