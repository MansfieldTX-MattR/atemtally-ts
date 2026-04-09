
/**
 * Hashes an array of strings/numbers/booleans into a short string using the FNV-1a algorithm.
 * This is used to generate stable IDs for TSL map items based on their properties.
 * The output is a base36 string representation of the hash, which is shorter than hexadecimal.
 * @param items - An array of strings, numbers, or booleans to hash.
 * @returns A short string hash of the input items.
 */
export function hash(items: (string | number | boolean)[]): string {
  let h = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (const item of items) {
    const s = typeof item === "string" ? item : String(item);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193); // FNV-1a 32-bit prime
    }
    h ^= 0x1f; // separator to distinguish e.g. ["ab","c"] from ["a","bc"]
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
