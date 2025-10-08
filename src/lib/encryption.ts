export const encryptPrivateKey = (privateKey: string): string => {
  // Store private key as-is (no encryption)
  // Just ensure it has 0x prefix
  if (!privateKey.startsWith('0x')) {
    return '0x' + privateKey;
  }
  return privateKey;
};

export const decryptPrivateKey = (privateKey: string): string => {
  // No decryption needed, just validate and return
  if (!privateKey || privateKey === 'null') {
    throw new Error('No private key found');
  }

  // Ensure private key has 0x prefix
  let key = privateKey;
  if (!key.startsWith('0x')) {
    key = '0x' + key;
  }

  // Validate length (should be 66 characters with 0x prefix)
  if (key.length !== 66) {
    throw new Error(`Invalid private key length: ${key.length} (expected 66 with 0x prefix)`);
  }

  return key;
};
