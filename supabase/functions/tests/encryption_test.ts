
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';

// Mock pgcrypto functions for testing encryption/decryption roundtrip
function mockEncrypt(key: string, secret: string): Uint8Array {
  // In a real implementation this would use crypto.subtle.encrypt
  // For testing, we'll just use a simple encoding
  const encoder = new TextEncoder();
  return encoder.encode(`${secret}:${key}`);
}

function mockDecrypt(encrypted: Uint8Array, secret: string): string {
  // In a real implementation this would use crypto.subtle.decrypt
  // For testing, we'll just reverse the encoding
  const decoder = new TextDecoder();
  const parts = decoder.decode(encrypted).split(':');
  if (parts[0] !== secret) {
    throw new Error('Invalid secret');
  }
  return parts[1];
}

Deno.test("Encryption roundtrip", () => {
  const apiKey = "sk-1234567890abcdef";
  const secret = "testsecret123";
  
  // Encrypt
  const encrypted = mockEncrypt(apiKey, secret);
  
  // Decrypt
  const decrypted = mockDecrypt(encrypted, secret);
  
  // Verify
  assertEquals(decrypted, apiKey);
});
