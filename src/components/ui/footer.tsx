import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SocialIcon } from "react-social-icons";
import Link from "next/link";
import { BrandSymbol } from "./brand";
import { Label } from "./label";

const footerLinks = [
  {
    title: "Help",
    href: "/contact-us",
  },
  {
    title: "Privacy",
    href: "/privacy",
  },
];

const Footer = () => {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-screen-xl mx-auto">
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
