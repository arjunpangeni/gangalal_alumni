import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_LLM_BASE_URL = "https://openrouter.ai/api/v1";
/**
 * Default chat model: OpenRouter’s free Qwen3.6 Plus variant (large context, $0 on the free tier).
 * Override with `LLM_CHAT_MODEL` for a paid slug (e.g. `qwen/qwen3-max`) if you need higher rate limits.
 */
const DEFAULT_CHAT_MODEL = "qwen/qwen3.6-plus:free";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const DEFAULT_EMBEDDING_DIMENSIONS = 768;

function getLlmApiKey(): string {
  const key = process.env.LLM_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Missing LLM_API_KEY (or OPENROUTER_API_KEY)");
  return key;
}

function getLlmBaseUrl(): string {
  return process.env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL;
}

export function getChatModelName(): string {
  return process.env.LLM_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}

export function getEmbeddingModelName(): string {
  return process.env.LLM_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

function getEmbeddingDimensions(): number {
  const raw = process.env.LLM_EMBEDDING_DIMENSIONS?.trim();
  if (!raw) return DEFAULT_EMBEDDING_DIMENSIONS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EMBEDDING_DIMENSIONS;
}

export function getChatModel() {
  const provider = createOpenAI({
    apiKey: getLlmApiKey(),
    baseURL: getLlmBaseUrl(),
  });
  return provider(getChatModelName());
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function generateChatReply(params: {
  system: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
}): Promise<string> {
  const res = await fetch(`${getLlmBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getLlmApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getChatModelName(),
      temperature: 0.2,
      max_tokens: params.maxOutputTokens ?? 900,
      messages: [
        { role: "system", content: params.system },
        ...params.messages,
      ],
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Chat completion failed (${res.status}): ${details || res.statusText}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  throw new Error("Chat completion response did not include text");
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const input = taskType === "RETRIEVAL_QUERY" ? `Query: ${text}` : `Document: ${text}`;
  const res = await fetch(`${getLlmBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getLlmApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEmbeddingModelName(),
      input,
      dimensions: getEmbeddingDimensions(),
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Embedding request failed (${res.status}): ${details || res.statusText}`);
  }

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const values = json.data?.[0]?.embedding;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Embedding response did not include a vector");
  }
  return values;
}

export function chunkText(text: string, maxChars = 2000): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  const overlap = Math.floor(maxChars * 0.1);
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    if (end < text.length) {
      const paraBreak = text.lastIndexOf("\n\n", end);
      const sentBreak = text.lastIndexOf(". ", end);
      if (paraBreak > start + maxChars / 2) end = paraBreak + 2;
      else if (sentBreak > start + maxChars / 2) end = sentBreak + 2;
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 50);
}
