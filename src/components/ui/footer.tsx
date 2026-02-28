"use client";

import { SocialIcon } from "react-social-icons";
import Link from "next/link";
import { BrandSymbol } from "./brand";
import { useI18n } from "@/lib/i18n";

const Footer = () => {
  const { language } = useI18n();
  const footerLinks = [
    {
      title: "Privacy policy",
      href: `/${language}/privacy-policy`,
    },
  ];

  return (
    <footer className="border-t mt-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="px-6 text-muted-foreground flex flex-col justify-between gap-4 pt-8 text-sm font-medium md:flex-row md:items-center">
          <div className="h-6 w-6">
            <BrandSymbol />
          </div>
          <ul className="flex gap-4">
            {footerLinks.map((link, linkIdx) => (
              <li key={linkIdx} className="hover:text-primary underline">
                <a href={link.href}>{link.title}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6">
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <Link
              href="https://nlm-tech.com"
              target="_blank"
              className="hover:underline"
            >
              NLM-tech
            </Link>
            . All rights reserved.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <div className="h-6 w-6">
              <SocialIcon
                fgColor="white"
                bgColor="black"
                style={{ height: "100%", width: "100%" }}
                url="https://linkedin.com/in/goweki"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
