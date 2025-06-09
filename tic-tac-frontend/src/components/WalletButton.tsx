'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { Wallet } from 'lucide-react';

export function WalletButton() {
  return (
    <div className="inline-block">
      <style jsx>{`
        :global(.wallet-connect-wrapper button) {
          background: #000000 !important;
          color: #ffffff !important;
          border: 2px solid #000000 !important;
          border-radius: 12px !important;
          padding: 12px 20px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: all 0.2s ease !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 10 !important;
          min-width: 160px !important;
          cursor: pointer !important;
        }
        
        @media (min-width: 640px) {
          :global(.wallet-connect-wrapper button) {
            padding: 16px 32px !important;
            font-size: 18px !important;
            min-width: 200px !important;
          }
        }
        
        :global(.wallet-connect-wrapper button *) {
          color: #ffffff !important;
          fill: #ffffff !important;
          stroke: #ffffff !important;
        }
        
        :global(.wallet-connect-wrapper button svg) {
          color: #ffffff !important;
          fill: #ffffff !important;
        }
        
        :global(.wallet-connect-wrapper button span) {
          color: #ffffff !important;
        }
        
        :global(.wallet-connect-wrapper button div) {
          color: #ffffff !important;
        }
        
        :global(.wallet-connect-wrapper button:hover) {
          background: #1a1a1a !important;
          border-color: #1a1a1a !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          cursor: pointer !important;
        }
        
        :global(.wallet-connect-wrapper button:hover *) {
          color: #ffffff !important;
          cursor: pointer !important;
        }
        
        :global(.wallet-connect-wrapper button:active) {
          transform: translateY(0) !important;
        }
        
        :global(.wallet-connect-wrapper button::before),
        :global(.wallet-connect-wrapper button::after) {
          display: none !important;
        }
        
        :global(.wallet-connect-wrapper) {
          position: relative !important;
          z-index: 10 !important;
        }
        
        :global(.wallet-connect-wrapper *) {
          cursor: pointer !important;
        }
      `}</style>
      <div className="wallet-connect-wrapper">
        <ConnectButton 
          connectText={
            <div className="flex items-center gap-2 sm:gap-3" style={{ color: '#ffffff' }}>
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ffffff' }} />
              <span className="text-sm sm:text-lg" style={{ color: '#ffffff' }}>Connect Wallet</span>
            </div>
          }
        />
      </div>
    </div>
  );
}