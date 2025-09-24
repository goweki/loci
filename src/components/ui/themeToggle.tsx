// "use client";

// import { useEffect, useState } from "react";
// import { useTheme } from "next-themes";
// import { Sun, Moon } from "lucide-react";
// import { Button } from "./button";

// import { VariantProps } from "class-variance-authority";
// import { buttonVariants } from "@/components/ui/button";
// type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

// export default function ThemeToggle({
//   variant = "link",
// }: {
//   variant?: variant;
// }) {
//   const [mounted, setMounted] = useState(false);
//   const { resolvedTheme, setTheme } = useTheme();

//   // onMount
//   useEffect(() => {
//     setTheme(resolvedTheme ? resolvedTheme : "light");
//     setMounted(true);
//   }, []);

//   const toggleTheme = () => {
//     setTheme(resolvedTheme === "dark" ? "light" : "dark");
//   };

//   return mounted ? (
//     <Button
//       id="theme-toggler"
//       onClick={toggleTheme}
//       variant={variant}
//       className="rounded-full outline-none focus:outline-none cursor-pointer"
//     >
//       <span className="sr-only">
//         {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
//       </span>

//       {resolvedTheme === "dark" ? (
//         <Sun className="h-5 w-5" />
//       ) : (
//         <Moon className="h-5 w-5" />
//       )}
//     </Button>
//   ) : null;
// }

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./button";

import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export default function ThemeToggle({
  variant = "link",
}: {
  variant?: ButtonVariant;
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setTheme(resolvedTheme ? resolvedTheme : "light");
    setMounted(true);
  }, [resolvedTheme, setTheme]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return mounted ? (
    <Button id="theme-toggler" onClick={toggleTheme} variant={variant}>
      <span className="sr-only">
        {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
      </span>
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  ) : null;
}
