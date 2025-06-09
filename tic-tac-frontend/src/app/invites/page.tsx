"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { CONTRACT_CONFIG } from "@/config/constants";
import { Mail, Trophy, Users, ArrowLeft, Home, Check, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddressDisplay } from "@/components/AddressDisplay";
import { MobileMenu } from "@/components/MobileMenu";

interface GameInvite {
  gameId: string;
  creator: string;
  stakeAmount: number;
  mode: number;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const router = useRouter();

  const loadInvites = useCallback(async () => {
    if (!account) return;
    
    setIsLoading(true);
    try {
      // Query GameCreated events where current user was invited
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
        },
        limit: 50,
        order: 'descending',
      });

      const userInvites: GameInvite[] = [];
      
      for (const event of events) {
        const parsedEvent = event.parsedJson as {
          game_id?: string;
          creator?: string;
          invited_player?: string;
          stake_amount?: string;
          mode?: number;
        };

        // Check if current user was invited
        if (parsedEvent.invited_player === account.address && 
            parsedEvent.game_id && 
            parsedEvent.creator) {
          
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
              
              // Determine status based on game state
              let status: 'pending' | 'accepted' | 'rejected' = 'pending';
              if (fields.status === 0 && (fields.o === '0x0' || fields.o === '')) {
                status = 'pending'; // Still waiting for someone to join
              } else if (fields.o === account.address) {
                status = 'accepted'; // Current user joined the game
              } else if (fields.o && fields.o !== '0x0' && fields.o !== account.address) {
                status = 'rejected'; // Someone else joined the game
              } else if (fields.status === 2) {
                status = 'rejected'; // Game was cancelled
              } else {
                status = 'pending'; // Default fallback
              }

              userInvites.push({
                gameId: parsedEvent.game_id,
                creator: parsedEvent.creator,
                stakeAmount: Number(parsedEvent.stake_amount || 0),
                mode: Number(parsedEvent.mode || 0),
                timestamp: new Date(event.timestampMs || Date.now()).getTime(),
                status,
              });
            }
          } catch {
            // Game might be deleted or cancelled
            userInvites.push({
              gameId: parsedEvent.game_id,
              creator: parsedEvent.creator,
              stakeAmount: Number(parsedEvent.stake_amount || 0),
              mode: Number(parsedEvent.mode || 0),
              timestamp: new Date(event.timestampMs || Date.now()).getTime(),
              status: 'rejected',
            });
          }
        }
      }
      
      // Sort by timestamp (newest first)
      userInvites.sort((a, b) => b.timestamp - a.timestamp);
      setInvites(userInvites);
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, suiClient]);

  useEffect(() => {
    if (account) {
      loadInvites();
      // Refresh every 30 seconds
      const interval = setInterval(loadInvites, 30000);
      return () => clearInterval(interval);
    }
  }, [account, loadInvites]);

  const handleAcceptInvite = async (invite: GameInvite) => {
    setProcessingInvite(invite.gameId);
    try {
      // Navigate to the game to join it
      router.push(`/game/${invite.gameId}`);
    } catch (error) {
      console.error("Error accepting invite:", error);
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvite = (inviteGameId: string) => {
    // Mark as rejected locally
    setInvites(prev => prev.map(invite => 
      invite.gameId === inviteGameId 
        ? { ...invite, status: 'rejected' as const }
        : invite
    ));
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const goBack = () => {
    router.back();
  };

  const pendingCount = invites.filter(i => i.status === 'pending').length;

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Connect Wallet</h1>
          <p className="text-gray-600">Please connect your wallet to view your game invites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                title="Go home"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black">Game Invites</h1>
              <p className="text-sm md:text-base text-gray-600">Manage your game invitations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl md:text-2xl font-bold text-black">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            {/* Mobile Home Button */}
            <Link
              href="/"
              className="md:hidden p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
              title="Go home"
            >
              <Home className="w-5 h-5" />
            </Link>
            {/* Refresh Button */}
            <button
              onClick={loadInvites}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              <span>Loading invites...</span>
            </div>
          </div>
        ) : invites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Game Invites</h2>
            <p className="text-gray-500">You haven&apos;t received any game invitations yet.</p>
          </div>
        ) : (
          /* Invites List */
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.gameId}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  invite.status === 'pending'
                    ? "bg-white border-blue-200 hover:border-blue-300"
                    : invite.status === 'accepted'
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Game Info */}
                    <div className="flex items-center gap-3 mb-2">
                      {invite.mode === 1 ? (
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="font-medium text-black">
                        {invite.mode === 1 ? "Competitive" : "Friendly"} Game Invitation
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        invite.status === 'pending'
                          ? "bg-blue-100 text-blue-700"
                          : invite.status === 'accepted'
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                      </span>
                    </div>

                    {/* Inviter */}
                    <div className="text-sm text-gray-600 mb-2">
                      From: <AddressDisplay address={invite.creator} />
                    </div>

                    {/* Stake Amount */}
                    {invite.mode === 1 && invite.stakeAmount > 0 && (
                      <div className="text-sm text-gray-600 mb-2">
                        Stake: {(invite.stakeAmount / 1_000_000_000).toFixed(2)} SUI
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500">
                      {formatTime(invite.timestamp)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {invite.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAcceptInvite(invite)}
                          disabled={processingInvite === invite.gameId}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {processingInvite === invite.gameId ? 'Joining...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectInvite(invite.gameId)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : invite.status === 'accepted' ? (
                      <button
                        onClick={() => router.push(`/game/${invite.gameId}`)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        View Game
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500 font-medium">Rejected</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}