"use client";

import {
  Trophy,
  Loader2,
  AlertCircle,
  Users,
  Twitter,
  XCircle,
} from "lucide-react";
import { GAME_MODE } from "@/config/constants";
import { BalanceCheck } from "./BalanceCheck";
import { useBalance } from "@/hooks/useBalance";
import { useLanguage } from "@/hooks/useLanguage";

interface JoinGameProps {
  gameId: string;
  stakeAmount: number;
  creator: string;
  mode: number;
  onJoin: () => void;
  onCancel: () => void;
  onCancelGame?: () => void;
  isLoading: boolean;
  currentPlayer: string;
}

export function JoinGame({
  gameId,
  stakeAmount,
  creator,
  mode,
  onJoin,
  onCancel,
  onCancelGame,
  isLoading,
  currentPlayer,
}: JoinGameProps) {
  const { t } = useLanguage();
  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(2);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isCreator = creator === currentPlayer;
  const isCompetitive = mode === GAME_MODE.COMPETITIVE;
  const { checkSufficientBalance } = useBalance();
  const hasSufficientBalance = isCompetitive
    ? checkSufficientBalance(stakeAmount)
    : true;

  const shareToTwitter = () => {
    const suiAmount = stakeAmount / 1_000_000_000;
    const winAmount = suiAmount * 2 * 0.9;
    const gameLink = `${window.location.origin}/game/${gameId}`;
    const viewerLink = `${window.location.origin}/view/${gameId}`;

    let message = "";
    if (isCreator) {
      message =
        isCompetitive && stakeAmount > 0
          ? `🎮 Who wants to play for ${suiAmount.toFixed(
              2
            )} SUI? I'm waiting on @SuiNetwork!\n\n💰 Winner takes ${winAmount.toFixed(
              2
            )} SUI\n🎯 Join my game: ${gameLink}\n👀 Watch live: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`
          : `🎮 Who's up for a game of Tic-Tac-Toe on @SuiNetwork?\n\n🏆 Win NFT trophies\n🎯 Join my game: ${gameLink}\n👀 Watch live: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
    } else {
      message =
        isCompetitive && stakeAmount > 0
          ? `🎮 About to play for ${suiAmount.toFixed(
              2
            )} SUI on @SuiNetwork!\n\n💰 Winner takes ${winAmount.toFixed(
              2
            )} SUI\n👀 Watch us play: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`
          : `🎮 Joining a Tic-Tac-Toe game on @SuiNetwork!\n\n🏆 Playing for NFT trophies\n👀 Watch us play: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      message
    )}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-8 max-w-md w-full animate-fade-in shadow-lg">
      <div className="text-center mb-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isCompetitive
              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 animate-glow"
              : "bg-gradient-to-br from-blue-400 to-blue-600"
          } shadow-lg`}
        >
          {isCompetitive ? (
            <Trophy className="w-8 h-8 text-white" />
          ) : (
            <Users className="w-8 h-8 text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isCreator
            ? `${t("yourGame")} (${
                isCompetitive ? t("competitiveGame") : t("friendlyGame")
              })`
            : `${t("joinGame")} (${
                isCompetitive ? t("competitiveGame") : t("friendlyGame")
              })`}
        </h2>
        <p className="text-black">
          {isCreator
            ? t("waitingForOpponentToJoin")
            : isCompetitive
            ? t("invitedCompetitive")
            : t("invitedFriendly")}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-white border border-black rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-black">{t("gameId")}</span>
            <span className="text-sm font-mono text-black">
              {truncateAddress(gameId)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-black">{t("creator")}</span>
            <span className="text-sm font-mono text-black">
              {isCreator ? t("you") : truncateAddress(creator)}
            </span>
          </div>
          {isCompetitive && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-black">{t("stakeRequired")}</span>
              <span className="text-lg font-bold text-black">
                {formatSUI(stakeAmount)} SUI
              </span>
            </div>
          )}
        </div>

        {isCompetitive && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">{t("prizeDistribution")}</p>
                <p>
                  {t("winner")}: {formatSUI(stakeAmount * 2 * 0.9)} SUI (90%)
                </p>
                <p>
                  {t("platformFee")}: {formatSUI(stakeAmount * 2 * 0.1)} SUI
                  (10%)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {!isCreator && isCompetitive && !hasSufficientBalance && (
          <BalanceCheck
            requiredAmount={stakeAmount}
            actionText="join this competitive game"
          />
        )}

        {!isCreator && (
          <button
            onClick={onJoin}
            disabled={isLoading || (isCompetitive && !hasSufficientBalance)}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-black transition-all duration-200 disabled:bg-white disabled:text-black disabled:cursor-not-allowed modern-button active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spinner" />
                {t("joiningGame")}
              </span>
            ) : (
              `${t("joinGame")}${
                isCompetitive ? ` (${formatSUI(stakeAmount)} SUI)` : ""
              }`
            )}
          </button>
        )}

        {isCreator && (
          <div className="space-y-2">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-800">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <span>{t("waitingForOpponentToJoin")}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">{t("shareGameLink")}</p>
            </div>
            <button
              onClick={shareToTwitter}
              className="w-full bg-[#1DA1F2] text-white py-3 rounded-lg hover:bg-[#1a8cd8] transition-all duration-200 flex items-center justify-center gap-2 modern-button"
            >
              <Twitter className="w-5 h-5" />
              {t("shareOnTwitter")}
            </button>
          </div>
        )}

        {isCreator && isCompetitive && stakeAmount > 0 && onCancelGame && (
          <button
            onClick={onCancelGame}
            disabled={isLoading}
            className="w-full py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-5 h-5" />
            {t("cancelGame")} & {t("getSuiBack")} {formatSUI(stakeAmount)} SUI
          </button>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 border-2 border-black rounded-lg hover:border-black hover:bg-black hover:text-white transition-all duration-200 hover:shadow-md active:scale-95"
        >
          {t("backToMenu")}
        </button>
      </div>
    </div>
  );
}
