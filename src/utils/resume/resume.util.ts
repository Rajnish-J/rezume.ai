import { z } from "zod";

import * as t from "@/src/types/resume.types";

export async function extractTextFromFile(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(fileBuffer);
  return decoded.replace(/\u0000/g, " ").trim();
}

export function buildParsedContextFromText(text: string): t.ParsedResumeContext {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const summary = lines.slice(0, 3).join(" ").slice(0, 450) || "No summary extracted.";
  const keySkills = extractKeywords(lines, [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node",
    "python",
    "sql",
    "aws",
    "docker",
    "kubernetes",
    "leadership",
    "communication",
  ]);

  const highlights = lines.slice(0, 5);
  const recommendedRoles = inferRolesFromSkills(keySkills);

  return t.parsedResumeContextSchema.parse({
    summary,
    keySkills,
    highlights,
    recommendedRoles,
  });
}

function extractKeywords(lines: string[], candidates: string[]): string[] {
  const content = lines.join(" ").toLowerCase();
  const matched = candidates.filter((item) => content.includes(item.toLowerCase()));
  return matched.length ? matched.slice(0, 8) : ["general-professional-skills"];
}

function inferRolesFromSkills(skills: string[]): string[] {
  const normalized = skills.join(" ").toLowerCase();

  if (normalized.includes("react") || normalized.includes("next.js")) {
    return ["Frontend Developer", "Full Stack Developer"];
  }

  if (normalized.includes("python") || normalized.includes("sql")) {
    return ["Backend Developer", "Data Engineer"];
  }

  return ["Software Engineer"];
}

export function toSafeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export function validateResumeFile(file: File): string | null {
  const maxSizeInBytes = 5 * 1024 * 1024;

  if (file.size === 0) {
    return "Uploaded file is empty.";
  }

  if (file.size > maxSizeInBytes) {
    return "File size must be less than 5MB.";
  }

  return null;
}

export function getZodErrorMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
