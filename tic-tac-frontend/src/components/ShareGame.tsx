"use client";

import { useState } from "react";
import { Copy, Check, Share2, Eye, Users, Twitter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ShareGameProps {
  gameLink: string;
  viewerLink: string;
  onClose: () => void;
  stakeAmount?: number;
  mode?: number;
}

export function ShareGame({
  gameLink,
  viewerLink,
  onClose,
  stakeAmount = 0,
  mode = 0,
}: ShareGameProps) {
  const { t } = useLanguage();
  const [copiedGame, setCopiedGame] = useState(false);
  const [copiedViewer, setCopiedViewer] = useState(false);

  const copyToClipboard = async (text: string, type: "game" | "viewer") => {
    try {
      // Try using the Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      if (type === "game") {
        setCopiedGame(true);
        setTimeout(() => setCopiedGame(false), 2000);
      } else {
        setCopiedViewer(true);
        setTimeout(() => setCopiedViewer(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      // Still show feedback even if copy failed
      if (type === "game") {
        setCopiedGame(true);
        setTimeout(() => setCopiedGame(false), 2000);
      } else {
        setCopiedViewer(true);
        setTimeout(() => setCopiedViewer(false), 2000);
      }
    }
  };

  const shareToTwitter = () => {
    const isCompetitive = mode === 1;
    const suiAmount = stakeAmount / 1_000_000_000;
    const totalPot = suiAmount * 2;

    let message = "";
    if (isCompetitive && stakeAmount > 0) {
      message = `🎮 Challenge accepted! Playing Tic-Tac-Toe on @SuiNetwork for ${suiAmount.toFixed(
        2
      )} SUI!\n\n💰 Prize pool: ${totalPot.toFixed(
        2
      )} SUI\n🎯 Join the game: ${gameLink}\n👀 Watch live: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
    } else {
      message = `🎮 Let's play Tic-Tac-Toe on @SuiNetwork!\n\n🏆 Win NFT trophies\n🎯 Join my game: ${gameLink}\n👀 Watch live: ${viewerLink}\n\n#Web3Gaming #Sui #TicTacToe @giverep`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      message
    )}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Share2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">
            {t("gameCreated")}
          </h2>
          <p className="text-sm sm:text-base text-black">{t("shareLinksToStart")}</p>
        </div>

        <div className="space-y-4">
          {/* Game Link */}
          <div className="border-2 border-black rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <h3 className="font-semibold text-black text-sm sm:text-base">{t("forOpponents")}</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gameLink}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-black rounded text-xs sm:text-sm font-mono text-black select-all cursor-text"
              />
              <button
                onClick={() => copyToClipboard(gameLink, "game")}
                className="p-1.5 sm:p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors active:scale-95"
                title="Copy to clipboard"
              >
                {copiedGame ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-black mt-2">{t("shareLinkToJoin")}</p>
          </div>

          {/* Viewer Link */}
          <div className="border-2 border-black rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <h3 className="font-semibold text-black text-sm sm:text-base">{t("forSpectators")}</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={viewerLink}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-black rounded text-xs sm:text-sm font-mono text-black select-all cursor-text"
              />
              <button
                onClick={() => copyToClipboard(viewerLink, "viewer")}
                className="p-1.5 sm:p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors active:scale-95"
                title="Copy to clipboard"
              >
                {copiedViewer ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-black mt-2">{t("shareLinkToWatch")}</p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
          <button
            onClick={shareToTwitter}
            className="w-full bg-[#1DA1F2] text-white py-2.5 sm:py-3 rounded-lg hover:bg-[#1a8cd8] transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 modern-button text-sm sm:text-base"
          >
            <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            {t("shareOnTwitter")}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-2.5 sm:py-3 rounded-lg hover:bg-black transition-colors text-sm sm:text-base"
          >
            {t("continueWaiting")}
          </button>
        </div>
      </div>
    </div>
  );
}
