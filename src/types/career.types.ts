import { z } from "zod";

export const skillCategorySchema = z.enum([
  "core",
  "production",
  "professional",
]);

export const roleSlugSchema = z.enum([
  "frontend-react",
  "backend-node",
  "backend-java",
]);

export const roleSkillSchema = z.object({
  skillKey: z.string().trim().min(1),
  skillName: z.string().trim().min(1),
  category: skillCategorySchema,
  weight: z.number().int().positive(),
});

export const roleTaxonomySchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  version: z.number().int().positive(),
  skills: z.array(roleSkillSchema).min(1),
});

export const roleSummarySchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  version: z.number().int().positive(),
});

export const listRolesResponseSchema = z.object({
  roles: z.array(roleSummarySchema),
});

export const selectTargetRoleBodySchema = z.object({
  userId: z.number().int().positive(),
  roleSlug: roleSlugSchema,
});

export const userIdQuerySchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const userTargetRoleSchema = z.object({
  userId: z.number().int().positive(),
  roleSlug: roleSlugSchema,
  taxonomyVersion: z.number().int().positive(),
  updatedAt: z.string().trim().min(1),
});

export const targetRoleResponseSchema = z.object({
  targetRole: userTargetRoleSchema.nullable(),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type RoleSlug = z.infer<typeof roleSlugSchema>;
export type RoleSkill = z.infer<typeof roleSkillSchema>;
export type RoleTaxonomy = z.infer<typeof roleTaxonomySchema>;
export type RoleSummary = z.infer<typeof roleSummarySchema>;
export type ListRolesResponse = z.infer<typeof listRolesResponseSchema>;
export type SelectTargetRoleBody = z.infer<typeof selectTargetRoleBodySchema>;
export type UserIdQuery = z.infer<typeof userIdQuerySchema>;
export type UserTargetRole = z.infer<typeof userTargetRoleSchema>;
export type TargetRoleResponse = z.infer<typeof targetRoleResponseSchema>;
