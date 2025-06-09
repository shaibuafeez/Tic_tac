'use client';

import { useParams } from 'next/navigation';
import { GameViewer } from '@/components/GameViewer';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function ViewerPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed top-4 left-4 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-black transition-all z-50 bg-white shadow-sm"
      >
        <Home className="w-4 h-4" />
        Home
      </Link>
      <GameViewer gameId={gameId} />
    </div>
  );
}