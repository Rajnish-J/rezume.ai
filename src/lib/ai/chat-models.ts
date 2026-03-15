import { createOpenAI } from "@ai-sdk/openai";

export type ChatModelId =
  | "openai:gpt-4o-mini"
  | "openai:gpt-4o"
  | "grok:grok-2-latest";

export type ChatModelOption = {
  id: ChatModelId;
  label: string;
  provider: "openai" | "grok";
  modelName: string;
  enabled: boolean;
};

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const grokProvider = createOpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
});

export const chatModelRegistry: ChatModelOption[] = [
  {
    id: "openai:gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    modelName: "gpt-4o-mini",
    enabled: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: "openai:gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    enabled: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: "grok:grok-2-latest",
    label: "Grok 2 Latest",
    provider: "grok",
    modelName: "grok-2-latest",
    enabled: Boolean(process.env.GROK_API_KEY),
  },
];

export function listEnabledChatModels() {
  return chatModelRegistry
    .filter((item) => item.enabled)
    .map((item) => ({
      id: item.id,
      label: item.label,
      provider: item.provider,
    }));
}

export function resolveChatModel(selectedModel?: string) {
  const enabledModels = chatModelRegistry.filter((item) => item.enabled);

  if (enabledModels.length === 0) {
    return null;
  }

  const matched =
    enabledModels.find((item) => item.id === selectedModel) ?? enabledModels[0];

  if (matched.provider === "grok") {
    return {
      id: matched.id,
      model: grokProvider(matched.modelName),
    };
  }

  return {
    id: matched.id,
    model: openaiProvider(matched.modelName),
  };
}
