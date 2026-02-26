import { SideBanner } from "../forms/auth/_banner";
import { BrandSymbol } from "../ui/brand";
import { headers } from "next/headers";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { House } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface AuthLayoutCopy {
  title: string;
  subtitle: string;
}

export default async function AuthLayout({
  copy,
  children,
}: {
  copy: AuthLayoutCopy;
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const { title, subtitle } = copy;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <section className="min-h-screen flex items-stretch bg-popover">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "fixed top-4 left-4 z-50 w-fit p-2 border bg-background/50 backdrop-blur-xs text-foreground",
        )}
      >
        <House className="text-primary" size={24} /> Home
      </Link>

      <div
        className="lg:flex w-1/2 hidden text-white bg-gray-700 bg-no-repeat relative items-center bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('https://images.unsplash.com/photo-1577495508048-b635879837f1?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=675&q=80')] 
         bg-center bg-cover bg-fixed"
      >
        <div className="w-full px-24 z-10">
          <h1 className="text-4xl font-light text-left tracking-wide">
            {title}
          </h1>
          <p className="text-2xl my-4 italic">{subtitle}</p>
        </div>
        <div className="bottom-0 absolute p-4 text-center right-0 left-0 flex justify-center items-center">
          <SideBanner />
        </div>
      </div>
      <div className="lg:w-1/2 w-full flex items-center justify-center text-center px-4 sm:px-8 md:px-16 z-0">
        <div className="w-full py-6 z-20 space-y-6 max-w-sm m-auto">
          <div className="space-y-1">
            <div className="m-auto w-fit">
              <BrandSymbol height={24} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
