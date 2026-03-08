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

  return [
    {
      suggestionTitle: "Strengthen your resume summary",
      suggestion:
        "Rewrite the top summary in 2-3 lines with target role, years of experience, and strongest outcomes.",
      category: "summary",
      priority: "high",
    },
    {
      suggestionTitle: "Add measurable impact",
      suggestion:
        "Convert responsibility bullets into impact bullets using metrics like %, revenue, users, or time saved.",
      category: "experience",
      priority: "high",
    },
    {
      suggestionTitle: "Improve keyword alignment",
      suggestion: `Include role-relevant keywords such as ${skillToMention} in experience and skills sections for ATS matching.`,
      category: "ats",
      priority: "medium",
    },
  ];
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
