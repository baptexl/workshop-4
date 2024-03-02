import { webcrypto as crypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: crypto.CryptoKey;
  privateKey: crypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {


  return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,

        publicExponent: new Uint8Array([1, 0, 1]),
        hash: {name: "SHA-256"},
      },
      true,
      ["encrypt", "decrypt"]
  );
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: crypto.CryptoKey): Promise<string> {
  // TODO: implement this function to return a base64 string version of a public key
  const exportedKey = await crypto.subtle.exportKey("spki", key);

  return arrayBufferToBase64(exportedKey);
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: crypto.CryptoKey | null
): Promise<string | null> {

  if (!key) {
    return null;
  }
  const exportedKey = await crypto.subtle.exportKey("pkcs8", key);


  return arrayBufferToBase64(exportedKey);
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<crypto.CryptoKey> {

  // TODO: implement this function to go back from the result of the exportPubKey function to its native crypto key object
  const keyBuffer = base64ToArrayBuffer(strKey);

  return await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        
        hash: {name: "SHA-256"},
      },
      true,
      ["encrypt"]
  );
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<crypto.CryptoKey> {
  // TODO: implement this function to go back from the result of the exportPrvKey function to its native crypto key object
  const keyBuffer = base64ToArrayBuffer(strKey);

  return await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: {name: "SHA-256"},
      },
      true,
      ["decrypt"]
  );
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
    b64Data: string,
    strPublicKey: string
): Promise<string> {
  const data = base64ToArrayBuffer(b64Data);
  const publicKey = await importPubKey(strPublicKey);
  const encryptedData = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data
  );
  return arrayBufferToBase64(encryptedData);
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
    data: string,
    privateKey: crypto.CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(data);
  const decryptedData = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedData
  );
  return arrayBufferToBase64(decryptedData);
}


// ######################
// ### Symmetric keys ###
// ######################

export async function createRandomSymmetricKey(): Promise<crypto.CryptoKey> {
  // Generate a random 256-bit AES key with extractable: true
  return await crypto.subtle.generateKey(
      {
        name: 'AES-CBC', // Choose a suitable algorithm (e.g., AES-GCM for authenticated encryption)
        length: 256,
      },
      true, // Enable extractability
      ['encrypt', 'decrypt'] // Specify intended key usages
  );

}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: crypto.CryptoKey): Promise<string> {
  // TODO: implement this function to return a base64 string version of a symmetric key

  const exportedKey = await crypto.subtle.exportKey("raw", key);

  return arrayBufferToBase64(exportedKey);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<crypto.CryptoKey> {
  // TODO: implement this function to go back from the result of the exportSymKey function to its native crypto key object

  const keyBuffer = base64ToArrayBuffer(strKey);

  return await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
  );
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
    key: crypto.CryptoKey,
    data: string
): Promise<string> {
  const dataUint8Array = new TextEncoder().encode(data);

  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      dataUint8Array
  );

  const concatenatedData = new Uint8Array([...iv, ...new Uint8Array(encryptedData)]);
  return arrayBufferToBase64(concatenatedData.buffer);
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
    strKey: string,
    encryptedData: string
): Promise<string> {
  const key = await importSymKey(strKey);

  const encryptedDataBuffer = base64ToArrayBuffer(encryptedData);

  const iv = encryptedDataBuffer.slice(0, 16);

  const decryptedDataBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      encryptedDataBuffer.slice(16)
  );

  return new TextDecoder().decode(decryptedDataBuffer);
}
