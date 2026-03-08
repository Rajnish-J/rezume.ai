import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

import * as p from "@/src/lib/ai/resume/resume-prompt";
import * as t from "@/src/types/resume.types";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const suggestionListSchema = z.object({
  suggestions: z.array(t.resumeSuggestionSchema).min(3).max(7),
});

type GenerateSuggestionsInput = {
  parsedContext: t.ParsedResumeContext;
  resumeText: string;
};

type GenerateChatInput = {
  parsedContext: t.ParsedResumeContext;
  suggestions: t.ResumeSuggestion[];
  userMessage: string;
};

export async function generateResumeSuggestions(
  input: GenerateSuggestionsInput,
): Promise<t.ResumeSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    return getFallbackSuggestions(input.parsedContext);
  }

  try {
    const response = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: suggestionListSchema,
      system: p.resumeSuggestionSystemPrompt,
      prompt: `Parsed Context: ${JSON.stringify(input.parsedContext)}\n\nResume Text:\n${input.resumeText.slice(0, 8000)}`,
    });

    return response.object.suggestions;
  } catch {
    return getFallbackSuggestions(input.parsedContext);
  }
}

export async function generateResumeChatAnswer(
  input: GenerateChatInput,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "Start by implementing the high-priority suggestions first, then rewrite your summary to match your target role and quantify achievements.";
  }

  try {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: p.resumeChatSystemPrompt,
      prompt: `Parsed Context: ${JSON.stringify(input.parsedContext)}\nSuggestions: ${JSON.stringify(input.suggestions)}\nUser Message: ${input.userMessage}`,
    });

    return response.text;
  } catch {
    return "I could not generate a live answer right now. Please try again in a moment.";
  }
}

function getFallbackSuggestions(
  parsedContext: t.ParsedResumeContext,
): t.ResumeSuggestion[] {
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
