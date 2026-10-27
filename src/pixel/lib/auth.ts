import { getSession } from "@/lib/auth";
import { sqlOne, sqlRun, type StaffRow } from "@/pixel/lib/db";

const EMAIL_TO_SLUG: Record<string, string> = {
  "tash@mm-digi.co.uk": "tash",
  "mariette@mm-digi.co.uk": "mariette",
  "maximilian@mm-digi.co.uk": "max",
  "natasha@mm-digi.co.uk": "natasha",
};

export async function getCurrentStaff(): Promise<StaffRow | null> {
  const session = await getSession();
  if (!session || session.role !== "staff") return null;
  const slug = EMAIL_TO_SLUG[session.username.toLowerCase()];
  if (!slug) return null;
  const staff = sqlOne<StaffRow>("select * from staff where slug = ?", slug);
  if (!staff) return null;
  sqlRun("update staff set last_seen = ? where id = ?", new Date().toISOString(), staff.id);
  return sqlOne<StaffRow>("select * from staff where id = ?", staff.id) ?? null;
}
