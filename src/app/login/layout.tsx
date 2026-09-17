import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Client Login | MM Digital" },
  description: "Secure client access for MM Digital analytics dashboards.",
  alternates: { canonical: "/login/" },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
