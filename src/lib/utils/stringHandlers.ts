import prisma from "@/lib/prisma";

/**
 * Truncates a string to a specified length and appends ellipsis if needed.
 *
 * @param {string} str - The original string.
 * @param {number} len - Maximum length before truncation.
 * @returns {string} - Truncated string with ellipsis if it exceeded the length.
 *
 * @example
 * strTruncate("Hello world", 5); // "Hello ..."
 */
export function strTruncate(str: string, len: number): string {
  return str.length > len ? `${str.slice(0, len)} ...` : str;
}

/**
 * Converts a string to Pascal case (capitalizes the first letter).
 *
 * @param {string} str - The input string.
 * @returns {string} - The string with the first letter capitalized, rest in lowercase.
 *
 * @example
 * strPascalCase("hello"); // "Hello"
 */
export function strPascalCase(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1).toLowerCase() : "";
}

/**
 * Compares two strings for an exact match (case-sensitive).
 *
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {boolean} - `true` if strings match exactly, otherwise `false`.
 *
 * @example
 * strsMatch("abc", "abc"); // true
 * strsMatch("abc", "Abc"); // false
 */
export function strsMatch(str1: string, str2: string): boolean {
  return str1 === str2;
}

/**
 * Formats a number into a human-readable string with 'k' for thousands.
 * Examples:
 * 1000 => "1k"
 * 300000 => "300k"
 * 6000 => "6k"
 * 1234 => "1.2k"
 * 100 => "100" (numbers below 1000 are returned as is)
 * 1000000 => "1000k" (or "1M" if you extend to millions)
 *
 * @param num The number to format.
 * @param decimalPlaces (Optional) Number of decimal places for k-formatted numbers. Defaults to 1.
 * @returns The formatted string.
 */
export function formatNumberToK(
  num: number,
  decimalPlaces: number = 1
): string {
  // Handle non-finite numbers (NaN, Infinity)
  if (!Number.isFinite(num)) {
    return String(num);
  }

  // Define the threshold for 'k'
  const KILO = 1000;

  // If the number is less than 1000, return it as is (no 'k' suffix)
  if (num < KILO) {
    return String(num);
  }

  // Calculate the value in thousands
  const numInK = num / KILO;

  // Format to the specified number of decimal places
  // toFixed returns a string, so we need to convert it to a number first
  // to remove trailing zeros if they are not significant, then back to string.
  // Using parseFloat to strip trailing zeros and ensure correct rounding behavior
  const formattedNum = parseFloat(numInK.toFixed(decimalPlaces));

  return `${formattedNum}k`;
}

/**
 * Extracts the first word (substring before the first whitespace) from a given string.
 *
 * @param input - The input string to process.
 * @returns The first section of the string before any whitespace. If there is no whitespace, returns the full string.
 *
 * @example
 * getFirstWord("Hello world"); // returns "Hello"
 * getFirstWord("OneWord");     // returns "OneWord"
 * getFirstWord("   Leading space"); // returns ""
 */
export function strFirstWord(input: string): string {
  const trimmed = input.trim();
  const firstSpaceIndex = trimmed.indexOf(" ");

  return firstSpaceIndex === -1 ? trimmed : trimmed.slice(0, firstSpaceIndex);
}

/**
 * Generates a unique 4-letter institution code.
 * - Derives acronym from the institution name
 * - Pads with random alphabets if less than 4 letters
 * - Ensures uniqueness against existing codes
 */
export async function generateUniqueInstitutionCode(
  name: string
): Promise<string> {
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const MAX_ATTEMPTS = 20;

  // Extract acronym (first letters of up to 4 words)
  const words = name
    .replace(/[^a-zA-Z\s]/g, "")
    .toUpperCase()
    .split(/\s+/);
  let acronym = words
    .map((w) => w[0])
    .join("")
    .slice(0, 4);

  // Pad with random letters if shorter than 4
  while (acronym.length < 4) {
    acronym += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  const existingCodes: { code: string }[] = await prisma.institution.findMany({
    select: { code: true },
  });
  const existingSet = new Set(existingCodes.map((c) => c.code));

  // Try up to MAX_ATTEMPTS to find a unique variation
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code =
      attempt === 0
        ? acronym
        : acronym.slice(0, 3) +
          LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const isDuplicate = existingSet.has(code);
    const isSimilar = Array.from(existingSet).some((c) =>
      isTooSimilar(code, c)
    );

    if (!isDuplicate && !isSimilar) return code;
  }

  // Fallback (still 4 chars, deterministic)
  return (
    acronym.slice(0, 3) + LETTERS[Math.floor(Math.random() * LETTERS.length)]
  );
}

function isTooSimilar(newCode: string, existingCode: string): boolean {
  if (newCode.length !== existingCode.length) return false;

  let diffCount = 0;
  for (let i = 0; i < newCode.length; i++) {
    if (newCode[i] !== existingCode[i]) diffCount++;
    if (diffCount > 1) return false; // more than 1 difference → not "too similar"
  }

  return diffCount === 1; // exactly one letter difference
}
