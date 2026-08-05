import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Footer from "@/components/ui/footer";
import { Navbar, RichNavMenuProps } from "@/components/ui/navbar";
import { getDictionary, isValidLanguage, Language } from "@/lib/i18n";

export default async function UnAuthLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(`/${lang}/dashboard`);
  }

  if (!isValidLanguage(lang)) return null;
  const dict = await getDictionary(lang);

  const navigationLinks: RichNavMenuProps["navigation"] = [
    { type: "link", href: `/${lang}`, label: dict.navbar.home },
    { type: "link", href: `/${lang}/pricing/`, label: dict.navbar.pricing },
  ];

  return (
    <>
      <Navbar navigationLinks={navigationLinks} />
      {children}
      <Footer />
    </>
  );
}
