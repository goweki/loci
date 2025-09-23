"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiresSubscription = false,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push("/dashboard");
      return;
    }

    if (
      requiresSubscription &&
      session.user.subscription?.status !== "ACTIVE"
    ) {
      router.push("/billing");
      return;
    }
  }, [session, status, requiredRole, requiresSubscription, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
