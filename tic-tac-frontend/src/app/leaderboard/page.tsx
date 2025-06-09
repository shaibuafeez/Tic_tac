"use client";

import { useState, useEffect, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import {
  Trophy,
  Medal,
  TrendingUp,
  Users,
  Loader2,
  Home,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { CONTRACT_CONFIG, MAX_LEADERBOARD_SIZE } from "@/config/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { AddressDisplay } from "@/components/AddressDisplay";

interface PlayerStats {
  player: string;
  totalProfit: number;
  totalLoss: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  netProfit: number;
  lastUpdated: number;
}

interface LeaderboardData {
  topPlayers: PlayerStats[];
  allTimeVolume: number;
  totalGames: number;
  totalPlayers: number;
}

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const suiClient = useSuiClient();
  
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil((leaderboard?.topPlayers.length || 0) / ITEMS_PER_PAGE);

  const fetchLeaderboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const fetchRealLeaderboardData = async (): Promise<LeaderboardData> => {
    // Query GameCompleted events to build leaderboard
    const completedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCompleted`,
      },
      limit: 1000, // Increased limit to get more data
      order: "descending",
    });

    // Also query GameCreated events to get all games (including ongoing)
    const createdEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
      },
      limit: 1000,
      order: "descending",
    });

    const playerStats = new Map<string, PlayerStats>();
    let totalVolume = 0;
    const totalGames = createdEvents.data.length; // Total games created
    const uniquePlayers = new Set<string>();

    // Process created events to get all players
    createdEvents.data.forEach((event) => {
      if (event.parsedJson) {
        const data = event.parsedJson as {
          creator?: string;
          stake_amount?: number;
        };
        if (data.creator) uniquePlayers.add(data.creator);
        if (data.stake_amount) {
          totalVolume += Number(data.stake_amount) * 2; // Both players stake
        }
      }
    });

    // Process completed events for wins/losses
    completedEvents.data.forEach((event) => {
      if (event.parsedJson) {
        const data = event.parsedJson as {
          winner?: string;
          loser?: string;
          prize_amount?: number;
        };
        const winner = data.winner;
        const loser = data.loser;
        const prizeAmount = Number(data.prize_amount || 0);
        const stake = prizeAmount > 0 ? Math.floor(prizeAmount / 1.8) : 0; // Reverse calculate stake from prize (90% of 2x stake)
        const isDraw = !winner || winner === "0x0000000000000000000000000000000000000000000000000000000000000000";

        if (winner && winner !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          uniquePlayers.add(winner);
        }
        if (loser && loser !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          uniquePlayers.add(loser);
        }

        // Update winner stats
        if (!isDraw && winner && winner !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          const winnerStats = playerStats.get(winner) || createEmptyStats(winner);
          winnerStats.gamesWon++;
          winnerStats.totalProfit += stake;
          winnerStats.netProfit += stake;
          winnerStats.lastUpdated = Date.now();
          playerStats.set(winner, winnerStats);
        }

        // Update loser stats
        if (!isDraw && loser && loser !== "0x0000000000000000000000000000000000000000000000000000000000000000" && loser !== winner) {
          const loserStats = playerStats.get(loser) || createEmptyStats(loser);
          loserStats.gamesLost++;
          loserStats.totalLoss += stake;
          loserStats.netProfit -= stake;
          loserStats.lastUpdated = Date.now();
          playerStats.set(loser, loserStats);
        }

        // Handle draw - both players get their stake back
        if (isDraw && winner && loser) {
          [winner, loser].forEach((player) => {
            if (player && player !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
              const stats = playerStats.get(player) || createEmptyStats(player);
              stats.gamesDrawn++;
              stats.lastUpdated = Date.now();
              playerStats.set(player, stats);
            }
          });
        }
      }
    });

    // Sort players by net profit, then by games won
    const topPlayers = Array.from(playerStats.values())
      .sort((a, b) => {
        if (b.netProfit !== a.netProfit) {
          return b.netProfit - a.netProfit;
        }
        return b.gamesWon - a.gamesWon;
      })
      .slice(0, MAX_LEADERBOARD_SIZE); // Show top 100 players

    return {
      topPlayers,
      allTimeVolume: totalVolume,
      totalGames,
      totalPlayers: uniquePlayers.size,
    };
  };

    try {
      // Always fetch real game data from events
      const realData = await fetchRealLeaderboardData();
      
      // Only use real data, no mock data fallback
      if (realData.topPlayers.length > 0 || realData.totalGames > 0) {
        setLeaderboard(realData);
      } else {
        // If no games have been played, show empty state
        setLeaderboard({
          topPlayers: [],
          allTimeVolume: 0,
          totalGames: 0,
          totalPlayers: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      // Show empty state instead of mock data
      setLeaderboard({
        topPlayers: [],
        allTimeVolume: 0,
        totalGames: 0,
        totalPlayers: 0,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [suiClient]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      await fetchLeaderboard();
    };
    loadLeaderboard();
  }, [fetchLeaderboard]);

  const createEmptyStats = (player: string): PlayerStats => ({
    player,
    totalProfit: 0,
    totalLoss: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDrawn: 0,
    netProfit: 0,
    lastUpdated: Date.now(),
  });


  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(2);
  };


  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-gray-500 font-mono">#{rank}</span>;
  };

  const getWinRate = (won: number, lost: number, drawn: number) => {
    const total = won + lost + drawn;
    if (total === 0) return 0;
    return ((won / total) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>{t("loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              {t("leaderboard")}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchLeaderboard(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? t("loading") : "Refresh"}
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all"
              >
                <Home className="w-4 h-4" />
                {t("home")}
              </Link>
            </div>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{t("totalVolume")}</span>
              </div>
              <p className="text-2xl font-bold text-black">
                {formatSUI(leaderboard?.allTimeVolume || 0)} SUI
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">{t("totalGames")}</span>
              </div>
              <p className="text-2xl font-bold text-black">
                {leaderboard?.totalGames || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{t("totalPlayers")}</span>
              </div>
              <p className="text-2xl font-bold text-black">
                {leaderboard?.totalPlayers || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
          <div className="p-6 border-b-2 border-black bg-gray-50">
            <h2 className="text-xl font-bold text-black">
              {t("leaderboard")} - {t("netProfit")}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("rank")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("player")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("totalGames")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("winRate")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("totalProfit")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("totalLoss")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("netProfit")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard?.topPlayers
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((player, index) => {
                    const actualRank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <tr
                        key={player.player}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRankIcon(actualRank)}
                          </div>
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        <AddressDisplay address={player.player} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <span className="text-green-600">
                          {player.gamesWon}W
                        </span>
                        {" / "}
                        <span className="text-red-600">
                          {player.gamesLost}L
                        </span>
                        {" / "}
                        <span className="text-gray-600">
                          {player.gamesDrawn}D
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {getWinRate(
                          player.gamesWon,
                          player.gamesLost,
                          player.gamesDrawn
                        )}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-green-600 font-medium">
                        +{formatSUI(player.totalProfit)} SUI
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600 font-medium">
                        -{formatSUI(player.totalLoss)} SUI
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-sm font-bold ${
                          player.netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {player.netProfit >= 0 ? "+" : ""}
                        {formatSUI(player.netProfit)} SUI
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!leaderboard?.topPlayers ||
            leaderboard.topPlayers.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No games completed yet</p>
              <p className="text-sm">Be the first to play and top the leaderboard!</p>
            </div>
          )}

          {/* Pagination Controls */}
          {leaderboard?.topPlayers && leaderboard.topPlayers.length > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, leaderboard.topPlayers.length)} of{" "}
                  {leaderboard.topPlayers.length} players
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded-lg transition-all ${
                          currentPage === page
                            ? "bg-black text-white"
                            : "text-gray-600 hover:text-black border border-gray-300 hover:border-black"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Live Blockchain Data:</strong> This leaderboard shows real-time statistics 
            from the Sui blockchain. Data is pulled directly from on-chain events and game 
            contracts. The leaderboard updates automatically after each game completion.
            {leaderboard?.totalGames === 0 && (
              <span className="block mt-2">
                No games have been played yet. Be the first to play and top the leaderboard!
              </span>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
