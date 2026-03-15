import { NextResponse } from "next/server";

import { listEnabledChatModels } from "@/src/lib/ai/chat-models";
import { chatModelsResponseSchema } from "@/src/types/chat.types";

export async function GET() {
  const models = listEnabledChatModels();

  if (models.length === 0) {
    return NextResponse.json(
      { message: "No AI model is configured. Add OPENAI_API_KEY or GROK_API_KEY." },
      { status: 400 },
    );
  }

  const responseBody = chatModelsResponseSchema.parse({
    models,
    defaultModel: models[0].id,
  });

  return NextResponse.json(responseBody, { status: 200 });
}
