import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import Event from "@/lib/models/Event";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";
import { ingestArticle, ingestEvent, ingestJob, ingestMemberProfile } from "@/lib/rag";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const session = await auth();

  if (cronSecret !== process.env.CRON_SECRET && session?.user?.role !== "superadmin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const [articles, events, jobs, users] = await Promise.all([
    Article.find({ status: "published", deletedAt: null }).select("_id").lean(),
    Event.find({ status: "published", deletedAt: null }).select("_id").lean(),
    Job.find({ status: "published", deletedAt: null }).select("_id").lean(),
    User.find({ status: "approved" }).select("_id").lean(),
  ]);

  let processed = 0;
  const total = articles.length + events.length + jobs.length + users.length;

  for (const a of articles) {
    await ingestArticle(String(a._id));
    processed++;
    await new Promise((r) => setTimeout(r, 300));
  }
  for (const e of events) {
    await ingestEvent(String(e._id));
    processed++;
    await new Promise((r) => setTimeout(r, 300));
  }
  for (const j of jobs) {
    await ingestJob(String(j._id));
    processed++;
    await new Promise((r) => setTimeout(r, 300));
  }
  for (const u of users) {
    await ingestMemberProfile(String(u._id));
    processed++;
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ success: true, data: { processed, total } });
}
