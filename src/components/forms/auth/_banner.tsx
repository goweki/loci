"use client";

import { SocialIcon } from "react-social-icons";

export function SideBanner() {
  const sm_links: string[] = ["https://www.linkedin.com/in/goweki"];

  return (
    <div className="flex flex-row space-x-4 items-center">
      <div className="pt-1 text-sm">
        Powered by{" "}
        <a
          href="https://goweki.com"
          className="text-emerald-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          KOMOLO
        </a>
      </div>
      {sm_links.map((link, i) => (
        <span key={i} className="h-6 w-6">
          <SocialIcon
            url={link}
            style={{ height: "100%", width: "100%" }}
            target="_blank"
            rel="noopener noreferrer"
          />
        </span>
      ))}
    </div>
  );
}
