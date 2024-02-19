"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  const [UIstate, setUIstate] = useState("loading");
  const { systemTheme, setTheme } = useTheme();
  // onMount
  useEffect(() => {
    // if (systemTheme === "dark") {
    //   // The system's preferred theme is dark
    //   // You can switch to the dark theme here if you want
    //   setTheme("dark");
    // } else {
    //   // The system's preferred theme is light
    //   // You can switch to the light theme here if you want
    //   setTheme("light");
    // }
    setUIstate("OK");
  }, []);
  //Render
  return (
    <ThemeProvider
      // enableSystem={true}
      attribute="class"
    >
      <React.StrictMode>
        <SessionProvider>
          {UIstate === "loading" ? (
            <div className="flex flex-col min-h-screen justify-center items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 animate-ping"></div>
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
