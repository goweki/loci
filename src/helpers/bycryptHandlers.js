import bcrypt from "bcrypt";
const saltRounds = Number(process.env.BCRYPT_SALTROUNDS);

// To hash a password
export async function hash(plaintext) {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
}

// To compare input&hash
export async function compareHash(input, hash) {
  const isValid = await bcrypt.compare(input, hash);
  return isValid;
}
