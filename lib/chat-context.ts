import "server-only";
import connectDB from "./db";
import User from "./models/User";
import Notice from "./models/Notice";
import Job from "./models/Job";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Keyword / batch-aware member lookup to supplement vector RAG. */
export async function searchMembersStructured(message: string, limit: number): Promise<string> {
  const trimmed = message.trim();
  if (trimmed.length < 2) return "";

  await connectDB();

  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  const words = trimmed
    .toLowerCase()
    .split(/\W+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !/^(who|what|when|where|which|how|are|the|and|for|with|from|about|tell|me|our|any|some|list|show|find|search|alumni|member|members|people|names|all|give|can|you|please|want|know)$/i.test(
          w
        )
    )
    .slice(0, 8);

  if (!yearMatch && words.length === 0) return "";

  const orClause = (w: string) => {
    const rx = new RegExp(escapeRegex(w), "i");
    return [
      { name: rx },
      { "profile.profession": rx },
      { "profile.city": rx },
      { "profile.company": rx },
      { "profile.country": rx },
    ];
  };

  let filter: Record<string, unknown>;
  if (yearMatch && words.length > 0) {
    filter = {
      status: "approved",
      $and: [
        { "profile.slcSeeBatch": parseInt(yearMatch[0], 10) },
        { $or: words.flatMap(orClause) },
      ],
    };
  } else if (yearMatch) {
    filter = { status: "approved", "profile.slcSeeBatch": parseInt(yearMatch[0], 10) };
  } else {
    filter = { status: "approved", $or: words.flatMap(orClause) };
  }

  const users = await User.find(filter).sort({ name: 1 }).limit(limit).select("name profile").lean();

  const rows = users as {
    name: string;
    profile?: {
      profession?: string;
      company?: string;
      city?: string;
      country?: string;
      slcSeeBatch?: number;
      schoolPeriod?: string;
    };
  }[];

  if (rows.length === 0) return "";

  const lines = rows.map((u, i) => {
    const p = u.profile ?? {};
    const bits = [
      p.profession && `Profession: ${p.profession}`,
      p.company && `Organization: ${p.company}`,
      p.city && `Location: ${p.city}${p.country ? `, ${p.country}` : ""}`,
      p.slcSeeBatch != null && `SLC/SEE batch: ${p.slcSeeBatch}`,
      p.schoolPeriod && `School period: ${p.schoolPeriod}`,
    ].filter(Boolean);
    const q = encodeURIComponent(u.name.split(" ")[0] ?? u.name);
    return `[M${i + 1}] MEMBER: ${u.name}\n${bits.join(" · ")}\nDirectory: /members?q=${q}`;
  });

  return `Member directory matches (structured search):\n${lines.join("\n\n")}`;
}

export async function fetchNoticesContext(): Promise<string> {
  await connectDB();
  const now = new Date();
  const notices = await Notice.find({
    isActive: true,
    deletedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ sortOrder: -1, createdAt: -1 })
    .limit(6)
    .select("title body linkUrl linkLabel")
    .lean();

  if (notices.length === 0) return "";

  const blocks = notices.map((n, i) => {
    const link =
      n.linkUrl && typeof n.linkUrl === "string"
        ? `\nLink: ${n.linkUrl}${n.linkLabel ? ` (${n.linkLabel})` : ""}`
        : "";
    const body = String(n.body ?? "").slice(0, 500);
    return `[N${i + 1}] NOTICE: ${n.title}\n${body}${link}`;
  });

  return `Active site notices:\n${blocks.join("\n\n")}`;
}

/** Keyword search over published job listings (supplements vector RAG). */
export async function searchJobsStructured(message: string, limit: number): Promise<string> {
  const trimmed = message.trim();
  if (trimmed.length < 2) return "";

  const words = trimmed
    .toLowerCase()
    .split(/\W+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !/^(who|what|when|where|which|how|are|the|and|for|with|from|about|tell|me|our|any|some|list|show|find|search|job|jobs|opening|openings|work|career|careers|hiring|please|can|you)$/i.test(
          w
        )
    )
    .slice(0, 8);

  if (words.length === 0) return "";

  await connectDB();

  const ors = words.flatMap((w) => {
    const rx = new RegExp(escapeRegex(w), "i");
    return [
      { title: rx },
      { description: rx },
      { company: rx },
      { location: rx },
      { educationOrSkills: rx },
    ];
  });

  const jobs = await Job.find({
    status: "published",
    deletedAt: null,
    $or: ors,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title slug company location type salary description")
    .lean();

  if (jobs.length === 0) return "";

  const lines = jobs.map((j, i) => {
    const desc = String(j.description ?? "").slice(0, 220).trim();
    return `[J${i + 1}] JOB: ${j.title} at ${j.company}\n${j.location} · ${j.type}${j.salary ? ` · ${j.salary}` : ""}\n${desc}${desc.length >= 220 ? "…" : ""}\nLink: /jobs#${j.slug}`;
  });

  return `Job board matches (keyword search):\n${lines.join("\n\n")}`;
}
