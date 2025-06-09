'use client';

import { useEffect, useState, useRef } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { AddressDisplay } from './AddressDisplay';

interface GameInvite {
  gameId: string;
  creator: string;
  stakeAmount: number;
  timestamp: number;
}

export function GameInviteListener() {
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [dismissedInvites, setDismissedInvites] = useState<Set<string>>(new Set());
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const router = useRouter();
  const lastEventId = useRef<string | null>(null);

  // Load dismissed invites from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedGameInvites');
    if (dismissed) {
      try {
        const parsedDismissed = JSON.parse(dismissed);
        setDismissedInvites(new Set(parsedDismissed));
      } catch (error) {
        console.error('Error parsing dismissed invites:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!account?.address) return;

    const checkForInvites = async () => {
      try {
        // Query GameCreated events
        const { data: events } = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
          },
          limit: 10,
          order: 'descending',
        });

        // Filter events where current user is invited
        const newInvites: GameInvite[] = [];
        
        for (const event of events) {
          // Skip if we've already processed this event
          if (lastEventId.current && event.id.txDigest === lastEventId.current) {
            break;
          }

          const parsedEvent = event.parsedJson as {
            game_id?: string;
            creator?: string;
            invited_player?: string;
            stake_amount?: string;
          };

          // Check if current user is invited and game hasn't been dismissed
          if (parsedEvent.invited_player === account.address && 
              parsedEvent.game_id && 
              parsedEvent.creator &&
              !dismissedInvites.has(parsedEvent.game_id)) {
            newInvites.push({
              gameId: parsedEvent.game_id,
              creator: parsedEvent.creator,
              stakeAmount: Number(parsedEvent.stake_amount || 0),
              timestamp: Date.now(),
            });
          }
        }

        if (newInvites.length > 0) {
          // Update last processed event
          lastEventId.current = events[0]?.id.txDigest || null;
          
          // Add new invites to state
          setInvites(prev => [...newInvites, ...prev]);
          setShowNotification(true);
        }
      } catch (error) {
        console.error('Error checking for game invites:', error);
      }
    };

    // Check immediately
    checkForInvites();

    // Set up polling interval
    const interval = setInterval(checkForInvites, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [account?.address, suiClient, dismissedInvites]);

  const handleAcceptInvite = (invite: GameInvite) => {
    // Add to dismissed set to prevent re-showing
    const newDismissedInvites = new Set(dismissedInvites);
    newDismissedInvites.add(invite.gameId);
    setDismissedInvites(newDismissedInvites);
    
    // Update localStorage
    try {
      localStorage.setItem('dismissedGameInvites', JSON.stringify(Array.from(newDismissedInvites)));
    } catch (error) {
      console.error('Error saving dismissed invites:', error);
    }
    
    // Navigate to the game
    router.push(`/game/${invite.gameId}`);
    
    // Remove the invite from the list
    setInvites(prev => prev.filter(i => i.gameId !== invite.gameId));
    
    // Hide notification if no more invites
    if (invites.length <= 1) {
      setShowNotification(false);
    }
  };

  const handleDismissInvite = (gameId: string) => {
    // Add to dismissed set
    const newDismissedInvites = new Set(dismissedInvites);
    newDismissedInvites.add(gameId);
    setDismissedInvites(newDismissedInvites);
    
    // Update localStorage
    try {
      localStorage.setItem('dismissedGameInvites', JSON.stringify(Array.from(newDismissedInvites)));
    } catch (error) {
      console.error('Error saving dismissed invites:', error);
    }
    
    // Remove from current invites
    setInvites(prev => prev.filter(i => i.gameId !== gameId));
    
    // Hide notification if no more invites
    if (invites.length <= 1) {
      setShowNotification(false);
    }
  };

  if (!showNotification || invites.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {invites.map((invite) => (
        <div
          key={invite.gameId}
          className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Game Invitation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                From: <AddressDisplay address={invite.creator} />
              </p>
              {invite.stakeAmount > 0 && (
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                  Stake: {(invite.stakeAmount / 1_000_000_000).toFixed(2)} SUI
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(invite)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Join Game
                </button>
                <button
                  onClick={() => handleDismissInvite(invite.gameId)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => handleDismissInvite(invite.gameId)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}