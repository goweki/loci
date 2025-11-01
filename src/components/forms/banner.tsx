"use client";

import { SocialIcon } from "react-social-icons";

export function SideBanner() {
  const sm_links: string[] = ["https://www.linkedin.com/in/nlm-tech"];

  return (
    <div className="flex flex-row space-x-2 space-y-2">
      <div className="pt-1 text-sm">
        Powered by{" "}
        <a
          href="https://nlm-tech.com"
          className="text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          NLM-tech
        </a>
      </div>
      {sm_links.map((link, i) => (
        <span key={i}>
          <SocialIcon
            url={link}
            style={{ height: 25, width: 25 }}
            target="_blank"
            rel="noopener noreferrer"
          />
        </span>
      ))}
    </div>
  );
}
