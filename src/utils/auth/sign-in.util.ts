import * as t from "@/src/types/auth.types";

export function parseAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Authentication failed. Please try again.";
}

export function parseAuthApiResponse(payload: unknown): t.AuthApiResponse {
  return t.authApiResponseSchema.parse(payload);
}
