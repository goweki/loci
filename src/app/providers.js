"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import AOS from "aos";
import Loader from "@/components/atoms/loader";

export default function Providers({ children }) {
  const [UIstate, setUIstate] = useState("loading");
  const { systemTheme, setTheme } = useTheme();

  // onMount
  useEffect(() => {
    if (systemTheme === "dark") {
      // If system's preferred theme is dark
      setTheme("dark");
    } else {
      // If system's preferred theme is light
      setTheme("light");
    }
    AOS.init();
    setUIstate("OK");
  }, []);

  //Render
  return (
    <ThemeProvider enableSystem={true} attribute="class">
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
