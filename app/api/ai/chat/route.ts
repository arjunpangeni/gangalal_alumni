import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit, aiLimiter, guestAiLimiter } from "@/lib/ratelimit";
import { tooManyRequests, serverError, badRequest } from "@/lib/errors";
import { embedText, generateChatReply, getChatModelName } from "@/lib/llm";
import { vectorSearch, buildRagContext, RAG_SYSTEM_PROMPT } from "@/lib/rag";
import {
  fetchNoticesContext,
  searchMembersStructured,
  searchJobsStructured,
} from "@/lib/chat-context";
import { getCached, setCached } from "@/lib/cache";
import { hashContent, sanitizeInput, getClientIp } from "@/lib/utils";
import connectDB from "@/lib/db";
import AIUsageLog from "@/lib/models/AIUsageLog";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const modelName = getChatModelName();

    const session = await auth();
    const identifier = session?.user?.id ?? getClientIp(req);
    const limiter = session?.user ? aiLimiter : guestAiLimiter;
    const limited = await applyRateLimit(limiter, identifier);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const rawMessage = body.message as string;
    if (!rawMessage || typeof rawMessage !== "string") return badRequest("Message is required");

    const message = sanitizeInput(rawMessage, 1000);
    const history = (body.history ?? []) as { role: string; content: string }[];

    const acl = session?.user?.status === "approved" ? "member" : "public";
    const questionHash = hashContent(`${acl}:${message}`);
    const cacheKey = `ai:chat:${questionHash}`;
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      await connectDB();
      AIUsageLog.create({
        userId: session?.user?.id,
        questionHash,
        aiModel: modelName,
        responseTimeMs: 0,
        fromCache: true,
      }).catch(() => {});
      return new Response(cached, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const queryEmbedding = await embedText(message, "RETRIEVAL_QUERY");

    const [vectorResults, noticesCtx, memberCtx, jobsCtx] = await Promise.all([
      vectorSearch(queryEmbedding, acl, 14),
      fetchNoticesContext(),
      searchMembersStructured(message, 12),
      searchJobsStructured(message, 10),
    ]);

    const ragBlock = buildRagContext(vectorResults);
    const sections: string[] = [`## Semantic search (articles, events, jobs${acl === "member" ? ", member profiles" : ""})\n${ragBlock}`];
    if (noticesCtx) sections.push(`## ${noticesCtx}`);
    if (memberCtx) sections.push(`## ${memberCtx}`);
    if (jobsCtx) sections.push(`## ${jobsCtx}`);

    const systemPrompt = `${RAG_SYSTEM_PROMPT}\n\n---\n\n${sections.join("\n\n---\n\n")}`;

    const messages = [
      ...history.slice(-6).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message },
    ];

    const text = await generateChatReply({
      system: systemPrompt,
      messages,
      maxOutputTokens: 900,
    });

    const responseTimeMs = Date.now() - start;
    await setCached(cacheKey, text, 3600).catch(() => {});
    await connectDB();
    await AIUsageLog.create({
      userId: session?.user?.id,
      questionHash,
      aiModel: modelName,
      responseTimeMs,
      fromCache: false,
    }).catch(() => {});

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return serverError();
  }
}
