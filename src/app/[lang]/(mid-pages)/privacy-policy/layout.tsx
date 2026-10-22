import Footer from "@/components/ui/footer";
import { Navbar, RichNavMenuProps } from "@/components/ui/navbar";
import { getDictionary, isValidLanguage } from "@/lib/i18n";

export default async function NavBarLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) return null;
  const dict = await getDictionary(lang);

  const navigationLinks: RichNavMenuProps["navigation"] = [
    { type: "link", href: `/${lang}`, label: dict.navbar.home },
  ];

  return (
    <>
      <Navbar navigationLinks={navigationLinks} />
      {children}
      <Footer />
    </>
  );
}
