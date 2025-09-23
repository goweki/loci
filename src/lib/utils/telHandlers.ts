/**
 * Ensures that a telephone number string begins with a '+' sign.
 *
 * This is useful for normalizing international phone numbers where
 * the '+' prefix is expected (e.g., `+1234567890`).
 *
 * @param tel - The telephone number as a string.
 * @returns The telephone number string, guaranteed to start with '+'.
 *
 * @example
 * appendPlus("1234567890");   // "+1234567890"
 * appendPlus("+9876543210"); // "+9876543210"
 */
export function appendPlus(tel: string): string {
  if (!tel.startsWith("+")) {
    return "+" + tel;
  }
  return tel;
}

/**
 * Removes a leading '+' sign from a telephone number string, if present.
 *
 * This is useful when you need the raw digits of a phone number
 * without the international dialing prefix indicator.
 *
 * @param tel - The telephone number as a string.
 * @returns The telephone number string without a leading '+'.
 *
 * @example
 * removePlus("+1234567890"); // "1234567890"
 * removePlus("9876543210");  // "9876543210"
 */
export function removePlus(tel: string): string {
  if (tel.startsWith("+")) {
    return tel.slice(1);
  }
  return tel;
}
