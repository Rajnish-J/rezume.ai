import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import * as r from "@/src/imports/resume.imports";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const suggestionListSchema = z.object({
  suggestions: z.array(r.resumeSuggestionSchema).min(3).max(7),
});

export async function generateResumeSuggestions(
  input: r.GenerateSuggestionsInput,
): Promise<{ suggestions: r.ResumeSuggestion[]; tokenUsage: r.TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      suggestions: getFallbackSuggestions(input.parsedContext),
      tokenUsage: getTokenUsage(undefined),
    };
  }

  try {
    const response = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: suggestionListSchema,
      system: r.resumeSuggestionSystemPrompt,
      prompt: `Parsed Context: ${JSON.stringify(input.parsedContext)}\n\nResume Text:\n${input.resumeText.slice(0, 8000)}`,
    });

    return {
      suggestions: response.object.suggestions,
      tokenUsage: getTokenUsage(response.usage),
    };
  } catch {
    return {
      suggestions: getFallbackSuggestions(input.parsedContext),
      tokenUsage: getTokenUsage(undefined),
    };
  }
}

export async function generateResumeChatAnswer(
  input: r.GenerateChatInput,
): Promise<{ answer: string; tokenUsage: r.TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      answer:
        "Start by implementing the high-priority suggestions first, then rewrite your summary to match your target role and quantify achievements.",
      tokenUsage: getTokenUsage(undefined),
    };
  }

  try {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: r.resumeChatSystemPrompt,
      prompt: `Parsed Context: ${JSON.stringify(input.parsedContext)}\nSuggestions: ${JSON.stringify(input.suggestions)}\nUser Message: ${input.userMessage}`,
    });

    return {
      answer: response.text,
      tokenUsage: getTokenUsage(response.usage),
    };
  } catch {
    return {
      answer:
        "I could not generate a live answer right now. Please try again in a moment.",
      tokenUsage: getTokenUsage(undefined),
    };
  }
}

function getFallbackSuggestions(
  parsedContext: r.ParsedResumeContext,
): r.ResumeSuggestion[] {
  const skillToMention = parsedContext.keySkills[0] ?? "relevant skills";
  const aiSkill = parsedContext.keySkills.find((item) =>
    ["ai", "ml", "llm", "python", "tensorflow", "pytorch"].some((token) =>
      item.toLowerCase().includes(token),
    ),
  );
  const level = inferExperienceLevel(parsedContext.summary);

  return [
    {
      suggestionTitle: `Tailor your summary for ${level} level roles`,
      suggestion:
        "Rewrite the top summary in 2-3 lines with target role, years of experience, and strongest business outcomes.",
      category: "summary",
      priority: "high",
    },
    {
      suggestionTitle: "Make projects interview-ready",
      suggestion:
        "For each project, use one bullet each for problem context, your decisions, technical implementation, and measurable result.",
      category: "projects",
      priority: "high",
    },
    {
      suggestionTitle: "Show measurable ownership",
      suggestion:
        "Convert generic responsibility bullets into impact bullets using metrics like %, latency, cost, users, quality, or delivery speed.",
      category: "interview-readiness",
      priority: "high",
    },
    {
      suggestionTitle: "Improve keyword and role alignment",
      suggestion: `Include role-relevant keywords such as ${skillToMention} in experience and skills sections for ATS matching.`,
      category: "ats-keywords",
      priority: "medium",
    },
    {
      suggestionTitle: "Strengthen AI and modern tooling section",
      suggestion: aiSkill
        ? `Clarify depth with ${aiSkill}: mention where you applied it, why it was chosen, and what measurable outcome it produced.`
        : "If targeting modern roles, add one project bullet showing practical AI or automation usage with clear impact.",
      category: "ai-skills",
      priority: "medium",
    },
  ];
}

function inferExperienceLevel(summary: string): "entry" | "mid" | "senior" {
  const normalized = summary.toLowerCase();
  const match = normalized.match(/(\d{1,2})\+?\s*years?/);
  const years = match ? Number(match[1]) : 0;

  if (years >= 7 || normalized.includes("lead") || normalized.includes("manager")) {
    return "senior";
  }

  if (years >= 3) {
    return "mid";
  }

  return "entry";
}

function getTokenUsage(usage: r.AiUsageShape | undefined): r.TokenUsage {
  const inputTokens = usage?.inputTokens ?? usage?.promptTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? usage?.completionTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? inputTokens + outputTokens;

  return r.tokenUsageSchema.parse({
    inputTokens,
    outputTokens,
    totalTokens,
  });
}