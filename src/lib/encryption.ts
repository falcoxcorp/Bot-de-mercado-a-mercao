const ENCRYPTION_KEY = 'FalcoX_Trading_Bot_2024_Secure_Key';

export const encryptPrivateKey = (privateKey: string): string => {
  try {
    const combined = privateKey + '::' + ENCRYPTION_KEY + '::' + Date.now();
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

    // Check if it's the new format with encryption key
    if (parts.length >= 2 && parts[1] === ENCRYPTION_KEY) {
      return parts[0];
    }

    // If it's old format or plain text, just return the first part
    if (parts.length > 0) {
      return parts[0];
    }

    throw new Error('Invalid encryption format');
  } catch (error: any) {
    if (error.message === 'No private key found' || error.message === 'Invalid encryption format') {
      throw error;
    }
    throw new Error('Failed to decrypt private key: ' + error.message);
  }
};
