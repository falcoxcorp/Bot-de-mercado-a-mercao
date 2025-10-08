export const encryptPrivateKey = (privateKey: string, userId: string): string => {
  const combined = privateKey + '::' + userId;
  return btoa(combined);
};

export const decryptPrivateKey = (encryptedKey: string, userId: string): string => {
  try {
    const decoded = atob(encryptedKey);
    const [privateKey, storedUserId] = decoded.split('::');

    if (storedUserId !== userId) {
      throw new Error('Invalid user');
    }

    return privateKey;
  } catch (error) {
    throw new Error('Failed to decrypt private key');
  }
};
