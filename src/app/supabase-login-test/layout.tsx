import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Supabase Login Test | MM Digital" },
  robots: { index: false, follow: false },
};

export default function SupabaseLoginTestLayout({ children }: LayoutProps<"/supabase-login-test">) {
  return children;
}
