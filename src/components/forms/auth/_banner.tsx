"use client";

import { SocialIcon } from "react-social-icons";

export function SideBanner() {
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
    </div>
  );
}
