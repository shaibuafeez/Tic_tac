'use client';

import { useState } from 'react';
import { useSuiNS } from '@/services/suins';

interface AddressDisplayProps {
  address: string;
  showFull?: boolean;
  className?: string;
  copyable?: boolean;
  showTooltip?: boolean;
}

export function AddressDisplay({ 
  address, 
  showFull = false, 
  className = '', 
  copyable = true,
  showTooltip = true 
}: AddressDisplayProps) {
  const { name, isLoading } = useSuiNS(address);
  const [showCopied, setShowCopied] = useState(false);
  const [hovering, setHovering] = useState(false);

  const truncateAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayValue = name ? `${name}.sui` : (showFull ? address : truncateAddress(address));

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-24"></span>
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <span 
        className={`font-mono text-xs sm:text-sm ${copyable ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''} ${className}`}
        onClick={handleCopy}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {displayValue}
      </span>
      
      {/* Tooltip */}
      {showTooltip && (hovering || showCopied) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {showCopied ? (
              <div>Copied!</div>
            ) : (
              <>
                {name && (
                  <div className="font-semibold mb-1">{name}.sui</div>
                )}
                <div className="font-mono">{address}</div>
                {copyable && (
                  <div className="mt-1 text-gray-300">Click to copy</div>
                )}
              </>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="w-0 h-0 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}