'use client';

import { TicTacToeGame } from '@/components/TicTacToeGame';
import { ConnectButton } from '@mysten/dapp-kit';

export default function Home() {
  return (
    <div className="min-h-screen p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              Sui Tic-Tac-Toe
            </h1>
            <p className="text-gray-600">
              A decentralized tic-tac-toe game built on Sui blockchain
            </p>
          </div>
          <ConnectButton />
        </header>
        
        <main className="flex justify-center">
          <TicTacToeGame />
        </main>
      </div>
    </div>
  );
}