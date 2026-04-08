import connectDB from "@/lib/db";
import Event from "@/lib/models/Event";

/**
 * Hard-deletes published (and archived) listings whose end date is in the past,
 * so /events and the homepage only reflect current or upcoming programs.
 */
export async function purgeExpiredEvents(): Promise<number> {
  await connectDB();
  const now = new Date();
  const res = await Event.deleteMany({
    deletedAt: null,
    endDate: { $lt: now },
    status: { $in: ["published", "archived"] },
  });
  return res.deletedCount ?? 0;
}
