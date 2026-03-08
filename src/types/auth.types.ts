import { z } from "zod";

export const credentialsSignInSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
});

export const credentialsRegisterSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  username: z.string().trim().min(3),
  password: z.string().min(6),
});

export const authApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type CredentialsSignInInput = z.infer<typeof credentialsSignInSchema>;
export type CredentialsRegisterInput = z.infer<typeof credentialsRegisterSchema>;
export type AuthApiResponse = z.infer<typeof authApiResponseSchema>;
