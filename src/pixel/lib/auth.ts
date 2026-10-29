import { getSession } from "@/lib/auth";
import { sqlOne, type StaffRow } from "@/pixel/lib/db";

const EMAIL_TO_SLUG: Record<string, string> = {
  "tash@mm-digi.co.uk": "tash",
  "mariette@mm-digi.co.uk": "mariette",
  "maximilian@mm-digi.co.uk": "max",
  "natasha@mm-digi.co.uk": "natasha",
};

// Who is online now comes from live presence in the browser, so opening the
// office no longer writes a "last seen" time to the shared office file.
export async function getCurrentStaff(): Promise<StaffRow | null> {
  const session = await getSession();
  if (!session || session.role !== "staff") return null;
  const slug = EMAIL_TO_SLUG[session.username.toLowerCase()];
  if (!slug) return null;
  return sqlOne<StaffRow>("select * from staff where slug = ?", slug) ?? null;
}
