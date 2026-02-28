/**
 * Recursively excludes specified fields from an object or array of objects.
 * @template T - The input type.
 * @param {T} items - The object or array of objects to process.
 * @param {string[]} keys - An array of field names to exclude.
 * @returns {T} - A new object or array with specified fields removed.
 *
 * @example
 * const user = { name: 'Alice', password: 'secret', profile: { password: 'hidden' } };
 * excludeFields(user, ['password']);
 * // => { name: 'Alice', profile: {} }
 *
 * @example
 * const users = [{ name: 'A', password: 'x' }, { name: 'B', password: 'y' }];
 * excludeFields(users, ['password']);
 * // => [{ name: 'A' }, { name: 'B' }]
 */
export function excludeFields<T>(items: T, keys: string[]): T {
  if (Array.isArray(items)) {
    // Recursively process each item in the array
    return items.map((item) => excludeFields(item, keys)) as T;
  }

  if (items !== null && typeof items === "object") {
    // Filter and reconstruct the object excluding specified keys
    const filteredEntries = Object.entries(items)
      .filter(([key]) => !keys.includes(key)) // Exclude keys
      .map(([key, value]) => [key, excludeFields(value, keys)]); // Recurse

    return Object.fromEntries(filteredEntries) as T;
  }

  // Return primitive values unchanged
  return items;
}

/**
 * Checks whether two arrays contain the same elements with the same frequency,
 * regardless of their order.
 * @template T - The type of elements in the arrays.
 * @param {T[]} a - The first array to compare.
 * @param {T[]} b - The second array to compare.
 * @returns {boolean} - `true` if both arrays have the same elements in the same quantities, else `false`.
 *
 * @example
 * arraysHaveSameElements([1, 2, 2, 3], [3, 2, 1, 2]); // true
 * arraysHaveSameElements([1, 2, 3], [3, 2, 2]);       // false
 * arraysHaveSameElements(['a', 'b'], ['b', 'a']);     // true
 */
export function arraysHaveSameElements<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;

  const counts = new Map<T, number>();

  // Count elements in array `a`
  for (const item of a) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  // Decrease counts based on array `b`
  for (const item of b) {
    const current = counts.get(item);
    if (!current) return false; // Either missing or count would go negative
    if (current === 1) {
      counts.delete(item);
    } else {
      counts.set(item, current - 1);
    }
  }

  // All counts should be zero, map should be empty
  return counts.size === 0;
}

/**
 * Checks if all elements in `arr1` exist in `arr2`.
 *
 * @param {string[]} arr1 - The array of strings to verify.
 * @param {string[]} arr2 - The reference array to check against.
 * @returns {boolean} - Returns `true` if all elements in `arr1` are present in `arr2`, otherwise `false`.
 *
 * @example
 * includesAll(['a', 'b'], ['a', 'b', 'c']); // true
 * includesAll(['a', 'd'], ['a', 'b', 'c']); // false
 */
export function includesAll(arr1: string[], arr2: string[]): boolean {
  const set2 = new Set(arr2);
  return arr1.every((item) => set2.has(item));
}

/**
 * Performs a deep comparison between two values (including arrays and objects)
 * to determine if they are equal.
 *
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns `true` if the values are deeply equal, `false` otherwise.
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null
  ) {
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // One is array and the other is not
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    // Handle plain objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}
