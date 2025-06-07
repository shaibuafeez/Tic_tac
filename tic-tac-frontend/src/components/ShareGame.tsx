"use client";

import { useState } from "react";
import { Copy, Check, Share2, Eye, Users, Twitter } from "lucide-react";

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
  const [copiedGame, setCopiedGame] = useState(false);
  const [copiedViewer, setCopiedViewer] = useState(false);

  const copyToClipboard = async (text: string, type: "game" | "viewer") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "game") {
        setCopiedGame(true);
        setTimeout(() => setCopiedGame(false), 2000);
      } else {
        setCopiedViewer(true);
        setTimeout(() => setCopiedViewer(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareToTwitter = () => {
    const isCompetitive = mode === 1;
    const suiAmount = stakeAmount / 1_000_000_000;
    const winAmount = suiAmount * 2 * 0.9;

    let message = "";
    if (isCompetitive && stakeAmount > 0) {
      message = `🎮 Challenge accepted! Playing Tic-Tac-Toe on @SuiNetwork for ${suiAmount.toFixed(
        2
      )} SUI!\n\n💰 Winner takes ${winAmount.toFixed(
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
      <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Game Created!</h2>
          <p className="text-gray-600">Share these links to start playing</p>
        </div>

        <div className="space-y-4">
          {/* Game Link */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">For Opponents</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gameLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(gameLink, "game")}
                className="p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                {copiedGame ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Share this link with someone to join your game
            </p>
          </div>

          {/* Viewer Link */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">For Spectators</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={viewerLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(viewerLink, "viewer")}
                className="p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                {copiedViewer ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Share this link for people to watch the game live
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={shareToTwitter}
            className="w-full bg-[#1DA1F2] text-white py-3 rounded-lg hover:bg-[#1a8cd8] transition-all duration-200 flex items-center justify-center gap-2 modern-button"
          >
            <Twitter className="w-5 h-5" />
            Share on Twitter
          </button>
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Continue Waiting
          </button>
        </div>
      </div>
    </div>
  );
}
