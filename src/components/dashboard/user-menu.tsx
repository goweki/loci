"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/lib/prisma/generated";

export default function UserMenu() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 bg-background">
        <div className="px-4 py-2 border-b">
          <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
          <p className="text-xs text-muted-foreground">
            {session?.user?.email || ""}
          </p>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="text-foreground">
            Settings
          </Link>
        </DropdownMenuItem>
        {userRole === UserRole.ADMIN && (
          <DropdownMenuItem asChild>
            <Link href="/manager" className="text-foreground">
              Manager
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
