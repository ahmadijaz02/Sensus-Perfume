/**
 * Storage utilities to prevent quota exceeded errors
 */

export const cleanupStorage = () => {
  try {
    // Remove non-essential temporary data
    const itemsToRemove = [
      'guestCheckout', // Session data
      'cartTemp',
      'tempData'
    ];

    itemsToRemove.forEach(item => {
      try {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      } catch (e) {
        console.error(`Failed to remove ${item}:`, e);
      }
    });

    console.log('✅ Storage cleaned up');
  } catch (error) {
    console.error('Failed to cleanup storage:', error);
  }
};

/**
 * Check if storage is running low
 */
export const isStorageLow = (): boolean => {
  try {
    const testKey = '_storage_test_' + Date.now();
    const testValue = 'x'.repeat(1000000); // 1MB test
    try {
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  } catch {
    return true;
  }
};

/**
 * Safely set item with quota handling
 */
export const safeSetItem = (key: string, value: string, minimalFallback?: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded for key: ${key}`);
      cleanupStorage();
      
      // Try with minimal data if provided
      if (minimalFallback) {
        try {
          localStorage.setItem(key, minimalFallback);
        } catch (e) {
          console.error('Failed to save even with minimal data:', e);
          localStorage.removeItem(key);
        }
      } else {
        localStorage.removeItem(key);
      }
    } else {
      throw error;
    }
  }
};
