import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import Event from "@/lib/models/Event";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";
import { escapeRegex } from "@/lib/utils";
import { purgeExpiredEvents } from "@/lib/server/purge-expired-events";

export async function getArticlesListing(input: {
  page?: number;
  limit?: number;
  tag?: string | null;
  q?: string | null;
}) {
  await connectDB();
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, input.limit ?? 20);
  const tag = input.tag;
  const q = input.q;

  const filter: Record<string, unknown> = { status: "published", deletedAt: null };
  if (tag) filter.tags = tag;
  if (q?.trim()) {
    const trimmed = q.trim();
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const authorIds =
      tokens.length > 0
        ? await User.find({
            status: "approved",
            $and: tokens.map((t) => ({ name: new RegExp(escapeRegex(t), "i") })),
          }).distinct("_id")
        : [];
    if (authorIds.length > 0) {
      filter.$or = [{ $text: { $search: trimmed } }, { authorId: { $in: authorIds } }];
    } else {
      filter.$text = { $search: trimmed };
    }
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("authorId", "name image")
      .select("title slug excerpt coverImage tags readTime createdAt authorId")
      .lean(),
    Article.countDocuments(filter),
  ]);

  return {
    articles: JSON.parse(JSON.stringify(articles)) as unknown[],
    meta: { page, limit, total },
  };
}

export async function getJobsListing(input: {
  page?: number;
  limit?: number;
  type?: string | null;
  q?: string | null;
}) {
  await connectDB();
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, input.limit ?? 20);
  const type = input.type;
  const q = input.q?.trim();
  const now = new Date();
  const filter: Record<string, unknown> = {
    status: "published",
    deletedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
  if (type) filter.type = type;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { company: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug company location type salary applyUrl applyEmail applyPhone tags educationOrSkills expiresAt")
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs: JSON.parse(JSON.stringify(jobs)) as unknown[],
    meta: { page, limit, total },
  };
}

/** Published jobs still open for applications (not past `expiresAt` when set). */
export async function countActivePublishedJobs(): Promise<number> {
  await connectDB();
  const now = new Date();
  return Job.countDocuments({
    status: "published",
    deletedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
}

export async function getEventsListing(input: { page?: number; limit?: number; q?: string | null }) {
  await connectDB();
  await purgeExpiredEvents();
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(80, Math.max(1, input.limit ?? 20));
  const q = input.q?.trim();
  const now = new Date();

  const baseFilter = { status: "published" as const, deletedAt: null, endDate: { $gte: now } };
  const filter =
    q && q.length > 0
      ? {
          ...baseFilter,
          $or: [
            { title: new RegExp(escapeRegex(q), "i") },
            { description: new RegExp(escapeRegex(q), "i") },
            { venue: new RegExp(escapeRegex(q), "i") },
            { tags: new RegExp(escapeRegex(q), "i") },
          ],
        }
      : baseFilter;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug description startDate venue capacity tags")
      .lean(),
    Event.countDocuments(filter),
  ]);

  return {
    events: JSON.parse(JSON.stringify(events)) as unknown[],
    meta: { page, limit, total },
  };
}
