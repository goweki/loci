// src/app/[lang]/(protected)/settings/page.tsx

import SettingsClient from "@/components/settings/settings-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { Suspense } from "react";
import { isValidLanguage } from "@/lib/i18n";
import { getUserByIdAction } from "@/actions/user.actions";
import { userInclude } from "@/services/user/user.dto";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircleIcon, ArrowLeftIcon, LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const translations = {
  en: {
    title: "Settings",
    subtitle: "Manage your account settings and preferences",
  },
  sw: {
    title: "Mipangilio",
    subtitle: "Dhibiti mipangilio na mapendeleo ya akaunti yako",
  },
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { lang } = await params;

  if (!session?.user?.id) {
    return "invalid session.user.id.... Log in again";
  }

  if (!isValidLanguage(lang)) return;

  const t = translations[lang];

  const [resUser, wabaCredential] = await Promise.all([
    getUserByIdAction(session.user.id, userInclude),
    prisma.wabaAccount.findFirst({
      where: { userId: session.user.id },
      select: { accessTokenEncrypted: true },
    }),
  ]);

  if (!resUser.ok) {
    return;
  }

  const user = resUser.data;

  return user ? (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      <PageTitle title={t.title} subtitle={t.subtitle} />

      <Suspense fallback={<TemplatesSkeleton />}>
        <SettingsClient
          user={user}
          hasWhatsAppCredential={Boolean(wabaCredential?.accessTokenEncrypted)}
        />
      </Suspense>
    </div>
  ) : (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-destructive/20 shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircleIcon
              className="size-7 text-destructive"
              aria-hidden="true"
            />
          </div>

          <CardTitle className="text-xl">Unable to load your account</CardTitle>

          <CardDescription className="max-w-sm">
            We couldn&apos;t find your user profile. Your session may have
            expired, or your account may no longer be available. Please sign in
            again to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground"
          >
            <p className="font-medium text-foreground">Account unavailable</p>
            <p className="mt-1">
              If the problem persists after signing in, please contact support.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full">
            <Link href="/api/auth/signin">
              <LogInIcon className="mr-2 size-4" />
              Sign in again
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-foreground rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-foreground rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-foreground rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}
