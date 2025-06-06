import { SuiTransactionBlockResponse } from '@mysten/sui/client';

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

export function extractGameObjectId(effects: any): string | null {
  try {
    // If effects is already parsed
    if (effects.created) {
      const sharedObject = effects.created.find((obj: any) => 
        obj.owner === 'Shared' || (obj.owner && obj.owner.Shared)
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