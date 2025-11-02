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
    <footer className="border-t">
      <div className="max-w-(--breakpoint-xl) mx-auto">
        <div className="py-12 flex flex-col sm:flex-row items-start justify-between gap-x-8 gap-y-10 px-6">
          <div>
            <div className="flex flex-row gap-x-2">
              <BrandSymbol height={24} />{" "}
              <span className="font-semibold text-primary">LOCi</span>
            </div>
            <ul className="mt-6 flex items-center gap-4 flex-wrap">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe Newsletter */}
          <div className="max-w-xs w-full">
            <form className="mt-6 flex flex-col items-center gap-2">
              <Label
                htmlFor="email-address"
                className="w-full text-start italic uppercase font-bold"
              >
                Stay up to date
              </Label>
              <div className="w-full flex flex-row gap-2">
                <Input
                  name="email-address"
                  type="email"
                  placeholder="Enter your email"
                />
                <Button>Subscribe</Button>
              </div>
            </form>
          </div>
        </div>
        <Separator />
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          {/* Copyright */}
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <Link href="/" target="_blank">
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
