import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG } from '@/config/constants';

export function usePendingInvites() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  useEffect(() => {
    if (!account?.address) {
      setPendingCount(0);
      setIsLoading(false);
      return;
    }

    const checkPendingInvites = async () => {
      try {
        // Query GameCreated events where current user was invited
        const { data: events } = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
          },
          limit: 50,
          order: 'descending',
        });

        let pending = 0;
        
        for (const event of events) {
          const parsedEvent = event.parsedJson as {
            game_id?: string;
            creator?: string;
            invited_player?: string;
          };

          // Check if current user was invited
          if (parsedEvent.invited_player === account.address && 
              parsedEvent.game_id) {
            
            // Check if game still exists and is in waiting status
            try {
              const gameObject = await suiClient.getObject({
                id: parsedEvent.game_id,
                options: { showContent: true }
              });

              if (gameObject.data && gameObject.data.content && 'fields' in gameObject.data.content) {
                const fields = gameObject.data.content.fields as {
                  status?: number;
                  o?: string;
                };
                
                // Count as pending if game is still waiting and user hasn't joined
                if (fields.status === 0 && fields.o === '0x0') {
                  pending++;
                }
              }
            } catch {
              // Game might be deleted, skip
              continue;
            }
          }
        }
        
        setPendingCount(pending);
      } catch (error) {
        console.error("Error checking pending invites:", error);
        setPendingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    checkPendingInvites();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkPendingInvites, 30000);

    return () => clearInterval(interval);
  }, [account?.address, suiClient]);

  return { pendingCount, isLoading };
}