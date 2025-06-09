'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { getSuiNSService } from '@/services/suins';
import { Check, X, Loader2 } from 'lucide-react';

interface SuiNSInputProps {
  value: string;
  onChange: (value: string) => void;
  onResolvedAddress?: (address: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeAddress?: string; // Address to exclude (e.g., current user)
}

export function SuiNSInput({
  value,
  onChange,
  onResolvedAddress,
  placeholder = "Enter address or name.sui",
  className = "",
  disabled = false,
  excludeAddress
}: SuiNSInputProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const suiClient = useSuiClient();

  const isValidSuiNSName = (input: string): boolean => {
    // Check if it's a potential SuiNS name
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]?$/i.test(input.replace(/\.sui$/i, ''));
  };

  const isValidAddress = (input: string): boolean => {
    // Check if it's a valid Sui address (0x followed by 64 hex characters)
    return /^0x[a-fA-F0-9]{64}$/.test(input);
  };

  const resolveInput = useCallback(async (input: string) => {
    if (!input.trim()) {
      setResolvedAddress(null);
      setError(null);
      onResolvedAddress?.(null);
      return;
    }

    // If it's already a valid address
    if (isValidAddress(input)) {
      if (excludeAddress && input.toLowerCase() === excludeAddress.toLowerCase()) {
        setError("Cannot use your own address");
        setResolvedAddress(null);
        onResolvedAddress?.(null);
      } else {
        setResolvedAddress(input);
        setError(null);
        onResolvedAddress?.(input);
      }
      return;
    }

    // If it might be a SuiNS name
    const nameToResolve = input.toLowerCase().replace(/\.sui$/i, '');
    if (isValidSuiNSName(nameToResolve)) {
      setIsResolving(true);
      setError(null);
      
      try {
        const service = getSuiNSService(suiClient);
        const address = await service.getAddress(nameToResolve);
        
        if (address) {
          if (excludeAddress && address.toLowerCase() === excludeAddress.toLowerCase()) {
            setError("Cannot use your own address");
            setResolvedAddress(null);
            onResolvedAddress?.(null);
          } else {
            setResolvedAddress(address);
            setError(null);
            onResolvedAddress?.(address);
          }
        } else {
          setError("Name not found");
          setResolvedAddress(null);
          onResolvedAddress?.(null);
        }
      } catch (err) {
        console.error("Error resolving SuiNS name:", err);
        setError("Failed to resolve name");
        setResolvedAddress(null);
        onResolvedAddress?.(null);
      } finally {
        setIsResolving(false);
      }
    } else {
      setError("Invalid address or name");
      setResolvedAddress(null);
      onResolvedAddress?.(null);
    }
  }, [suiClient, excludeAddress, onResolvedAddress]);

  // Debounce the resolution
  useEffect(() => {
    const timer = setTimeout(() => {
      resolveInput(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, resolveInput]);

  const getInputBorderClass = () => {
    if (error) return 'border-red-500 focus:border-red-500';
    if (resolvedAddress) return 'border-green-500 focus:border-green-500';
    return 'border-gray-300 dark:border-gray-700 focus:border-blue-500';
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none transition-colors font-mono text-sm text-black placeholder-gray-400 ${getInputBorderClass()} ${className}`}
      />
      
      {/* Status indicator */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isResolving ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : error ? (
          <X className="w-5 h-5 text-red-500" />
        ) : resolvedAddress ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : null}
      </div>

      {/* Helper text */}
      {(error || resolvedAddress) && (
        <div className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-green-600'}`}>
          {error || (resolvedAddress && !isValidAddress(value) && (
            <span>Resolved to: {resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-8)}</span>
          ))}
        </div>
      )}
    </div>
  );
}