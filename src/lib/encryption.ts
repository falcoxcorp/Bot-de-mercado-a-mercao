export const encryptPrivateKey = (privateKey: string, userPassword: string): string => {
  const combined = privateKey + '::' + userPassword;
  return btoa(combined);
};

export const decryptPrivateKey = (encryptedKey: string, userPassword: string): string => {
  try {
    const decoded = atob(encryptedKey);
    const [privateKey, password] = decoded.split('::');

    if (password !== userPassword) {
      throw new Error('Invalid password');
    }

    return privateKey;
  } catch (error) {
    throw new Error('Failed to decrypt private key');
  }
};
