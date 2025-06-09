"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TicTacToeGame } from "@/components/TicTacToeGame";
import { Loader2 } from "lucide-react";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate game ID format
    if (!gameId || !gameId.startsWith("0x")) {
      setError("Invalid game ID");
      setIsLoading(false);
      return;
    }

    // For now, we'll just pass the game ID to the TicTacToeGame component
    // In production, you'd fetch the game details here
    setIsLoading(false);
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white border-2 border-red-300 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <main className="flex justify-center">
          <TicTacToeGame gameId={gameId} />
        </main>
      </div>
    </div>
  );
}
