"use client";

import { useState } from "react";
import { Users, Trophy, Loader2 } from "lucide-react";
import { GAME_MODE } from "@/config/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { SuiNSInput } from "./SuiNSInput";
import { AddressDisplay } from "./AddressDisplay";

interface GameModeSelectionProps {
  onSelectMode: (mode: number, stakeAmount?: number, invitedPlayer?: string) => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function GameModeSelection({
  onSelectMode,
  isLoading,
  currentPlayer,
}: GameModeSelectionProps) {
  const { t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("2");
  const [showStakeInput, setShowStakeInput] = useState(false);
  const [invitedPlayer, setInvitedPlayer] = useState("");
  const [resolvedInviteAddress, setResolvedInviteAddress] = useState<string | null>(null);

  const handleModeSelect = (mode: number) => {
    if (mode === GAME_MODE.COMPETITIVE) {
      setSelectedMode(mode);
      setShowStakeInput(true);
    } else {
      onSelectMode(mode);
    }
  };

  const handleConfirmCompetitive = () => {
    const stakeInMist = parseFloat(stakeAmount) * 1_000_000_000; // Convert SUI to MIST
    onSelectMode(GAME_MODE.COMPETITIVE, stakeInMist, resolvedInviteAddress || undefined);
  };


  if (showStakeInput && selectedMode === GAME_MODE.COMPETITIVE) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            {t("stakeAmount")}
          </h2>
          <p className="text-black">
            {t("setYourStakeAmount")}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              {t("stakeAmount")} (SUI)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg focus:border-black focus:outline-none transition-colors text-black"
              placeholder={t("enterStakeAmount")}
            />
            <p className="mt-2 text-sm text-gray-600">{t("minimumStake")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Invite Player (Optional)
            </label>
            <SuiNSInput
              value={invitedPlayer}
              onChange={setInvitedPlayer}
              onResolvedAddress={setResolvedInviteAddress}
              placeholder="Enter name.sui or 0x... (leave empty for open game)"
              excludeAddress={currentPlayer}
            />
          </div>

          {invitedPlayer.trim() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                <p>The invited player will receive a notification to join your game.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleConfirmCompetitive}
              disabled={isLoading || parseFloat(stakeAmount) < 0.1 || Boolean(invitedPlayer.trim() && resolvedInviteAddress === currentPlayer) || Boolean(invitedPlayer.trim() && invitedPlayer.includes('.') && !resolvedInviteAddress)}
              className="w-full bg-gray-900 text-white py-2.5 sm:py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed modern-button active:scale-95 text-sm sm:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  {t("creatingGame")}
                </span>
              ) : (
                t("createCompetitiveGame")
              )}
            </button>
            <button
              onClick={() => {
                setShowStakeInput(false);
                setSelectedMode(null);
              }}
              className="w-full py-3 border-2 border-black rounded-lg text-black hover:border-black hover:bg-black hover:text-white transition-colors"
            >
              {t("back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">
          {t("chooseGameMode")}
        </h2>
        <p className="text-black">
          Playing as <AddressDisplay address={currentPlayer} />
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleModeSelect(GAME_MODE.FRIENDLY)}
          disabled={isLoading}
          className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 text-left group hover:scale-[1.02] hover:shadow-lg active:scale-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-200 shadow-sm group-hover:shadow-md">
              <Users className="w-6 h-6 text-blue-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t("friendlyGame")}
              </h3>
              <p className="text-sm text-gray-600">
                Play for fun with no stakes. Perfect for practice or casual
                games.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleModeSelect(GAME_MODE.COMPETITIVE)}
          disabled={isLoading}
          className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 text-left group hover:scale-[1.02] hover:shadow-lg active:scale-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center group-hover:from-yellow-500 group-hover:to-yellow-600 transition-all duration-200 shadow-sm group-hover:shadow-md">
              <Trophy className="w-6 h-6 text-yellow-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t("competitiveGame")}
              </h3>
              <p className="text-sm text-gray-600">
                Put SUI at stake and compete for the prize pool.
              </p>
            </div>
          </div>
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 text-center animate-fade-in">
          <Loader2 className="w-6 h-6 animate-spinner mx-auto text-gray-600" />
          <p className="text-sm text-gray-600 mt-2 animate-pulse">Processing...</p>
        </div>
      )}
    </div>
  );
}
