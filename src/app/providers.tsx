"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Loader from "@/components/ui/loaders";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [UIstate, setUIstate] = useState("loading");

  useEffect(() => {
    // Import AOS only on client side
    import("aos").then((AOS) => {
      AOS.init();
      setUIstate("OK");
    });
  }, []);

  return (
    <ThemeProvider enableSystem attribute="class" defaultTheme="system">
      <React.StrictMode>
        <SessionProvider>
          {UIstate === "loading" ? (
            <div className="flex items-center justify-center m-auto">
              <Loader />
            </div>
          ) : (
            children
          )}
          <Toaster />
        </SessionProvider>
      </React.StrictMode>
    </ThemeProvider>
  );
}
