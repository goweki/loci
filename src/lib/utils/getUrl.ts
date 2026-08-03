/**
 * Resolves the base URL depending on the Vercel environment.
 * HINT: uses Vercel system environment variables.
 */
export const BASE_URL = process.env.NEXTAUTH_URL!;

/**
 * BRAND IMAGES URL
 */
export const BANNER_IMAGE_URL: string = BASE_URL + "/brand/banner.png";
export const OG_IMAGE_URL: string = BASE_URL + "/brand/og_image.jpg";

/**
 * RegExp to check if a string starts with a forward slash `/`.
 */
export const STARTS_WITH_SLASH_REGEX = /^\/(.|\n)*$/;

/**
 * Checks if a given string starts with a forward slash `/`.
 *
 * @param {string} value - The string to test.
 * @returns {boolean} - `true` if the string starts with `/`, otherwise `false`.
 */
export function startsWithSlash(value: string): boolean {
  return STARTS_WITH_SLASH_REGEX.test(value);
}

/**
 * Constructs a full URL from a relative path.
 *
 * @param {string} path - The relative path (e.g., "api/data").
 * @returns {string} - The full absolute URL.
 *
 * @example
 * getUrl("api/user");  // "https://yourdomain.com/api/user"
 * getUrl("/api/user"); // "https://yourdomain.com/api/user"
 */
export function getUrl(path: string): string {
  const normalizedPath = startsWithSlash(path) ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

export default getUrl;
