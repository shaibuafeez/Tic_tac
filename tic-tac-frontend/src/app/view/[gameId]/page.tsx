'use client';

import { useParams } from 'next/navigation';
import { GameViewer } from '@/components/GameViewer';

export default function ViewerPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  return <GameViewer gameId={gameId} />;
}