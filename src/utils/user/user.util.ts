import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "'name' is required and must be a string."),
  age: z
    .number()
    .int()
    .nonnegative("'age' is required and must be a valid number."),
  email: z
    .string()
    .trim()
    .email("'email' is required and must be a valid email."),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "'name' must be a string.").optional(),
    age: z
      .number()
      .int()
      .nonnegative("'age' must be a valid number.")
      .optional(),
    email: z.string().trim().email("'email' must be a valid email.").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update.",
  });

export const userIdSchema = z.coerce
  .number()
  .int("Invalid user id.")
  .positive("Invalid user id.");

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function validateCreatePayload(payload: unknown) {
  return createUserSchema.safeParse(payload);
}

export function validateUpdatePayload(payload: unknown) {
  return updateUserSchema.safeParse(payload);
}

export function validateUserId(id: string) {
  return userIdSchema.safeParse(id);
}

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
