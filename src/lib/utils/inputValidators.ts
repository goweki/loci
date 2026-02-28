/**
 * Validates an email address.
 *
 * @param {string} email - The email string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 */
export function emailValidator(email: string): string {
  const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

  if (!email) return "Email can't be empty.";
  if (!EMAIL_REGEX.test(email)) return 'Ooops! We need a valid email address.';
  return '';
}

/**
 * Validates a password (minimum 5 characters).
 *
 * @param {string} password - The password string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 */
export function passwordValidator(password: string): string {
  if (!password) return "Password can't be empty";
  if (password.length < 5) return 'Password must be at least 5 characters long';
  return '';
}

/**
 * Validates a name (must be at least 3 letters, containing only alphabets).
 *
 * @param {string} name - The name string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 */
export function nameValidator(name: string, label?: string): string {
  const NAME_REGEX = /^[a-zA-Z0-9\s'-]{3,}$/;

  if (!name) return `${label ? label : 'Name'}  field can't be empty`;
  if (name.length < 3) return `${label ? label : 'Name'} too short`;
  if (!NAME_REGEX.test(name))
    return `${
      label ? label : 'Name'
    } should contain alphabets and numbers only`;
  return ``;
}

/**
 * Validates a location string.
 * A valid location must:
 * - Not be empty
 * - Be at least 3 characters long
 * - Contain only letters, spaces, commas, hyphens, and apostrophes
 *
 * @param {string} location - The location string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 *
 * @example
 * locationValidator("Nairobi, Kenya"); // ""
 * locationValidator("Na");             // "Location name too short"
 * locationValidator("New York@");      // "Location contains invalid characters"
 */
export function locationValidator(location: string): string {
  const LOCATION_REGEX = /^[a-zA-Z\s,'-]{3,}$/;

  if (!location.trim()) return "Location field can't be empty";
  if (location.trim().length < 3) return 'Location name too short';
  if (!LOCATION_REGEX.test(location.trim())) {
    return 'Location contains invalid characters';
  }

  return '';
}

/**
 * Validates a Kenyan phone number (starting with +254 or 0 and followed by 9 digits).
 *
 * @param {string} tel - The phone number string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 */
export function phoneValidator(tel: string): string {
  const TEL_REGEX = /^(?:\+254|0)\d{9}$/;

  if (!tel) return "Tel field can't be empty";
  if (!TEL_REGEX.test(tel))
    return 'Sorry, we only support KENYAN phone numbers';
  return '';
}

/**
 * Validates a law firm name.
 * A valid law firm name must:
 * - Not be empty
 * - Have more than one word (contain at least one space)
 * - Contain only letters, spaces, periods, ampersands, and commas
 *
 * @param {string} name - The law firm name string to validate.
 * @returns {string} - An error message if invalid, otherwise an empty string.
 *
 * @example
 * lawFirmNameValidator("Smith & Jones Law"); // ""
 * lawFirmNameValidator("Legal Inc.");       // ""
 * lawFirmNameValidator("Solo");             // "Law firm name must contain more than one word"
 * lawFirmNameValidator("Smith@Law");        // "Law firm name contains invalid characters"
 * lawFirmNameValidator("   ");              // "Law firm name can't be empty"
 */
export function institutionNameValidator(name: string): string {
  // Regular expression to allow letters, spaces, periods (.), ampersands (&), and commas (,)
  // The regex also implicitly handles the "more than one word" by checking for allowed characters
  // and we'll explicitly check for spaces to ensure multiple words.
  const NAME_REGEX = /^[a-zA-Z0-9\s.,&'-]+$/; // Added 0-9 for numbers, and hyphen/apostrophe for flexibility

  const trimmedName = name.trim();

  // 1. Check if the name is empty
  if (!trimmedName) {
    return "Law firm name can't be empty";
  }

  // 2. Check if the name has more than one word (contains at least one space)
  // This is a direct interpretation of "more than one word".
  if (!trimmedName.includes(' ')) {
    return 'Law firm name must contain more than one word';
  }

  // 3. Check for allowed characters
  if (!NAME_REGEX.test(trimmedName)) {
    return 'Law firm name contains invalid characters';
  }

  return ''; // Name is valid
}

// Validation function for stream names
export function validateStreamName(streamName: string): boolean | string {
  if (streamName.length < 3) {
    return 'Stream name cannot have less that 3 characters';
  }
  if (streamName.length > 50) {
    return 'Stream name must be less than 50 characters';
  }
  // Check for valid characters (letters, numbers, spaces, and common punctuation)
  const validPattern = /^[a-zA-Z0-9\s\-_.()]+$/;
  if (!validPattern.test(streamName)) {
    return 'Stream name contains invalid characters';
  }
  return true;
}
