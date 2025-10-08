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
    const decoded = atob(encryptedKey);
    const parts = decoded.split('::');

    if (parts.length < 2 || parts[1] !== ENCRYPTION_KEY) {
      throw new Error('Invalid encryption key');
    }

    return parts[0];
  } catch (error) {
    throw new Error('Failed to decrypt private key');
  }
};
