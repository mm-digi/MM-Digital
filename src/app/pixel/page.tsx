import { redirect } from "next/navigation";
import { ClientLights } from "@/pixel/components/ClientLights";
import { OfficeApp } from "@/pixel/components/OfficeApp";
import { getSession } from "@/lib/auth";
import { getCurrentStaff } from "@/pixel/lib/auth";
import { withPixel } from "@/pixel/lib/db";
import { buildSnapshot } from "@/pixel/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PixelOfficePage() {
  const session = await getSession();
  if (!session) redirect("/login/?redirect=/pixel/");
  if (session.role !== "staff") redirect("/login/?error=forbidden");

  return withPixel(async () => {
    const staff = await getCurrentStaff();
    if (!staff) redirect("/team-access/");
    if (Number(staff.plain_mode) === 1) redirect("/pixel/plain/");
    const snapshot = await buildSnapshot(staff);
    return <OfficeApp snapshot={snapshot} presentation="office" lights={<ClientLights />} />;
  });
}
