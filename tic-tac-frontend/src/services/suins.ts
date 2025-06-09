import { SuiClient } from '@mysten/sui/client';
import { SUINS_CONFIG, CONTRACT_CONFIG } from '@/config/constants';

// Cache for resolved names
const nameCache = new Map<string, { name: string; timestamp: number }>();
const addressCache = new Map<string, { address: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Flag to disable SuiNS if it's not available
let suinsDisabled = false;

export class SuiNSService {
  private suiClient: SuiClient;
  private network: keyof typeof SUINS_CONFIG;

  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
    this.network = CONTRACT_CONFIG.NETWORK as keyof typeof SUINS_CONFIG;
  }

  // Get SuiNS name for an address
  async getName(address: string): Promise<string | null> {
    try {
      // Skip if SuiNS is disabled
      if (suinsDisabled) {
        return null;
      }

      // Check cache first
      const cached = nameCache.get(address);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.name;
      }

      // Query reverse registry
      const config = SUINS_CONFIG[this.network];
      
      // Use the Transaction API
      const { Transaction } = await import('@mysten/sui/transactions');
      const tx = new Transaction();
      
      // Call the reverse lookup function
      tx.moveCall({
        target: `${config.PACKAGE}::reverse_registry::reverse_lookup`,
        arguments: [
          tx.object(config.REGISTRY),
          tx.pure.address(address),
        ],
      });

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });

      if (result.results && result.results.length > 0) {
        const name = this.parseNameFromResult(result.results[0]);
        if (name) {
          // Cache the result
          nameCache.set(address, { name, timestamp: Date.now() });
          return name;
        }
      }

      return null;
    } catch (error) {
      // If package doesn't exist, disable SuiNS
      if (error instanceof Error && error.message?.includes('Package object does not exist')) {
        console.warn('SuiNS not available on this network, disabling SuiNS features');
        suinsDisabled = true;
      }
      console.error('Error resolving SuiNS name:', error);
      return null;
    }
  }

  // Resolve address from SuiNS name
  async getAddress(name: string): Promise<string | null> {
    try {
      // Skip if SuiNS is disabled
      if (suinsDisabled) {
        return null;
      }

      // Normalize name
      const normalizedName = name.toLowerCase().replace(/\.sui$/, '');
      
      // Check cache first
      const cached = addressCache.get(normalizedName);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.address;
      }

      const config = SUINS_CONFIG[this.network];
      
      // Use the Transaction API
      const { Transaction } = await import('@mysten/sui/transactions');
      const tx = new Transaction();
      
      // Call the registry lookup function
      tx.moveCall({
        target: `${config.PACKAGE}::registry::lookup`,
        arguments: [
          tx.object(config.REGISTRY),
          tx.pure.string(normalizedName),
        ],
      });

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      if (result.results && result.results.length > 0) {
        const address = this.parseAddressFromResult(result.results[0]);
        if (address) {
          // Cache the result
          addressCache.set(normalizedName, { address, timestamp: Date.now() });
          return address;
        }
      }

      return null;
    } catch (error) {
      // If package doesn't exist, disable SuiNS
      if (error instanceof Error && error.message?.includes('Package object does not exist')) {
        console.warn('SuiNS not available on this network, disabling SuiNS features');
        suinsDisabled = true;
      }
      console.error('Error resolving SuiNS address:', error);
      return null;
    }
  }

  // Batch resolve multiple addresses to names
  async getNames(addresses: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Skip if SuiNS is disabled
    if (suinsDisabled) {
      return results;
    }
    
    // Check cache and filter out what needs to be fetched
    const toFetch: string[] = [];
    for (const address of addresses) {
      const cached = nameCache.get(address);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.set(address, cached.name);
      } else {
        toFetch.push(address);
      }
    }

    // Fetch missing names in parallel (with a limit)
    const BATCH_SIZE = 10;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const promises = batch.map(addr => this.getName(addr));
      const names = await Promise.all(promises);
      
      batch.forEach((addr, index) => {
        const name = names[index];
        if (name) {
          results.set(addr, name);
        }
      });
    }

    return results;
  }

  // Format display name (shows SuiNS name or truncated address)
  async formatAddress(address: string): Promise<string> {
    const name = await this.getName(address);
    if (name) {
      return `${name}.sui`;
    }
    return this.truncateAddress(address);
  }

  // Helper to truncate address
  truncateAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Parse name from Move call result
  private parseNameFromResult(result: { returnValues?: unknown[] }): string | null {
    try {
      if (result && result.returnValues && result.returnValues.length > 0) {
        const value = result.returnValues[0];
        if (Array.isArray(value) && value.length > 0) {
          // Convert bytes to string
          const bytes = value[0];
          if (bytes && bytes.length > 0) {
            return new TextDecoder().decode(new Uint8Array(bytes));
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing name result:', error);
      return null;
    }
  }

  // Parse address from Move call result
  private parseAddressFromResult(result: { returnValues?: unknown[] }): string | null {
    try {
      if (result && result.returnValues && result.returnValues.length > 0) {
        const value = result.returnValues[0];
        if (Array.isArray(value) && value.length > 0) {
          return value[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing address result:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    nameCache.clear();
    addressCache.clear();
  }
}

// Singleton instance
let suinsService: SuiNSService | null = null;

export function getSuiNSService(suiClient: SuiClient): SuiNSService {
  if (!suinsService) {
    suinsService = new SuiNSService(suiClient);
  }
  return suinsService;
}

// React hook for using SuiNS
import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';

export function useSuiNS(address: string | null | undefined) {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const suiClient = useSuiClient();

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }

    const fetchName = async () => {
      setIsLoading(true);
      try {
        const service = getSuiNSService(suiClient);
        const resolvedName = await service.getName(address);
        setName(resolvedName);
      } catch (error) {
        console.error('Error in useSuiNS hook:', error);
        setName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchName();
  }, [address, suiClient]);

  return { name, isLoading };
}

// Hook for batch resolution
export function useSuiNSBatch(addresses: string[]) {
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const suiClient = useSuiClient();

  useEffect(() => {
    if (addresses.length === 0) {
      setNames(new Map());
      return;
    }

    const fetchNames = async () => {
      setIsLoading(true);
      try {
        const service = getSuiNSService(suiClient);
        const resolvedNames = await service.getNames(addresses);
        setNames(resolvedNames);
      } catch (error) {
        console.error('Error in useSuiNSBatch hook:', error);
        setNames(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [addresses.join(','), suiClient]); // eslint-disable-line react-hooks/exhaustive-deps

  return { names, isLoading };
}