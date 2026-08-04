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
  const session = await getServerSession(authOptions);

  const { lang } = await params;
  if (!isValidLanguage(lang)) {
    redirect(`/en/dashboard`);
  }

  if (session) {
    redirect(`/${lang}/dashboard`);
  }

  const dict = await getDictionary(lang);

  const navigationLinks: RichNavMenuProps["navigation"] = [
    { type: "link", href: "/", label: dict.navbar.home },
    { type: "link", href: "/pricing", label: dict.navbar.pricing },
  ];

  return (
    <>
      <Navbar navigationLinks={navigationLinks} />
      {children}
      <Footer />
    </>
  );
}
