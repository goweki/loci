import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Footer from "@/components/ui/footer";
import { Navbar, NavbarNavLink } from "@/components/ui/navbar";
import { getDictionary, isValidLanguage, Language } from "@/lib/i18n";
import ComingSoon from "@/components/landing-page/coming-soon";

export default async function UnAuthLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const { lang } = await params;

  if (!isValidLanguage(lang)) return null;

  const dict = await getDictionary(lang);

  const navigationLinks: NavbarNavLink[] = [
    { href: "/", label: dict.navbar.home },
    { href: "/pricing", label: dict.navbar.pricing },
  ];

  return (
    <>
      {/* <Navbar navigationLinks={navigationLinks} />
      {children}
      <Footer /> */}
      <ComingSoon />
    </>
  );
}
