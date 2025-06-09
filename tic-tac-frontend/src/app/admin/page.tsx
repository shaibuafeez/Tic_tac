"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  Shield,
  DollarSign,
  Trophy,
  Loader2,
  Home,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { CONTRACT_CONFIG } from "@/config/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { MobileMenu } from "@/components/MobileMenu";

interface TreasuryData {
  balance: number;
  totalFeesCollected: number;
}

interface PlatformStats {
  totalGames: number;
  activeGames: number;
  totalPlayers: number;
  totalVolume: number;
}

export default function AdminPage() {
  const { t } = useLanguage();
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasAdminCap, setHasAdminCap] = useState(false);

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const checkAdminAccess = useCallback(async () => {
    if (!account) return;

    try {
      // Check if user owns AdminCap
      const { data } = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::AdminCap`,
        },
      });

      setHasAdminCap(data.length > 0);
    } catch (error) {
      console.error("Error checking admin access:", error);
      setHasAdminCap(false);
    }
  }, [account, suiClient]);

  const fetchTreasuryData = useCallback(async () => {
    try {
      
      // Try to get the treasury object directly by ID first
      if (CONTRACT_CONFIG.TREASURY_ID) {
        const treasuryObject = await suiClient.getObject({
          id: CONTRACT_CONFIG.TREASURY_ID,
          options: {
            showContent: true,
            showType: true,
            showOwner: true,
          },
        });


        if (
          treasuryObject.data?.content &&
          "fields" in treasuryObject.data.content
        ) {
          const fields = treasuryObject.data.content.fields as {
            balance?: number | { fields?: { balance?: number } };
            total_fees_collected?: number;
            totalFeesCollected?: number;
          };
          
          // The balance might be in a nested structure
          let balance = 0;
          let totalFeesCollected = 0;
          
          // Check if balance is in a coin field
          if (fields.balance) {
            if (typeof fields.balance === 'object' && fields.balance.fields) {
              // Nested coin structure
              balance = Number(fields.balance.fields.balance || 0);
            } else {
              balance = Number(fields.balance || 0);
            }
          }
          
          totalFeesCollected = Number(fields.total_fees_collected || fields.totalFeesCollected || 0);
          
          
          setTreasury({
            balance,
            totalFeesCollected,
          });
          return;
        }
      }

      // If direct fetch didn't work, try searching for treasury objects
      
      // Try different owner patterns
      const searchPatterns = [
        CONTRACT_CONFIG.PACKAGE_ID,
        "0x0000000000000000000000000000000000000000000000000000000000000000", // Shared object
      ];
      
      for (const owner of searchPatterns) {
        const treasuryObjects = await suiClient.getOwnedObjects({
          owner,
          filter: {
            StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::Treasury`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        
        if (treasuryObjects.data.length > 0) {
          const treasuryData = treasuryObjects.data[0];
          
          if (treasuryData.data?.content && "fields" in treasuryData.data.content) {
            const fields = treasuryData.data.content.fields as {
            balance?: number | { fields?: { balance?: number } };
            total_fees_collected?: number;
            totalFeesCollected?: number;
          };
            
            let balance = 0;
            let totalFeesCollected = 0;
            
            if (fields.balance) {
              if (typeof fields.balance === 'object' && fields.balance.fields) {
                balance = Number(fields.balance.fields.balance || 0);
              } else {
                balance = Number(fields.balance || 0);
              }
            }
            
            totalFeesCollected = Number(fields.total_fees_collected || fields.totalFeesCollected || 0);
            
            setTreasury({
              balance,
              totalFeesCollected,
            });
            return;
          }
        }
      }

      // If still no data, set to zero (real data)
      setTreasury({
        balance: 0,
        totalFeesCollected: 0,
      });
    } catch (error) {
      console.error("Error fetching treasury:", error);
      // Set to zero instead of mock data
      setTreasury({
        balance: 0,
        totalFeesCollected: 0,
      });
    }
  }, [suiClient]);

  const fetchPlatformStats = useCallback(async () => {
    try {
      // Fetch real game events to calculate statistics
      const gameCreatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
        },
        limit: 1000,
      });

      const gameCompletedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCompleted`,
        },
        limit: 1000,
      });

      // Get all game objects to count active games
      const allGames = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::GameCreated`,
        },
        limit: 50,
        order: "descending",
      });

      // Count active games by checking recent games
      let activeGamesCount = 0;
      const uniquePlayers = new Set<string>();
      let totalVolume = 0;

      // Process game created events
      for (const event of gameCreatedEvents.data) {
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
      }

      // Process game completed events
      for (const event of gameCompletedEvents.data) {
        if (event.parsedJson) {
          const data = event.parsedJson as {
            winner?: string;
            loser?: string;
          };
          if (data.winner) uniquePlayers.add(data.winner);
          if (data.loser) uniquePlayers.add(data.loser);
        }
      }

      // Check recent games for active status
      for (const event of allGames.data) {
        if (event.parsedJson) {
          const data = event.parsedJson as {
            game_id?: string;
          };
          const gameId = data.game_id;
          
          if (!gameId) continue;
          
          try {
            const gameObject = await suiClient.getObject({
              id: gameId,
              options: { showContent: true },
            });

            if (gameObject.data?.content && "fields" in gameObject.data.content) {
              const fields = gameObject.data.content.fields as {
                status?: string;
              };
              // Status 1 = WAITING, Status 2 = ACTIVE
              if (fields.status === "1" || fields.status === "2") {
                activeGamesCount++;
              }
            }
          } catch {
            // Game might be deleted or inaccessible
          }
        }
      }

      setStats({
        totalGames: gameCreatedEvents.data.length,
        activeGames: activeGamesCount,
        totalPlayers: uniquePlayers.size,
        totalVolume: totalVolume,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set to zero instead of mock data
      setStats({
        totalGames: 0,
        activeGames: 0,
        totalPlayers: 0,
        totalVolume: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [suiClient]);

  useEffect(() => {
    const runAdminChecks = async () => {
      if (account) {
        await checkAdminAccess();
        await fetchTreasuryData();
        await fetchPlatformStats();
      }
    };
    runAdminChecks();
  }, [account, checkAdminAccess, fetchTreasuryData, fetchPlatformStats]);

  const handleWithdraw = async () => {
    if (!account || !withdrawAmount || !recipientAddress) return;

    const amountInMist = parseFloat(withdrawAmount) * 1_000_000_000;
    if (amountInMist <= 0 || amountInMist > (treasury?.balance || 0)) {
      alert("Invalid withdrawal amount");
      return;
    }

    setIsWithdrawing(true);
    try {
      const transaction = new Transaction();

      // Get the admin cap from the user's owned objects
      const adminCapObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::AdminCap`,
        },
      });

      if (adminCapObjects.data.length === 0) {
        alert("Admin capability not found in your wallet");
        return;
      }

      const ADMIN_CAP_ID = adminCapObjects.data[0].data?.objectId || "";
      const TREASURY_ID = CONTRACT_CONFIG.TREASURY_ID;

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::withdraw_fees`,
        arguments: [
          transaction.object(ADMIN_CAP_ID),
          transaction.object(TREASURY_ID),
          transaction.pure.u64(amountInMist),
          transaction.pure.address(recipientAddress),
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Withdrawal successful:", result);
            alert(
              `Successfully withdrew ${withdrawAmount} SUI to ${recipientAddress}`
            );
            setWithdrawAmount("");
            setRecipientAddress("");
            fetchTreasuryData();
          },
          onError: (error) => {
            console.error("Withdrawal failed:", error);
            alert("Failed to withdraw funds. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Error withdrawing:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(2);
  };

  if (!account) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">{t("adminPanel")}</h2>
            <p className="text-gray-600">{t("adminAccessRequiresWallet")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>{t("loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!hasAdminCap) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">{t("accessDenied")}</h2>
            <p className="text-gray-600 mb-4">{t("adminCapRequired")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Home className="w-4 h-4" />
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black flex items-center gap-3">
              <Shield className="w-6 md:w-8 h-6 md:h-8" />
              {t("adminPanel")}
            </h1>
            {/* Desktop Home Link */}
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all"
            >
              <Home className="w-4 h-4" />
              {t("home")}
            </Link>
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
          <p className="text-gray-600">{t("manageTreasuryAndPlatform")}</p>
        </div>

        {/* Treasury Info */}
        <div className="bg-white border-2 border-black rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            {t("treasuryBalance")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">
                {t("currentBalance")}
              </p>
              <p className="text-2xl font-bold text-green-800">
                {formatSUI(treasury?.balance || 0)} SUI
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">
                {t("totalFeesCollected")}
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {formatSUI(treasury?.totalFeesCollected || 0)} SUI
              </p>
            </div>
          </div>

          {/* Info about treasury */}
          {(treasury?.balance === 0 && treasury?.totalFeesCollected === 0) && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The treasury shows 0 balance because the smart contract needs to be updated to collect platform fees. 
                Currently, all prize money goes directly to winners. A contract upgrade is required to enable fee collection.
              </p>
            </div>
          )}

          {/* Withdrawal Form */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">{t("withdrawFunds")}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("amount")} (SUI)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-black"
                  min="0"
                  max={formatSUI(treasury?.balance || 0)}
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("recipientAddress")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none font-mono text-sm text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setRecipientAddress(account?.address || "")}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:border-black transition-all text-sm text-black"
                  >
                    {t("useMyAddress")}
                  </button>
                </div>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || !recipientAddress}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("processing")}
                  </span>
                ) : (
                  t("withdrawFunds")
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="bg-white border-2 border-black rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            {t("platformInfo")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t("totalGames")}</p>
              <p className="text-xl font-bold text-black">{stats?.totalGames || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t("activeGames")}</p>
              <p className="text-xl font-bold text-black">{stats?.activeGames || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t("totalPlayers")}</p>
              <p className="text-xl font-bold text-black">{stats?.totalPlayers || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t("totalVolume")}</p>
              <p className="text-xl font-bold text-black">
                {formatSUI(stats?.totalVolume || 0)} SUI
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
