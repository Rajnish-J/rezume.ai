import { hash, compare } from "bcryptjs";

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const saltRounds = 10;
  return hash(plainTextPassword, saltRounds);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plainTextPassword, passwordHash);
}
