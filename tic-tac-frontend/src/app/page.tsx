"use client";

import { TicTacToeGame } from "@/components/TicTacToeGame";
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationBadge } from "@/components/NotificationBadge";
import { GlobalTimer } from "@/components/GlobalTimer";
import { LanguageTest } from "@/components/LanguageTest";
import { useLanguage } from "@/hooks/useLanguage";
import { CONTRACT_CONFIG } from "@/config/constants";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { t } = useLanguage();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [hasAdminCap, setHasAdminCap] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!account) {
        setHasAdminCap(false);
        return;
      }

      try {
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
    };

    checkAdminAccess();
  }, [account, suiClient]);

  return (
    <div className="min-h-screen p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("gameTitle")}
            </h1>
            <p className="text-gray-600">{t("gameDescription")}</p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Link
                href="/leaderboard"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-black"
              >
                {t("leaderboard")}
              </Link>
              {hasAdminCap && (
                <Link
                  href="/admin"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all bg-white text-black"
                >
                  {t("admin")}
                </Link>
              )}
              <NotificationBadge />
              <GlobalTimer />
            </nav>
            <LanguageSelector />
            <ConnectButton />
          </div>
        </header>

        <main className="flex justify-center">
          <TicTacToeGame />
        </main>

        {/* Temporary language test component */}
        <LanguageTest />
      </div>
    </div>
  );
}
