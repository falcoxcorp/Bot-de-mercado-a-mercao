const ENCRYPTION_KEY = 'FalcoX_Trading_Bot_2024_Secure_Key';

export const encryptPrivateKey = (privateKey: string): string => {
  try {
    // Remove 0x prefix if present to avoid duplication
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const combined = cleanKey + '::' + ENCRYPTION_KEY + '::' + Date.now();
    return btoa(combined);
  } catch (error) {
    throw new Error('Failed to encrypt private key');
  }
};

export const decryptPrivateKey = (encryptedKey: string): string => {
  try {
    if (!encryptedKey || encryptedKey === 'null') {
      throw new Error('No private key found');
    }

    // Try to decode
    const decoded = atob(encryptedKey);
    const parts = decoded.split('::');

    let privateKey = '';

    // Check if it's the new format with encryption key
    if (parts.length >= 2 && parts[1] === ENCRYPTION_KEY) {
      privateKey = parts[0];
    } else if (parts.length > 0) {
      // If it's old format or plain text, just return the first part
      privateKey = parts[0];
    } else {
      throw new Error('Invalid encryption format');
    }

    // Ensure private key has 0x prefix
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // Validate length (should be 66 characters with 0x prefix, or 64 without)
    if (privateKey.length !== 66) {
      throw new Error(`Invalid private key length: ${privateKey.length} (expected 66 with 0x prefix)`);
    }

    return privateKey;
  } catch (error: any) {
    if (error.message === 'No private key found' || error.message.includes('Invalid')) {
      throw error;
    }
    throw new Error('Failed to decrypt private key: ' + error.message);
  }
};
