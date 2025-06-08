import { SuiTransactionBlockResponse } from '@mysten/sui/client';

// Helper function to check if an address is the zero address
export const isZeroAddress = (address: unknown): boolean => {
  if (!address) return true;
  const addrStr = String(address);
  return addrStr === '0x0' || 
         addrStr === '@0x0' || 
         addrStr === '0x0000000000000000000000000000000000000000' ||
         addrStr === '0x00' ||
         /^0x0+$/.test(addrStr); // Matches any number of zeros after 0x
};

export function parseTransactionEffects(result: SuiTransactionBlockResponse) {
  // Handle both digest-only results and full results
  if (typeof result === 'object' && result.effects) {
    // Parse created objects
    const created = result.effects.created || [];
    const sharedObjects = created.filter(obj => 
      obj.owner && typeof obj.owner === 'object' && 'Shared' in obj.owner
    );
    
    return {
      created,
      sharedObjects,
      allObjectIds: created.map(obj => obj.reference?.objectId).filter(Boolean)
    };
  }
  
  return {
    created: [],
    sharedObjects: [],
    allObjectIds: []
  };
}

export function extractGameObjectId(effects: unknown): string | null {
  try {
    // If effects is already parsed
    if (effects && typeof effects === 'object' && 'created' in effects && Array.isArray(effects.created)) {
      const sharedObject = effects.created.find((obj: Record<string, unknown>) => 
        obj.owner === 'Shared' || (obj.owner && typeof obj.owner === 'object' && 'Shared' in obj.owner)
      );
      return sharedObject?.reference?.objectId || null;
    }
    
    // If effects is a raw string or needs parsing
    // This handles different response formats
    return null;
  } catch (error) {
    console.error('Error extracting game object ID:', error);
    return null;
  }
}